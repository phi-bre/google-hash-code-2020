import input from '../problem/a_example.in';
import parser from "../src/parser";

export default function (test, assert) {

    test('parse file', () => {
        const output = { max: 17, types: 4, slices: [ 2, 5, 6, 8 ] };
        assert.deepEqual(parser(input), output);
    });

}
