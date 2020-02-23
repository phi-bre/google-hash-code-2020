import {Library, Reader} from './index';
import write from './writer';
import {log} from './setup';

const findMax = reducer => (p, l) => {
    const reduced = reducer(l);
    if (reduced > p) {
        return reduced;
    }
    return p;
};
const findMin = reducer => (p, l) => {
    const reduced = reducer(l);
    if (reduced < p) {
        return reduced;
    }
    return p;
};

export default function (input: Reader, file: string) {
    input.libraries.map(l => l.books = l.books
        .sort((a, b) => input.scores[b] - input.scores[a]));
    const librarySignUpDaysMax = input.libraries
        .reduce(findMax(i => i.num_days_for_signup), Number.MIN_VALUE);
    const librarySignUpDaysMin = input.libraries
        .reduce(findMin(i => i.num_days_for_signup), Number.MAX_VALUE);
    const libraryThroughputMax = input.libraries
        .reduce(findMax(i => i.num_books_per_day), Number.MIN_VALUE);
    const libraryThroughputMin = input.libraries
        .reduce(findMin(i => i.num_books_per_day), Number.MAX_VALUE);
    const rating = new Array(input.scores.length).fill(0);
    input.libraries.forEach(l => l.books.forEach(b => rating[b] += 1));
    const ranked = input.libraries.map(rank);

    let max = 0;
    let weights = [1, 1, 1].map(Math.random);
    let steps = [0.001, 0.001, 0.001];
    let last = [0, 0, 0];
    let weight = 0;
    let lastPoints = 0;

    let i = 0, loss = 1;
    for (let i = 0; i < 1000; i++) {
    // while (true) {

        const rightWeights = weights.slice();
        rightWeights[weight] = rightWeights[weight] + steps[weight];
        const right = evaluate(rightWeights);
        const leftWeights = weights.slice();
        leftWeights[weight] = leftWeights[weight] + steps[weight];
        const left = evaluate(leftWeights);

        // // Overshoots
        // if ((last[weight] === 1 && right < left) || (last[weight] === -1 && right > left)) {
        //     // console.log('overshoots');
        //     // console.log(last[weight], right, left);
        //     steps[weight] /= 1.1;
        //     // continue;
        // }

        // Stuck
        if (last[weight] === 0 && right === left) {
            // console.log('stuck');
            steps[weight] *= 1.1;
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

        lastPoints = Math.max(right, left);
        // i++;
    }

    function evaluate(weights: number[]) {
        for (let i = 0; i < input.libraries.length; i++) {
            const library = input.libraries[i];
            library.rank = 0;
            for (let j = 0; j < weights.length; j++) {
                library.rank += ranked[i][j] * weights[j];
            }
            library.rank /= weights.length;
        }

        const sorted = Array.prototype.slice.call(input.libraries)
            .sort((a, b) => b.rank - a.rank);
        const {libraries, points} = score(sorted);
        if (points > max) {
            max = points;
            log.magenta('BEST: ' + points.toLocaleString());
            write({libraries})(`../out/${file}.txt`);
        }

        return points;
    }

    function rank(library: Library) {
        let signUp = library.num_days_for_signup; // less is better
        signUp = (signUp - librarySignUpDaysMin) / librarySignUpDaysMax;
        // console.log(signUp)

        let throughput = library.num_books_per_day; // higher is better
        throughput = (throughput - libraryThroughputMin) / libraryThroughputMax;
        // console.log(throughput);

        const scoreMin = Math.min(...library.books);
        const scoreMax = Math.max(...library.books);
        let scoreAverage = library.books // higher is better
            .reduce((p, b) => p + input.scores[b], 0);
        // scoreAverage = (scoreAverage / library.books.length - scoreMin) / scoreMax;
        // console.log(scoreAverage, scoreMin, scoreMax);

        let duplicates = library.books
            .reduce((p, b) => p + rating[b], 0);
        duplicates = (duplicates - 8) / 35;

        return [-signUp, -throughput, scoreAverage];
    }

    function score(libraries: Library[]) {
        const bookSet = new Set<number>();
        let points = 0;
        let availableDays = input.num_days;
        const filteredLibraries = [];
        for (const library of libraries) {
            if (!(availableDays - library.num_days_for_signup > 0)) continue;
            availableDays -= library.num_days_for_signup;
            let counter = 0;
            const books = [];

            for (const book of library.books) {
                counter++;
                if (counter > (library.num_books_per_day * availableDays) || bookSet.has(book)) continue;
                points += input.scores[book];
                books.push(book);
                bookSet.add(book);
            }

            if (books.length === 0) continue;
            filteredLibraries.push({id: library.id, books} as Library);
        }
        return {libraries: filteredLibraries, points};
    }

    return max;
}
