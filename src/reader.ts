import * as fs from 'fs';
import * as p from 'path';
import {Reader} from './index';

export function read(path: string) {
  return fs.readFileSync(p.join(__dirname, path)).toString('utf8');
}

export default function (path: string): Reader {
  const input = read(path);
  let lines = input.split('\n');
  const [num_books, num_libraries, num_days] = lines[0].split(' ').map(Number);
  const scores = lines[1].split(' ').map(Number);
  lines = lines.slice(2);
  const libraries = [];
  for (let i = 0; i < libraries.length; i += 2) {
    const line1 = libraries[i];
    const line2 = libraries[i + 1];
    const [num_books_in_library, num_days_for_signup, num_days_to_finish] = line1.split(' ').map(Number);
    const books = line2.split(' ').map(Number);

    libraries.push({
      num_books_in_library,
      num_days_for_signup,
      num_days_to_finish,
      books,
    })
  }
  return {
    num_books,
    num_libraries,
    num_days,
    scores,
    libraries,
  };
}
