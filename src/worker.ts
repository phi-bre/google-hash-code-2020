import algorithm from "./algorithm";

process.on('message', async ({input, label}) => {
    let max = 0;
    console.time(label);
    for await (const {points, weights, libraries} of algorithm(input)) {
        if (points > max) {
            max = points;
            process.send({points, libraries, weights});
        }
    }
    console.timeEnd(label);
});
