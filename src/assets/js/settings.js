
 const ipc = window.api;

 function updatePositionInputs() {
     const posType = document.getElementById('position').value;
     const isCustom = posType === 'custom';
     document.getElementById('position-inputs').style.display = isCustom ? 'flex' : 'none';
 }
 document.getElementById('position').addEventListener('change', updatePositionInputs);

 function createCoinRow(coin = '', currency = 'USDT', average = 15) {
     const row = document.createElement('div');
     row.className = 'coin-row';
     row.innerHTML = `
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
         average: parseInt(row.querySelector('.coin-average').value) || 15
     }));
     const posType = document.getElementById('position').value;
     const settings = {
         version: "1.0.0",
         position: {
             type: posType,
             x: parseInt(document.getElementById('positionX').value) || 0,
             y: parseInt(document.getElementById('positionY').value) || 0
         },
         cryptoList
     };
     if (ipc) ipc.send('apply-settings', settings);
 };

 function loadSettings(settings) {
     document.getElementById('position').value = settings.position.type;
     document.getElementById('positionX').value = settings.position.x;
     document.getElementById('positionY').value = settings.position.y;
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