
export default function* (count: number, numWeights: number, initial?: number[]) {
    let weights = initial ? initial : new Array(numWeights).fill(0).map(Math.random)//.map(n => n * 10);
    let steps = new Array(numWeights).fill(1)//.map(Math.random);
    let last = new Array(numWeights).fill(0);
    let weight = 0;
    let lastPoints = 0;

    for (let i = 0; i < count; i++) {
        const rightWeights = weights.slice();
        rightWeights[weight] = rightWeights[weight] + steps[weight];
        const right = yield rightWeights;
        const leftWeights = weights.slice();
        leftWeights[weight] = leftWeights[weight] - steps[weight];
        const left = yield leftWeights;

        // Overshoots
        if ((last[weight] === 1 && right < left) || (last[weight] === -1 && right > left)) {
            steps[weight] /= 2;
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

        if (Math.max(right, left) <= lastPoints) {
            weight = (weight + 1) % weights.length;
        }

        // Normalize
        // if (i % weights.length === 0) {
        //     const max = Math.max(...weights);
        //     for (let j = 0; j < weights.length; j++) {
        //         weights[j] /= max;
        //     }
        // }

        lastPoints = Math.max(right, left);
    }
}
