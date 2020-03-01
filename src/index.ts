import * as util from 'util';
import {log, setup} from './setup';
import reader, {read} from './reader';
import writer, {write} from './writer';
import algorithm from './algorithm';
import { fork } from 'child_process';

export const files = [
  // 'a_example',
  // 'b_read_on',
  'c_incunabula',
  'd_tough_choices',
  'e_so_many_books',
  'f_libraries_of_the_world',
];

export interface Library {
  id: number;
  num_books_in_library?: number;
  num_days_for_signup?: number;
  num_books_per_day?: number;
  books: number[];
  set?: number[];
  rank?: number;
  throughput?: number;
  score?: number;
}

export interface Reader {
  num_books: number;
  num_libraries: number;
  num_days: number;
  scores: number[];
  libraries: Library[];
}

export interface Writer {
  libraries: Library[];
}

const total = {
  'a_example': 21,
  'b_read_on':  5_822_900,
};

setup(files, async (file, label) => {
  const input = reader(`../in/${file}.txt`);
  total[file] = 0;

  const process = fork('dist/worker.js');
  process.send({input, label});

  process.on('message', ({points, libraries, weights}: any) => {
    total[file] = points;
    for (const file in total) {
      log.cyan('FILE: ' + file + ' POINTS: ' + total[file].toLocaleString());
    }
    log.magenta('TOTAL: ' + Object.keys(total).reduce((t, file) => t + total[file], 0).toLocaleString());
    console.log(util.inspect(weights.map(weight => Number(weight.toPrecision(3))), {breakLength: Infinity}));
    writer({libraries})(`../out/${file}.txt`);
  })
});
