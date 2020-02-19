import fs from "fs";
import p from "path";

export function write(string) {
    return function (path) {
        return fs.writeFileSync(p.join(__dirname, path), string);
    }
}

export default function ({count, types}) {
    return write(count + '\n' + types.join(' '));
}
