
export default function (numWeights: number, evaluate: (weights: number[]) => number) {
    let weights = new Array(numWeights).fill(1).map(Math.random)//.map(n => n * 10);
    let steps = new Array(numWeights).fill(1)//.map(Math.random);
    let last = new Array(numWeights).fill(0);
    let weight = 0;
    let lastPoints = 0;

    // for (let i = 0; i < 60; i++) {
    while (true) {
        const rightWeights = weights.slice();
        rightWeights[weight] = rightWeights[weight] + steps[weight];
        const right = evaluate(rightWeights);
        const leftWeights = weights.slice();
        leftWeights[weight] = leftWeights[weight] - steps[weight];
        const left = evaluate(leftWeights);

        // Overshoots
        if ((last[weight] === 1 && right < left) || (last[weight] === -1 && right > left)) {
            steps[weight] /= 1.5;
        }

        // Stuck
        if ((last[weight] === 0) && (right === left)) {
            steps[weight] *= 1.5;
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

        lastPoints = Math.max(right, left);
    }
}
