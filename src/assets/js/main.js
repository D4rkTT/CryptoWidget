const getSymbolData = async (symbol) => {
    var req = await fetch(`https://api.binance.com/api/v3/exchangeInfo?symbol=${symbol}`)
    var res = await req.json()
    return {baseAsset: res.symbols[0].baseAsset, quoteAsset: res.symbols[0].quoteAsset}
}

const getSymbolPrice = async (symbol, windowSize) => {
    var req = await fetch(`https://api.binance.com/api/v3/ticker?symbol=${symbol}&windowSize=${windowSize}`)
    var res = await req.json()
    return {lastPrice: res.lastPrice, priceChangePercent: parseFloat(res.priceChangePercent)}
}

const getSymbolBookTicker = async (symbol) => {
    var req = await fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${symbol}`)
    var res = await req.json()
    return res
}

const updateClass = (element1, element2, current, previous) => {
    element1.removeClass("green red");
    element2.removeClass("green red");

    if (current > previous) {
        element1.addClass("green");
        element2.addClass("green");
    } else if (current < previous) {
        element1.addClass("red");
        element2.addClass("red");
    }
}

const analyzeMarket = (marketData) => {
    let totalBidPrice = 0, totalBidQty = 0;
    let totalAskPrice = 0, totalAskQty = 0;
    
    for (const entry of marketData) {
        totalBidPrice += entry.bidPrice;
        totalBidQty += entry.bidQty;
        totalAskPrice += entry.askPrice;
        totalAskQty += entry.askQty;
    }

    const avgBidPrice = totalBidPrice / marketData.length;
    const avgBidQty = totalBidQty / marketData.length;
    const avgAskPrice = totalAskPrice / marketData.length;
    const avgAskQty = totalAskQty / marketData.length;
    
    if (avgBidPrice > avgAskPrice && avgBidQty > avgAskQty) {
        return 2; // Strong Buy
    } else if (avgBidPrice > avgAskPrice) {
        return 1; // Weak Buy
    } else if (avgAskPrice > avgBidPrice && avgAskQty > avgBidQty) {
        return -2; // Strong Sell
    } else if (avgAskPrice > avgBidPrice) {
        return -1; // Weak Sell
    } else {
        return 0; // No Action
    }
}

const updateDecision = (container, marketAnalysis) =>{
    var decisionText = container.find(".trading-decision")
    var decisionChart = container.find(".trading-charts")
    var decisions = {"-2": "Strong Sell", "-1": "Weak Sell", "0": "No Action", "1": "Weak Buy", "2": "Strong Buy"}
    decisionText.text(decisions[marketAnalysis])
    decisionChart.children().removeClass("chart-animation")
    decisionChart.children().removeClass("chart-fill")
    decisionText.removeClass("green red");
    switch(marketAnalysis){
        case -2:
            decisionText.addClass("red");
            decisionChart.children()[0].classList.add("chart-fill")
            decisionChart.children()[1].classList.add("chart-fill")
            break;
        case -1:
            decisionText.addClass("red");
            decisionChart.children()[1].classList.add("chart-fill")
            break;
        case 0:
            break;
        case 1:
            decisionText.addClass("green");
            decisionChart.children()[2].classList.add("chart-fill")
            break;
        case 2:
            decisionText.addClass("green");
            decisionChart.children()[2].classList.add("chart-fill")
            decisionChart.children()[3].classList.add("chart-fill")
            break;
    }
}

const appendWidget = async (data) => {
    const symbol = data.symbol
    const avg = data.average
    var symbolData = await getSymbolData(symbol)
    var template = `<div class="widget-container" data-period="15m" style="display: none;">
                        <div class="mini-btn">-</div>
                        <div class="left">
                            <div class="symbol-name">
                                <span class="base-name">${symbolData.baseAsset}</span>
                                <span class="quote-name">${symbolData.quoteAsset}</span>
                            </div>
                            <div class="symbol-price">
                                <span class="last-price">0$</span>
                                <span class="change-percentage">0%</span>
                            </div>
                        </div>
                        <div class="right">
                            <div class="trading-container">
                                <span class="trading-headtext">Trading Decision</span>
                                <div class="trading-charts">
                                    <div class="trading-chart chart-red chart-animation" data-index="0"></div>
                                    <div class="trading-chart chart-red chart-animation" data-index="1"></div>
                                    <div class="trading-chart chart-green chart-animation" data-index="2"></div>
                                    <div class="trading-chart chart-green chart-animation" data-index="3"></div>
                                </div>
                                <span class="trading-decision">Calculating...</span>
                            </div>
                            <ul class="time-periods">
                                <li class="active">15m</li>
                                <li>1h</li>
                                <li>6h</li>
                                <li>1d</li>
                                <li>7d</li>
                            </ul>
                            <div class="right-price" style="display: none;">
                                <span class="right-last-price">0$</span>
                                <span class="right-change-percentage">0%</span>
                            </div>
                        </div>
                    </div>`
    var Jtemplate = $(template)

    Jtemplate.mouseenter(function(){
        window.api.send("focus", true)
    })
    
    Jtemplate.mouseleave(function(){
        window.api.send("focus", false)
    })

    $('.app').append(Jtemplate)
    Jtemplate.show(100)
    var price = Jtemplate.find(".last-price")
    var rprice = Jtemplate.find(".right-last-price")
    fitty(".last-price", {minSize:1, maxSize:32})
    var percentage = Jtemplate.find(".change-percentage")
    var rpercentage = Jtemplate.find(".right-change-percentage")
    var tradingContainer = Jtemplate.find(".trading-container")
    Jtemplate.find('.time-periods li').on('click', function(){
        Jtemplate.attr("data-period", this.innerText)
        $(this).toggleClass("active");
        $(this).siblings().removeClass("active");
    })

    Jtemplate.find('.mini-btn').on('click', function(){
        var parent = this.parentElement
        var collapsed = parent.classList.contains("collapsed")
        var tradingText = parent.getElementsByClassName('trading-headtext')
        var tradingDecision = parent.getElementsByClassName('trading-decision')
        var timePeriods = parent.getElementsByClassName('time-periods')
        var symbolPrice = parent.getElementsByClassName('symbol-price')
        var rightSymbolPrice = parent.getElementsByClassName('right-price')
        window.mini = this
        if(!collapsed){
            $(parent).animate({height: "75px"}, 200)
            $(tradingText).fadeOut(200)
            $(tradingDecision).fadeOut(200)
            $(timePeriods).fadeOut(200)
            $(symbolPrice).fadeOut(200)
            $(rightSymbolPrice).fadeIn(200)
            parent.classList.add("collapsed")
        }else{
            $(parent).animate({height: "140px"}, 200)
            $(tradingText).fadeIn(200)
            $(tradingDecision).fadeIn(200)
            $(timePeriods).fadeIn(200)
            $(symbolPrice).fadeIn(200)
            $(rightSymbolPrice).fadeOut(200)
            parent.classList.remove("collapsed")
        }
    })
    var lastPrice = 0
    setInterval(async ()=>{
        var priceData = await getSymbolPrice(symbol, Jtemplate.attr("data-period"))
        let formattedPrice = "$" + parseFloat(priceData.lastPrice).toFixed(2);
        let changePercent = priceData.priceChangePercent + "%";

        price.text(formattedPrice);
        rprice.text(formattedPrice);
        percentage.text(changePercent);
        rpercentage.text(changePercent);

        updateClass(price, rprice, priceData.lastPrice, lastPrice);
        updateClass(percentage, rpercentage, priceData.priceChangePercent, 0);

        lastPrice = priceData.lastPrice
    }, 1000)

    var marketData = []
    setInterval(async ()=>{
        try {
            const data = await getSymbolBookTicker(symbol);

            const processedData = {
                bidPrice: parseFloat(data.bidPrice),
                bidQty: parseFloat(data.bidQty),
                askPrice: parseFloat(data.askPrice),
                askQty: parseFloat(data.askQty)
            };

            if (marketData.length >= avg) {
                marketData.shift();
            }
            marketData.push(processedData);

            if (marketData.length === avg) {
                const decision = analyzeMarket(marketData);
                updateDecision(Jtemplate, decision)
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, 1000)
}

