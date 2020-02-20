import {Reader, Writer} from './index';

export default function (input: Reader): Writer {
    return {count: 10, types: Array.from({length: 10}, (v, i) => i)};
}
