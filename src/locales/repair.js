const fs = require('fs');
const path = require('path');

// Read files
const enContent = fs.readFileSync(path.join(__dirname, 'en.ts'), 'utf8');
const arContent = fs.readFileSync(path.join(__dirname, 'ar.ts'), 'utf8');

function parseContent(content) {
    // Remove "export const ... = " and trailing semicolon
    // We match from the first { to the last } ?? 
    // Simpler: Remove the export line and the last semicolon.
    let clean = content.replace(/export const \w+ = /, '').trim();
    if (clean.endsWith(';')) clean = clean.slice(0, -1);

    // Remove comments (// ...)
    // Be careful not to remove urls like http://
    // Regex: // followed by anything, but ensure it's not inside a string?
    // The file content is simple enough: properties are on their own lines usually.
    // The comments are on their own lines: // Navigation
    clean = clean.replace(/^\s*\/\/.*$/gm, '');

    // Also remove inline comments if any, but let's assume they are line comments based on view_file

    try {
        return eval('(' + clean + ')');
    } catch (e) {
        console.error("Eval failed", e);
        console.log("Clean content preview:", clean.substring(0, 200));
        throw e;
    }
}

function nest(obj) {
    const result = {};
    for (const key in obj) {
        const value = obj[key];
        const parts = key.split('.');
        let current = result;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = value;
            } else {
                current[part] = current[part] || {};
                current = current[part];
            }
        }
    }
    return result;
}

try {
    const enObj = parseContent(enContent);
    const arObj = parseContent(arContent);

    fs.writeFileSync(path.join(__dirname, 'en-nested.json'), JSON.stringify(nest(enObj), null, 2));
    fs.writeFileSync(path.join(__dirname, 'ar-nested.json'), JSON.stringify(nest(arObj), null, 2));
    console.log("Success");
} catch (e) {
    console.error(e);
    process.exit(1);
}
