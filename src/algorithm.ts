import {Library, Reader, Writer} from './index';
import write from './writer';

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
const map = (average, count, min, max) => (average / count - min) / max;

export default function (input: Reader, file: string) {
    const librarySignUpDaysMax = input.libraries
        .reduce(findMax(i => i.num_days_for_signup), Number.MIN_VALUE);
    const librarySignUpDaysMin = input.libraries
        .reduce(findMin(i => i.num_days_for_signup), Number.MAX_VALUE);
    const libraryThroughputMax = input.libraries
        .reduce(findMax(i => i.num_books_per_day), Number.MIN_VALUE);
    const libraryThroughputMin = input.libraries
        .reduce(findMin(i => i.num_books_per_day), Number.MAX_VALUE);
    let libraries: Library[];
    let signUpWeight = 1;
    let throughputWeight = 1;
    let scoreAverageWeight = 1;
    let duplicateWeight = 1;
    let amountBooksWeight = 1;
    let max = 0;
    let step = 0.2;

    for (let i = 0; i < 1; i += step) for (let j = 0; j < 1; j += step) for (let k = 0; k < 1; k += step) {
        signUpWeight = i;
        throughputWeight = j;
        scoreAverageWeight = k;

        libraries = input.libraries
            .sort((a, b) => weigh(b) - weigh(a))
            .map(l => ({
                ...l,
                books: l.books.sort((a, b) => b - a)
            }) as Library);


        function weigh(a: Library) {
            let signUp = a.num_days_for_signup * signUpWeight; // less is better
            signUp = (signUp - librarySignUpDaysMin) / librarySignUpDaysMax;
            // console.log(signUp)

            let throughput = a.num_books_per_day * throughputWeight; // higher is better
            throughput = (throughput - libraryThroughputMin) / libraryThroughputMax;
            // console.log(throughput);

            const scoreMin = Math.min(...a.books);
            const scoreMax = Math.max(...a.books);
            let scoreAverage = a.books // higher is better
                .sort((a, b) => input.scores[b] - input.scores[a])
                .reduce((p, a) => p + a, 0);
            scoreAverage = map(scoreAverage, a.books.length, scoreMin, scoreMax) * scoreAverageWeight;
            // console.log(scoreAverage);

            // const duplicates = a.books.map(b => {
            //         console.log(input.libraries.reduce((p, l) => p + (l.books.indexOf(b) === -1 ? 1 : 0), 0))
            //         return input.libraries.reduce((p, l) => p + (l.books.indexOf(b) === -1 ? 1 : 0), 0);
            //     }).reduce(add, 0)
            //     * duplicateWeight;
            // console.log(duplicates)
            const duplicates = 0;

            // let amount = input.num_days - a.books.length;
            // if (amount < 0) amount = 0;
            // amount = amount / input.num_days * amountBooksWeight;

            return (-signUp + throughput + scoreAverage + -duplicates /* + amount */) / 4;
        }

        const books = [];
        let points = 0;
        let availableDays = input.num_days;
        libraries = libraries.map(l => {
            if (availableDays - l.num_days_for_signup > 0) {
                availableDays -= l.num_days_for_signup;
                let counter = 0;
                l = {
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
                return l
            }
        }).filter(l => !!l).filter(l => !!l.books.length);

        if (points > max) {
            max = points;
            console.log('BEST: ' + points.toLocaleString());
            write({libraries})(`../out/${file}.txt`);
        }
    }

    return {libraries};
}
