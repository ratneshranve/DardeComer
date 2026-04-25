const fs = require('fs');
const path = 'c:\\Users\\Abcom\\Desktop\\DardeComer\\Backend\\src\\modules\\food\\admin\\services\\admin.service.js';
let content = fs.readFileSync(path, 'utf8');

// The markers for replacement
const target = `    // Bank Details
    if (body.gstImage !== undefined) doc.gstImage = toStr(getUrl(body.gstImage)) || undefined;
    if (body.fssaiImage !== undefined) doc.fssaiImage = toStr(getUrl(body.fssaiImage)) || undefined;

    if (body.menuImages !== undefined) {`;

const replacement = `    // Bank Details
    if (body.accountNumber !== undefined) doc.accountNumber = toStr(body.accountNumber);
    if (body.ifscCode !== undefined) doc.ifscCode = toStr(body.ifscCode);
    if (body.accountHolderName !== undefined) doc.accountHolderName = toStr(body.accountHolderName);
    if (body.accountType !== undefined) doc.accountType = toStr(body.accountType);

    // Featured Info
    if (body.featuredDish !== undefined) doc.featuredDish = toStr(body.featuredDish);
    if (body.featuredPrice !== undefined) doc.featuredPrice = toFiniteNumber(body.featuredPrice);

    // Images
    const getUrl = (v) => (v && typeof v === 'object' ? v.url : v);
    if (body.profileImage !== undefined) doc.profileImage = toStr(getUrl(body.profileImage)) || undefined;
    if (body.panImage !== undefined) doc.panImage = toStr(getUrl(body.panImage)) || undefined;
    if (body.gstImage !== undefined) doc.gstImage = toStr(getUrl(body.gstImage)) || undefined;
    if (body.fssaiImage !== undefined) doc.fssaiImage = toStr(getUrl(body.fssaiImage)) || undefined;

    if (body.menuImages !== undefined) {`;

// Standardize line endings to LF for replacement, then we'll handle CRLF if needed
// Actually, let's just do a string replace on the content as is.
// We need to be careful about line endings.

// Try to find the target with both LF and CRLF
if (content.includes(target.replace(/\n/g, '\r\n'))) {
    console.log('Found with CRLF');
    content = content.replace(target.replace(/\n/g, '\r\n'), replacement.replace(/\n/g, '\r\n'));
} else if (content.includes(target)) {
    console.log('Found with LF');
    content = content.replace(target, replacement);
} else {
    console.log('Target NOT found');
    // Fallback: try a more flexible match or partial match
    console.log('Content slice around expected area:');
    const index = content.indexOf('// Bank Details');
    if (index !== -1) {
        console.log(content.substring(index, index + 200));
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
