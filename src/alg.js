import parser from './parser';
import {read, write} from "./io";

console.log('Google Hash Code 2020 🎉');

const data = parser(read('../problem/b_small.in'));
// const sum = data.slices.reduce((val, cur) => cur + val, 0);
// const average = sum / data.slices.length;
//
// console.log(sum, data.max, average, data.max / average, data.slices.length);

function findNearestTo(expected, max, length) {
    let prev = expected;

    for (let i = length - 1; i >= 0; i--) {
        const cur = data.slices[i];
        if (cur > max) {
            continue;
        }

        const diff = Math.abs(expected - cur);

        if (diff > prev) {
            return i + 1;
        }

        prev = diff;
    }

    return -1;
}

function calc(remaining, ratio, sum, values, length) {
    const searchValue = remaining * ratio;
    const nearestIdx = findNearestTo(searchValue, remaining, length);
    if (nearestIdx === -1 || nearestIdx === length) {
        return {values, sum};
    }

    length = nearestIdx;

    const nearest = data.slices[nearestIdx];

    sum += nearest;
    remaining = data.max - sum;
    values.push(nearestIdx);

    if (remaining === 0) {
        return {values, sum};
    }

    return calc(remaining, ratio, sum, values, length);
}

const res = calc(data.max, 3/4, 0, [], data.slices.length);

// console.log(res);
console.log(res.sum, data.max, data.max - res.sum);
