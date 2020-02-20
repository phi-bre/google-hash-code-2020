import read from './reader';
import write from './writer';
import algorithm from "./algorithm";

const files = [
    'a_example',
    // 'b_small',
    // 'c_medium',
    // 'd_quite_big',
    // 'e_also_big',
];

files.forEach(run);

function run(file) {
    // console.log('Google Hash Code 2020 🎉');

    const input = read('../in/' + file + '.in');

    // console.log('INPUT:');
    // console.log(input);

    let best = null;
    // for (let i = 0.01; i < 1; i += 0.01) {
    let i = 3/4;
        const out = algorithm(input, i);
        if (best === null || out.loss < best.loss) {
            best = {...out, ratio: i};
        }
    // }

    console.log(best);

    // console.log('OUTPUT:');
    // console.log(output);

    write(best)('../out/' + file + '.out');
}
