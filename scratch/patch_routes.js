const fs = require('fs');
const path = 'c:/Users/Abcom/Desktop/DardeComer/Backend/src/routes/index.js';
let content = fs.readFileSync(path, 'utf8');

const target = `router.get('/v1/food/dining/categories/public', getPublicDiningCategories);`;
const replacement = `router.get('/v1/food/dining/categories', getPublicDiningCategories);
router.get('/v1/food/dining/categories/public', getPublicDiningCategories);`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content);
    console.log('Successfully patched!');
} else {
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
