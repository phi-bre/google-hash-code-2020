function findNearestTo(values, expected, max, length) {
    let prev = expected;

    console.log(length);
    for (let i = length - 1; i >= 0; i--) {
        const cur = values[i];
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

function calc(slices, remaining, ratio, sum, values, length) {
    console.log(remaining);
    const searchValue = remaining * ratio;
    const nearestIdx = findNearestTo(slices, searchValue, remaining, length);
    console.log(searchValue, nearestIdx);
    if (nearestIdx === -1 || nearestIdx === length) {
        return {values, sum};
    }

    length = nearestIdx;

    const nearest = slices[nearestIdx];

    sum += nearest;
    remaining -= nearest;
    values.push(nearestIdx);

    if (remaining === 0) {
        return {values, sum};
    }

    return calc(slices, remaining, ratio, sum, values, length);
}

export default function ({max, slices}, ratio) {
    const {values, sum} = calc(slices, max, ratio, 0, [], slices.length);
    return {count: values.length, types: values, loss: max - sum};
}
