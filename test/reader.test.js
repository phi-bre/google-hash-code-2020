import reader from "../src/reader";

export default function (test, assert) {

    test('read file', () => {
        const output = {max: 17, slices: [2, 5, 6, 8]};
        assert.deepEqual(reader('../in/a_example.in'), output);
    });

}
