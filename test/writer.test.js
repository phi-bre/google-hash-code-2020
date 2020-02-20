import writer from "../src/writer";

export default function (test, assert) {

    test('write file', () => {
        const data = {count: 10, types: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]};
        const output = '10\n0 1 2 3 4 5 6 7 8 9';
        assert.deepEqual(writer(data)('../out/test.out'), output);
    });

}
