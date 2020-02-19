import parser from "../src/parser";
import {read} from "../src/io";

export default function (test, assert) {

    test('parse file', () => {
        const output = {max: 17, slices: [2, 5, 6, 8]};
        assert.deepEqual(parser(read('../in/a_example.in')), output);
    });

}
