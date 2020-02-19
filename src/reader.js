import fs from 'fs';
import p from 'path';

export function read(path) {
    return fs.readFileSync(p.join(__dirname, path)).toString('utf8');
}

export default function (path) {
    const input = read(path);
    const lines = input.split('\n');
    const [max, types] = lines[0].split(' ').map(Number);
    const slices = lines[1].split(' ', types).map(Number);
    return {max, slices};
}
