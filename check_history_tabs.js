const fs = require('fs');
const lines = fs.readFileSync('Frontend/src/modules/DeliveryV2/pages/HistoryV2.jsx', 'utf8').split('\n');
for(let i=140; i<155; i++) { console.log(lines[i]); }