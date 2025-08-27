
 const ipc = window.api;

 function updatePositionInputs() {
     const posType = document.getElementById('position').value;
     const isCustom = posType === 'custom';
     document.getElementById('position-inputs').style.display = isCustom ? 'flex' : 'none';
 }
 document.getElementById('position').addEventListener('change', updatePositionInputs);

 function createCoinRow(coin = '', currency = 'USDT', average = 1) {
     const row = document.createElement('div');
     row.className = 'coin-row';
     row.innerHTML = `
     <div class="coin-row-drag-handle" onmousedown="rowMouseDown(event, this)">
        <i class="bx bx-dots-vertical-rounded n-margin" draggable="false" style="margin-left: -4px;"></i>
        <i class="bx bx-dots-vertical-rounded n-margin" draggable="false" style="margin-left: -14px;margin-right: -4px;"></i>
     </div>
     <div class="coin-row-inner">
         <i class="bx bx-bitcoin"></i><label>Coin:</label>
         <input type="text" class="pill-input coin-name" value="${coin}" placeholder="BTC">
         <i class="bx bx-dollar"></i>
         <label>Currency:</label>
         <input type="text" class="pill-input coin-currency" value="${currency}" placeholder="USDT">
         <i class="bx bx-chart-trend"></i>
         <label>Decision Average:</label>
         <input type="number" class="pill-input coin-average" value="${average}" min="1" style="width:40px;">
         <span style="margin-left:-3px;">s</span>
     </div>
     <button type="button" class="remove-coin-btn">
             <i class="bx bx-trash-x n-margin"></i>
     </button>
     `;
     row.querySelector('.remove-coin-btn').onclick = () => row.remove();
     return row;
 }
 document.getElementById('addCoin').onclick = () => {
     document.getElementById('coinList').appendChild(createCoinRow());
     const coinList = document.getElementById('coinList');
     coinList.scrollTo({
         top: coinList.scrollHeight,
         behavior: 'smooth'
     });
 };

 document.getElementById('resetSettings').onclick = () => {
     if (ipc) ipc.send('get-settings');
 };
 // Form submit
 document.getElementById('settingsForm').onsubmit = (e) => {
     e.preventDefault();
     const coinRows = document.querySelectorAll('.coin-row');
     const cryptoList = Array.from(coinRows).map(row => ({
         coin: row.querySelector('.coin-name').value.trim() || 'BTC',
         currency: row.querySelector('.coin-currency').value.trim() || 'USDT',
         average: parseInt(row.querySelector('.coin-average').value) || 1
     }));
     const posType = document.getElementById('position').value;
     const settings = {
         version: "1.0.1",
         position: {
             type: posType,
             x: parseInt(document.getElementById('positionX').value) || 0,
             y: parseInt(document.getElementById('positionY').value) || 0
         },
         alwaysOnTop: document.getElementById('alwaysOnTop').checked,
         cryptoList
     };
     if (ipc) ipc.send('apply-settings', settings);
 };

 function loadSettings(settings) {
     document.getElementById('position').value = settings.position.type;
     document.getElementById('positionX').value = settings.position.x;
     document.getElementById('positionY').value = settings.position.y; //alwaysOnTop
     if(settings.alwaysOnTop) document.getElementById('alwaysOnTop').checked = true
     updatePositionInputs();
     const coinList = document.getElementById('coinList');
     coinList.innerHTML = '';
     (settings.cryptoList || []).forEach(coin => {
         coinList.appendChild(createCoinRow(coin.coin, coin.currency, coin.average));
     });
     coinList.scrollTo({
         top: coinList.scrollHeight,
         behavior: 'smooth'
     });
 }
 if (ipc) {
     ipc.receive('current-settings', (settings) => loadSettings(settings));
     window.addEventListener('DOMContentLoaded', () => {
         ipc.send('get-settings');
     });
 }

 // Darg and Drop

let isDragging = false;
let currentItem = null;
let containerOffsetY = 0;
let initY = 0;

const container = document.getElementById('coinList');

function rowMouseDown(e, element) {
    isDragging = true;
    currentItem = element.parentElement;
    containerOffsetY = currentItem.offsetTop;
    currentItem.classList.add("dragging");
    currentItem.style.top = containerOffsetY + "px";
    initY = e.clientY;
    rowMouseMove(e);
}

function rowMouseMove(e) {
    if (isDragging && currentItem) {
        currentItem.classList.remove("insert-animation");
        let newTop = containerOffsetY - (initY - e.clientY);
        // TODO: Add a limit to the top and bottom of the container
        currentItem.style.top = newTop + "px";

        let itemSibilings = [
        ...document.querySelectorAll(".coin-row:not(.dragging)"),
        ];
        let nextItem = itemSibilings.find((sibiling) => {
            return (
                e.clientY <=
                sibiling.offsetTop + sibiling.offsetHeight
            );
        });

        itemSibilings.forEach((sibiling) => {
            sibiling.style.marginTop = "0px";
        });

        if (nextItem) {
        nextItem.style.marginTop = currentItem.offsetHeight + 12 + "px";
        }
        container.insertBefore(currentItem, nextItem);
    }
    
}

function rowMouseUp() {
    if (currentItem) {
        currentItem.classList.remove("dragging");
        currentItem.classList.remove("insert-animation");
        currentItem.style.top = "auto";
        currentItem = null;
        isDragging = false;
        let itemSibilings = [
            ...document.querySelectorAll(".coin-row:not(.dragging)"),
        ];

        itemSibilings.forEach((sibiling) => {
            sibiling.style.marginTop = "0";
        });
    }
}

document.addEventListener("mousemove", rowMouseMove);
document.addEventListener("mouseup", rowMouseUp);