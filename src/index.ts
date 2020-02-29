import * as util from 'util';
import {log, setup} from './setup';
import reader, {read} from './reader';
import writer, {write} from './writer';
import algorithm from './algorithm';

export const files = [
  // 'a_example',
  // 'b_read_on',
  // 'c_incunabula',
  'd_tough_choices',
  // 'e_so_many_books',
  // 'f_libraries_of_the_world',
];

export interface Library {
  id: number;
  num_books_in_library?: number;
  num_days_for_signup?: number;
  num_books_per_day?: number;
  books: number[];
  set?: number[];
  rank?: number;
  table?: number[];
  throughput?: number;
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

const total = [];

setup(files, (file, label) => {
  const input = reader(`../in/${file}.txt`);

  console.log();
  console.time(label);
  // for (const {points, libraries} of algorithm(input)) {
  //   // if (points > max) {
  //   //   max = points;
  //   //   total[file] = max;
  //   //   log.cyan('FILE: ' + file + ' POINTS: ' + points.toLocaleString());
  //   //   // console.log(util.inspect(weights.map(weight => Number(weight.toPrecision(3))), {breakLength: Infinity}));
  //   //   writer({libraries})(`../out/${file}.txt`);
  //   //   // write(JSON.stringify(weights))(`../out/${file}.weights.json`);
  //   // }
  // }
  const {points, libraries} = algorithm(input);
  total[file] = points;
  writer({libraries})(`../out/${file}.txt`);
  console.timeEnd(label);
  log.cyan('POINTS: ' + points.toLocaleString());
});

log.magenta('TOTAL: ' + Object.keys(total).reduce((t, file) => t + total[file], 0).toLocaleString());
