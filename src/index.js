import parser from './parser';
import {read, write} from "./io";

console.log('Google Hash Code 2020 🎉');
console.log(read('../problem/a_example.in'));
console.log(parser(read('../problem/a_example.in')));
