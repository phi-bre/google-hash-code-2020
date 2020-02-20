import * as fs from 'fs';
import * as p from 'path';
import {Reader} from './index';

export function read(path: string) {
    return fs.readFileSync(p.join(__dirname, path)).toString('utf8');
}

export default function (path: string): Reader {
    const input = read(path);
    const lines = input.split('\n');
    const [max, types] = lines[0].split(' ').map(Number);
    const slices = lines[1].split(' ', types).map(Number);
    return {max, slices};
}
