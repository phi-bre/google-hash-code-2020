import * as util from 'util';
import {log, setup} from './setup';
import read from './reader';
import write from './writer';
import algorithm from './algorithm';

export const files = [
    'a_example',
    'b_small',
    'c_medium',
    'd_quite_big',
    'e_also_big',
];

export interface Reader {
    max: number;
    slices: number[];
}

export interface Writer {
    count: number;
    types: number[];
}

setup(files, (file, label) => {
    const input = read(`../in/${file}.in`);
    log.cyan('INPUT: ', util.inspect(input, {breakLength: Infinity, colors: true}));

    console.time(label);
    const output = algorithm(input);
    console.timeEnd(label);

    log.magenta('OUTPUT: ', output);
    write(output)(`../out/${file}.out`);
});
