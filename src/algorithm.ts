import {Library, Reader} from './index';
import write from './writer';
import {log} from "./setup";

const limit = (a, min, max) => (a > max ? max : (a < min ? min : a));
const add = (p, l) => p + l;
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
    const weights = [0, 0, 0];
    const history = [];
    let weight = 0;
    let step = 0.1;
    let max = 0;
    let last = 0;
    let rate = 1;

    while (true) {
        const ranked = input.libraries
            .map(l => rank(l))
            .sort((a, b) => b.rank - a.rank);
        const {libraries, points} = score(ranked);

        if (points > max) {
            max = points;
            log.magenta('BEST: ' + points.toLocaleString());
            write({libraries})(`../out/${file}.txt`);
        }

        if (last) {
            rate = Math.abs((points - last) / last);
        }

        if (points > last) {
            weights[weight] = limit(weights[weight] + step, 0, Number.MAX_VALUE);
        }

        if (points < last) {
            weights[weight] = limit(weights[weight] - step, 0, Number.MAX_VALUE);
            step /= 1.5;
        }

        if (rate < 0.001 || step < 0.001 || points === last) {
            console.log(weights);
            weight = (weight + 1) % weights.length;
            step = 0.1;
            weights[weight] = limit(weights[weight] + step, 0, Number.MAX_VALUE);
        }

        if (points > last) {
            last = points;
        }
    }

    function rank(library: Library) {
        let signUp = library.num_days_for_signup * weights[0]; // less is better
        signUp = (signUp - librarySignUpDaysMin) / librarySignUpDaysMax;
        // console.log(signUp)

        let throughput = library.num_books_per_day * weights[1]; // higher is better
        throughput = (throughput - libraryThroughputMin) / libraryThroughputMax;
        // console.log(throughput);

        const scoreMin = Math.min(...library.books);
        const scoreMax = Math.max(...library.books);
        let scoreAverage = library.books // higher is better
            .sort((a, b) => input.scores[b] - input.scores[a])
            .reduce((p, a) => p + a, 0);
        scoreAverage = (scoreAverage / library.books.length - scoreMin) / scoreMax * weights[2];
        // console.log(scoreAverage);

        // const duplicates = library.books.map(b => {
        //         console.log(input.libraries.reduce((p, l) => p + (l.books.indexOf(b) === -1 ? 1 : 0), 0))
        //         return input.libraries.reduce((p, l) => p + (l.books.indexOf(b) === -1 ? 1 : 0), 0);
        //     }).reduce(add, 0)
        //     * duplicateWeight;
        // console.log(duplicates)
        const duplicates = 0;

        // let amount = input.num_days - library.books.length;
        // if (amount < 0) amount = 0;
        // amount = amount / input.num_days * amountBooksWeight;
        library.rank = (-signUp + throughput + scoreAverage + -duplicates /* + amount */) / 4;
        return library;
    }

    function score(libraries) {
        const books = [];
        let points = 0;
        let availableDays = input.num_days;
        libraries = libraries.map(l => {
            if (availableDays - l.num_days_for_signup > 0) {
                availableDays -= l.num_days_for_signup;
                let counter = 0;
                return {
                    id: l.id,
                    books: l.books.filter(b => {
                        counter++;
                        if (counter <= l.num_books_per_day * availableDays) {
                            if (books.indexOf(b) === -1) {
                                points += input.scores[b];
                                books.push(b);
                                return true;
                            }
                        }
                    })
                } as Library;
            }
        }).filter(l => !!l).filter(l => !!l.books.length);
        return {libraries, points};
    }
}
