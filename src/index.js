import read from './reader';
import write from './writer';
import algorithm from "./algorithm";

const files = [
    'a_example',
    'b_small',
    'c_medium',
    'd_quite_big',
    'e_also_big',
];

files.forEach(run);

function run(file) {
    console.log('Google Hash Code 2020 🎉');

    const input = read('../in/' + file + '.in');

    console.log('INPUT:');
    console.log(input);


    const output = algorithm(input);

    console.log('OUTPUT:');
    console.log(output);

    write(output)('../out/' + file + '.out');
}
