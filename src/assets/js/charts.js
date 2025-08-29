class CandlestickChart {
    constructor(canvas, symbol, template) {
        this.symbol = symbol;
        this.template = template;
        this.canvas = canvas;

        this.statsElement = null

        this.ctx = null;
        this.data = [];
        this.margin = { top: 0, right: 5, bottom: 0, left: 5 };
        this.width = 0;
        this.height = 0;
        
        this.minPrice = 0;
        this.maxPrice = 0;
        this.priceRange = 0;
        
        this.startTime = 0;
        this.endTime = 0;
        this.timeRange = 0;

        this.setupElements()
        this.setupCanvas(this.canvas);
        this.startAutoUpdate()
    }

    setupElements(){
        this.statsElement = this.template.find('.candle-stats')
    }

    setupCanvas(canvas) {
        this.ctx = canvas.getContext('2d');
        this.handleResize();
    }

    handleResize() {
        const container = this.canvas.parentElement;
        this.width = container.clientWidth - 5;
        this.height = container.clientHeight - 5;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        if (this.data.length > 0) {
            this.render();
        }
    }

    async fetchData() {
        const symbol = this.symbol;
        var interval = this.template.attr("data-period").toLowerCase();

        try {
            if(interval == "7d") interval = "1w"
            const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=30`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.length === 0) {
                throw new Error('No data received from Binance API');
            }
            this.processData(data, symbol, interval);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    processData(data) {
        this.data = data.map(candle => ({
            time: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
        }));
        this.calculateScales();
        this.render();
        this.updatePrice();
    }

    updatePrice() {
        var lastCandle = this.data[this.data.length - 1]
        let open = lastCandle.open.toFixed(2),
        close = lastCandle.close.toFixed(2),
        high = lastCandle.high.toFixed(2),
        low = lastCandle.low.toFixed(2),
        change = (((lastCandle.close / lastCandle.open) * 100) - 100).toFixed(2);

        const isGreen = lastCandle.close >= lastCandle.open;
        const color = isGreen ? 'greenc' : 'redc';
        let statsText = `Open: <span class="${color}">${open}</span> High: <span class="${color}">${high}</span> Low: <span class="${color}">${low}</span> Change: <span class="${color}">${change}%</span>`
        this.statsElement.html(statsText)

    }

    calculateScales() {
        if (this.data.length === 0) return;
        this.minPrice = Math.min(...this.data.map(d => d.low));
        this.maxPrice = Math.max(...this.data.map(d => d.high));
        this.priceRange = this.maxPrice - this.minPrice;
        const padding = this.priceRange * 0.05;
        this.minPrice -= padding;
        this.maxPrice += padding;
        this.priceRange = this.maxPrice - this.minPrice;
        this.startTime = this.data[0].time;
        this.endTime = this.data[this.data.length - 1].time;
        this.timeRange = this.endTime - this.startTime;
    }

    render() {
        if (this.data.length === 0) return;
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawGrid();
        this.drawCurrentPriceLine();
        this.drawCandlesticks();
    }

    drawBackground() {
        this.ctx.fillStyle = '#ffffff00';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 2]);

        const priceStep = this.priceRange / 10;
        for (let i = 0; i <= 10; i++) {
            const price = this.minPrice + (priceStep * i);
            const y = this.priceToY(price);
            this.ctx.beginPath();
            this.ctx.moveTo(this.margin.left, y);
            this.ctx.lineTo(this.width - this.margin.right, y);
            this.ctx.stroke();
        }

        const timeStep = this.timeRange / 10;
        for (let i = 0; i <= 10; i++) {
            const time = this.startTime + (timeStep * i);
            const x = this.timeToX(time);
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.margin.top);
            this.ctx.lineTo(x, this.height - this.margin.bottom);
            this.ctx.stroke();
        }

        this.ctx.setLineDash([]);
    }

    drawCandlesticks() {
        this.data.forEach(candle => {
            const x = this.timeToX(candle.time);
            const openY = this.priceToY(candle.open);
            const highY = this.priceToY(candle.high);
            const lowY = this.priceToY(candle.low);
            const closeY = this.priceToY(candle.close);

            const isGreen = candle.close >= candle.open;
            const color = isGreen ? '#4FFFB3' : '#FF4F4F';
            const fillColor = isGreen ? '#4FFFB3' : '#FF4F4F';

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, highY);
            this.ctx.lineTo(x, lowY);
            this.ctx.stroke();

            const bodyWidth = Math.max(2, (this.width - this.margin.left - this.margin.right) / this.data.length * 0.8);
            const bodyHeight = Math.abs(closeY - openY);
            const bodyY = Math.min(openY, closeY);

            if (bodyHeight > 0) {
                this.ctx.fillStyle = fillColor;
                this.ctx.fillRect(x - bodyWidth/2, bodyY, bodyWidth, bodyHeight);
                this.ctx.strokeStyle = color;
                this.ctx.strokeRect(x - bodyWidth/2, bodyY, bodyWidth, bodyHeight);
            } else {
                this.ctx.strokeStyle = color;
                this.ctx.beginPath();
                this.ctx.moveTo(x - bodyWidth/2, bodyY);
                this.ctx.lineTo(x + bodyWidth/2, bodyY);
                this.ctx.stroke();
            }
        });
    }

    drawCurrentPriceLine() {
        if (this.data.length === 0) return;

        const currentPrice = this.data[this.data.length - 1].close;
        const y = this.priceToY(currentPrice);
        this.ctx.save();
        this.ctx.strokeStyle = '#636363ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, y);
        this.ctx.lineTo(this.width - this.margin.right, y);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawAxes() {
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.margin.left, this.height - this.margin.bottom);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(this.margin.left, this.height - this.margin.bottom);
        this.ctx.lineTo(this.width - this.margin.right, this.height - this.margin.bottom);
        this.ctx.stroke();
    }

    priceToY(price) {
        return this.height - this.margin.bottom - 
               ((price - this.minPrice) / this.priceRange) * 
               (this.height - this.margin.top - this.margin.bottom);
    }

    timeToX(time) {
        return this.margin.left + 
               ((time - this.startTime) / this.timeRange) * 
               (this.width - this.margin.left - this.margin.right);
    }


    startAutoUpdate() {
        this.fetchData();
        this.autoUpdateInterval = setInterval(() => {
            this.fetchData();
            this.handleResize();
        }, 500);
    }
}
