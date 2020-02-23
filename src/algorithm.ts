import {Library, Reader} from './index';
import write from './writer';
import {log} from './setup';

export default function (input: Reader, file: string) {
    input.libraries.map(l => l.books = l.books
        .sort((a, b) => input.scores[b] - input.scores[a]));
    const librarySignUpDaysMax = input.libraries
        .reduce((p, c) => c.num_days_for_signup > p ? c.num_days_for_signup : p, Number.MIN_VALUE);
    const librarySignUpDaysMin = input.libraries
        .reduce((p, c) => c.num_days_for_signup < p ? c.num_days_for_signup : p, Number.MAX_VALUE);
    const libraryThroughputMax = input.libraries
        .reduce((p, c) => c.num_books_per_day > p ? c.num_books_per_day : p, Number.MIN_VALUE);
    const libraryThroughputMin = input.libraries
        .reduce((p, c) => c.num_books_per_day < p ? c.num_books_per_day : p, Number.MAX_VALUE);
    const rating = new Array(input.scores.length).fill(0);
    input.libraries.forEach(l => l.books.forEach(b => rating[b] += 1));

    console.log('Number of sign-up days: ', input.libraries.reduce((p, l) => l.num_days_for_signup + p, 0).toLocaleString());
    console.log('Number of days:', input.num_days.toLocaleString());
    console.log('Number of libraries: ', input.libraries.length.toLocaleString());
    console.log('Number of books: ', input.scores.length.toLocaleString());
    console.log('Books without library: ', rating.reduce((p, c) => c === 0 ? p + 1 : p, 0).toLocaleString());
    console.log('Total score: ', rating.reduce((p, c, i) => c === 0 ? p + input.scores[i] : p, 0).toLocaleString());

    // const ranked = input.libraries.map(library => {
    //     let signUp = library.num_days_for_signup; // less is better
    //     // signUp = (signUp - librarySignUpDaysMin) / librarySignUpDaysMax;
    //     // console.log(signUp)
    //
    //     let throughput = library.num_books_per_day; // higher is better
    //     // throughput = (throughput - libraryThroughputMin) / libraryThroughputMax;
    //     // console.log(throughput);
    //
    //     // const scoreMin = Math.min(...library.books);
    //     // const scoreMax = Math.max(...library.books);
    //     let scoreAverage = library.books // higher is better
    //         .reduce((p, b) => p + input.scores[b], 0);
    //     // scoreAverage = (scoreAverage / library.books.length - scoreMin) / scoreMax;
    //     // console.log(scoreAverage, scoreMin, scoreMax);
    //
    //     let duplicates = library.books
    //         .reduce((p, b) => p + (rating[b] * input.scores[b]), 0);
    //     // duplicates = (duplicates - 8) / 35;
    //
    //     // let ratio = library.num_books_per_day / library.books.length;
    //
    //     // return [-signUp, -throughput, scoreAverage, -ratio];
    //     return [-signUp, -throughput, -scoreAverage, duplicates];
    // });

    let max = 0;
    optimize(4, weights => {
        const books = [];
        let libraries = [];

        for (let i = 0; i < input.libraries.length; i++) {
            const library = {...input.libraries[i], rank: 0} as Library;

            let signUp = library.num_days_for_signup; // less is better
            // signUp = (signUp - librarySignUpDaysMin) / librarySignUpDaysMax;
            // console.log(signUp)

            let throughput = library.num_books_per_day; // higher is better
            // throughput = (throughput - libraryThroughputMin) / libraryThroughputMax;
            // console.log(throughput);

            library.books = library.books.filter(b => {
                 if (books[b] !== false) {
                     return books[b] = true;
                 }
            });

            // const scoreMin = Math.min(...library.books);
            // const scoreMax = Math.max(...library.books);
            let score = library.books // higher is better
                .reduce((p, b) => p + input.scores[b], 0);
            // score = (score / library.books.length - scoreMin) / scoreMax;
            // console.log(score, scoreMin, scoreMax);

            let duplicates = library.books
                .reduce((p, b) => p + (rating[b] * input.scores[b]), 0);
            // duplicates = (duplicates - 8) / 35;

            const ranked = [-signUp, -throughput, score, duplicates];

            for (let j = 0; j < weights.length; j++) {
                library.rank += ranked[j] * weights[j];
            }

            libraries.push(library);
        }

        // optimize(1, weights => {
        //     const sorted = libraries.map(l => ({
        //         ...l,
        //         books: l.books.sort((a, b) => ),
        //     }));
        //     ({points} = score(input, sorted));
        //
        //     if (points > max) {
        //         max = points;
        //         log.magenta('BEST: ' + points.toLocaleString());
        //     }
        //
        //     return points;
        // });

        const sorted = Array.prototype.slice.call(libraries)
            .sort((a, b) => b.rank - a.rank);
        let scored = score(input, sorted);

        if (scored.points > max) {
            max = scored.points;
            log.magenta('BEST: ' + scored.points.toLocaleString());
            write({libraries: scored.libraries})(`../out/${file}.txt`);
        }

        return scored.points;
    });
}

function score(input: Reader, sorted: Library[]) {
    const bookSet = new Set<number>();
    let points = 0;
    let availableDays = input.num_days;
    const libraries = [] as Library[];
    for (const library of sorted) {
        if (!(availableDays - library.num_days_for_signup > 0)) continue;
        availableDays -= library.num_days_for_signup;
        let counter = 0;
        const books = [];

        for (const book of library.books) {
            counter++;
            if (counter > (library.num_books_per_day * availableDays)) break;
            if (bookSet.has(book)) continue; // TODO:
            points += input.scores[book];
            books.push(book);
            bookSet.add(book);
        }

        if (books.length === 0) continue;
        libraries.push({id: library.id, books});
    }
    return {libraries, points};
}

function optimize(numWeights: number, evaluate: (weights: number[]) => number) {
    let weights = new Array(numWeights).fill(0.1)//.map(Math.random)//.map(n => n * 3);
    let steps = new Array(numWeights).fill(0.1);
    let last = new Array(numWeights).fill(0);
    let weight = 0;
    let lastPoints = 0;

    let overshoots = 0;
    let stucks = 0;

    // for (let i = 0; i < 1000; i++) {
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
            steps[weight] /= 1.15;
            overshoots++;
        }

        // Stuck
        if ((last[weight] === 0) && (right === left)) {
            // console.log('stuck');
            steps[weight] *= 1.1;
            stucks++;
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
