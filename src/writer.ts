import * as fs from 'fs';
import * as p from 'path';
import {Writer} from './index';

export function write(string: string) {
    return function (path: string) {
        fs.writeFileSync(p.join(__dirname, path), string);
        return string;
    }
}

export default function (writer: Writer) {
    let output = writer.libraries.length.toString() + '\n';

    console.log(writer.libraries.length);

    for (const library of writer.libraries) {
        output += library.id + ' ' + library.books.length + '\n';
        output += library.books.join(' ');
        output += '\n';
    }

    return write(output);
}
