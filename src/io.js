import fs from 'fs';
import p from 'path';

export function read(path) {
    return fs.readFileSync(p.join(__dirname, path)).toString('utf8');
}

export function write(path) {
    return function (string) {
        return fs.writeFileSync(path, string);
    }
}
