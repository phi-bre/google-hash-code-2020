
export default function (numWeights: number, evaluate: (weights: number[]) => number) {
    let weights = new Array(numWeights).fill(1)//.map(Math.random)//.map(n => n * 3)
    let steps = new Array(numWeights).fill(1)//.map(Math.random);
    let last = new Array(numWeights).fill(0);
    let weight = 0;
    let lastPoints = 0;

    // let i = 0;
    // let loss = 0;
    let overshoots = 0;
    let stucks = 0;

    // for (let i = 0; i < 100; i++) {
    while (true) {
        const rightWeights = weights.slice();
        rightWeights[weight] = rightWeights[weight] + steps[weight];
        const right = evaluate(rightWeights);
        const leftWeights = weights.slice();
        leftWeights[weight] = leftWeights[weight] - steps[weight];
        const left = evaluate(leftWeights);

        // Overshoots
        if ((last[weight] === 1 && right < left) || (last[weight] === -1 && right > left)) {
            // console.log('overshoots');
            steps[weight] /= 1.3;
            overshoots++;
            stucks = 0;
        }

        // Stuck
        if ((last[weight] === 0) && (right === left)) {
            // console.log('stuck');
            steps[weight] *= 1.2;
            stucks++;
            overshoots = 0;
        }

        if (right > left) {
            weights = rightWeights;
            last[weight] = 1;
        } else if (right < left) {
            weights = leftWeights;
            last[weight] = -1;
        } else {
            last[weight] = 0;
        }

        if (Math.max(right, left) <= lastPoints) { // Move on to the next weight
            weight = (weight + 1) % weights.length;
        }

        // if (stucks + overshoots >= 100) {
        //     return;
        // }

        lastPoints = Math.max(right, left);
    }
}
