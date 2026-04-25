const fs = require('fs');
const path = 'c:/Users/Abcom/Desktop/DardeComer/Backend/src/modules/food/admin/services/admin.service.js';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filter.status = status;
    }`;

const replacement = `    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        filter.status = status;
    }
    if (query.view === 'pending-dining') {
        filter.pendingDiningSettings = { $exists: true, $ne: null };
    }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully patched!');
} else {
    console.log('Target not found!');
    // Try with CRLF
    const targetCRLF = target.replace(/\n/g, '\r\n');
    const replacementCRLF = replacement.replace(/\n/g, '\r\n');
    if (content.includes(targetCRLF)) {
        content = content.replace(targetCRLF, replacementCRLF);
        fs.writeFileSync(path, content);
        console.log('Successfully patched (CRLF)!');
    } else {
        console.log('Target still not found!');
        // Show actual snippet
        const index = content.indexOf('export async function getRestaurants');
        if (index !== -1) {
            console.log('Actual snippet:', JSON.stringify(content.substring(index, index + 300)));
        }
    }
}
