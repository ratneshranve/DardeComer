const fs = require('fs');
let content = fs.readFileSync('Frontend/src/modules/DeliveryV2/pages/DeliveryHomeV2.jsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('System Online'));
for(let i=Math.max(0, idx-15); i<idx+15; i++) {
    console.log(i + ': ' + lines[i]);
}