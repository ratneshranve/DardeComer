const fs = require('fs');
const path = 'c:/Users/Abcom/Desktop/DardeComer/Backend/src/modules/food/admin/services/admin.service.js';
let content = fs.readFileSync(path, 'utf8');

const target = `    if (body.name !== undefined || body.restaurantName !== undefined) {
        const name = toStr(body.name !== undefined ? body.name : body.restaurantName);
        if (!name) throw new ValidationError('Restaurant name cannot be empty');
        doc.restaurantName = name;
    }`;

const replacement = `    if (body.name !== undefined || body.restaurantName !== undefined) {
        const name = toStr(body.name !== undefined ? body.name : body.restaurantName);
        if (!name) throw new ValidationError('Restaurant name cannot be empty');
        doc.restaurantName = name;
    }
    if (body.status !== undefined && ['pending', 'approved', 'rejected'].includes(body.status)) {
        doc.status = body.status;
    }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully patched!');
} else {
    // Try with CRLF
    const targetCRLF = target.replace(/\n/g, '\r\n');
    const replacementCRLF = replacement.replace(/\n/g, '\r\n');
    if (content.includes(targetCRLF)) {
        content = content.replace(targetCRLF, replacementCRLF);
        fs.writeFileSync(path, content);
        console.log('Successfully patched (CRLF)!');
    } else {
        console.log('Target not found!');
    }
}
