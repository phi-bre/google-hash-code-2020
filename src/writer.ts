import * as fs from 'fs';
import * as p from 'path';
import {Writer} from './index';

export function write(string: string) {
    return function (path: string) {
        fs.writeFileSync(p.join(__dirname, path), string);
        return string;
    }
}

export default function ({}: Writer) {
    return write('');
}
