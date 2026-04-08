const fs = require('fs');
let content = fs.readFileSync('Frontend/src/modules/DeliveryV2/pages/DeliveryHomeV2.jsx', 'utf8');
const lines = content.split('\n');
for(let i=560; i<640; i++) {
    console.log(i + ': ' + lines[i]);
}