import * as util from 'util';
import {log, setup} from './setup';
import read from './reader';
import write from './writer';
import algorithm from './algorithm';

export const files = [
  // 'a_example',
  // 'b_read_on',
  // 'c_incunabula',
  // 'd_tough_choices',
  'e_so_many_books',
  // 'f_libraries_of_the_world',
];

export interface Library {
  id: number;
  num_books_in_library?: number;
  num_days_for_signup?: number;
  num_books_per_day?: number;
  books: number[];
  rank?: number;
  [key: string]: any;
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

let total = 0;

setup(files, (file, label) => {
  const input = read(`../in/${file}.txt`);
  // log.cyan('INPUT: ', util.inspect(input, {breakLength: Infinity, colors: true}));

  console.time(label);
  total += algorithm(input, file);
  console.timeEnd(label);

  //   prev + cur.books.reduce((prev, cur) => prev + input.scores[cur], 0), 0));
  // console.log();

  // log.magenta('OUTPUT: ', output);
  // write(output)(`../out/${file}.txt`);
});

log.white('TOTAL: ', total.toLocaleString());
