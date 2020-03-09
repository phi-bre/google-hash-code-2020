
export default function* (count: number, numWeights: number, initial?: number[]) {
    let weights = initial ? initial : new Array(numWeights).fill(0)//.map(Math.random)//.map(n => n * 10);
    let steps = new Array(numWeights).fill(.1)//.map(Math.random);
    let last = new Array(numWeights).fill(0);
    let weight = 0;
    let lastPoints = 0;
    let changed = false;
    yield weights;

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
            changed = true;
        }

        // Stuck
        if ((last[weight] === 0) && (right === left)) {
            steps[weight] *= 1.5;
        }

        // if ((last[weight] === 1 && right > left) || (last[weight] === -1 && right < left)) {
        //     steps[weight] *= 1.5;
        // }

        const better = Math.max(right, left) > lastPoints;

        if (right > left) {
            if (better) weights = rightWeights;
            last[weight] = 1;
            changed = true;
        } else if (right < left) {
            if (better) weights = leftWeights;
            last[weight] = -1;
            changed = true;
        } else {
            last[weight] = 0;
        }

        if (!better) {
            weight = (weight + 1) % weights.length;
            // if (weight === 0 && changed === false) {
            //     return;
            // }
            changed = false;
        }

        lastPoints = Math.max(right, left);
    }
}
