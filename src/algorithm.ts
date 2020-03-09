import {Library, Reader} from './index';
import optimize from './optimize';
import {log} from "./setup";

export interface Statistic {
    max: number;
    min: number;
    average: number;
    spread: number;
}

export function stats<T>(array: T[], reducer: (item: T) => number = item => item as unknown as number): Statistic {
    // TODO: Consider statistical outliers
    const reduced = array.map(reducer);
    const average = array.reduce((a, _, i) => a + reduced[i], 0) / array.length;
    const max = Math.max(...reduced);
    const min = Math.min(...reduced);
    const spread = (average - min) / max;
    return {max, min, average, spread};
}

export default function* (input: Reader) {
    let libraries = input.libraries;

    const statistics = {
        score: stats(input.scores),
        signup: stats(libraries, library => library.num_days_for_signup),
        throughput: stats(libraries, library => library.num_books_per_day),
        size: stats(libraries, library => library.books.length),
        rarity: null as Statistic,
    };

    log.white('DAYS:', input.num_days.toLocaleString());
    log.white('LIBRARIES:', input.num_libraries.toLocaleString());
    log.white('BOOKS:', input.num_books.toLocaleString());

    // SETUP
    libraries.each(library => {
        library.set = library.books.slice();
        library.books = [];
        library.rank = 0;
        library.throughput = 0;
        library.connections = [];
    });

    // ASSOCIATE BOOKS WITH LIBRARIES
    const collected = new Array(input.scores.length).fill(0).map(() => []) as Library[][];
    libraries.each(library => {
        library.set.each(book => {
            collected[book].push(library);
        });
    });

    // FILTER OUT UNUSED BOOKS
    const filtered = [] as number[];
    collected.each((libraries, book) => {
        if (libraries.length) {
            filtered.push(book);
        }
    });

    // DISTANCE BETWEEN LIBRARIES
    // libraries.each(library => {
    //     library.books.each(book => {
    //         library.connections.push();
    //         library.connections += collected[book].length;
    //     });
    // });

    statistics.rarity = stats(filtered, book => collected[book].length);
    console.table(statistics);

    // OPTIMIZING
    const rank = [];
    const optimizer = optimize(Infinity, 5);
    let {value: weights, done} = optimizer.next();
    while (!done) {

        // libraries.each((library, i) => {
        //     library.books = [];
        //     library.rank = (
        //         // + (library.num_books_per_day * (input.num_days - library.num_days_for_signup)) / (library.set.length + library.set.reduce((p, b) => p + input.scores[b], 0)) * weights[4]
        //         - input.num_days * weights[11]
        //         // - input.num_books * weights[11]
        //         // - input.num_libraries * weights[12]
        //         - library.num_days_for_signup / input.num_days * weights[0]
        //         + library.num_books_per_day / input.num_days * weights[1]
        //         + library.set.length * weights[2]
        //         + library.throughput * weights[3] //* statistics.throughput.spread
        //         + library.set.reduce((p, b) => p + input.scores[b], 0) / library.num_days_for_signup * weights[10]
        //     );
        // });
        //
        // // SORT BOOKS
        // filtered.each(book => {
        //     rank[book] = (
        //         // + collected[book].reduce((p, l) => p + l.set.reduce((p, b) => p + collected[b].length), 0) * weights[14]
        //         // + collected[book].reduce((p, l) => p + l.set.length, 0) * weights[4]
        //         + collected[book].length * weights[5]
        //         + input.scores[book] * weights[6]
        //     );
        // });
        // filtered.sort((a, b) => rank[b] - rank[a]);
        //
        // // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
        // filtered.each(book => {
        //     const libraries = collected[book];
        //     const [best] = libraries.sort((a, b) => b.rank - a.rank);
        //     best.rank += (
        //         + libraries.length * weights[7]
        //         + best.books.length * weights[8]
        //         + input.scores[book] * weights[9]
        //     );
        //     best.books.push(book);
        // });
        //
        // // SORT LIBRARIES
        // libraries.sort(((a, b) => b.rank - a.rank));
        //
        // // CALCULATE THROUGHPUT AND POINTS
        // let days = input.num_days, points = 0;
        // let simulated = [];
        // for (const library of libraries) {
        //     if (days - library.num_days_for_signup < 0) continue;
        //     days -= library.num_days_for_signup;
        //     library.throughput = days * library.num_books_per_day;
        //     if (library.throughput > library.set.length) {
        //         library.throughput = library.set.length;
        //     }
        //     library.books
        //         .slice(0, library.throughput)
        //         .each(book => points += input.scores[book]);
        //     simulated.push(library);
        // }

        // [ 0.2, 0, 0.00762 ]
        // console.time('time');
        libraries.each(library => library.books = library.set.slice());

        let days = input.num_days, points = 0, offset = 0;
        const taken = [], simulated = [];
        for (let i = 0; i < libraries.length; i++) {
            const temp = libraries
                .slice(offset)
                .each(library => {
                    library.rank = (
                        - library.num_days_for_signup * weights[0]
                        + library.num_books_per_day * weights[1]
                        + library.books.reduce((p, book) => p + input.scores[book], 0) * weights[2]
                        + library.books.length * weights[3]
                        + library.books.reduce((p, book) => collected[book].length) * weights[4]
                    );
                })
                .sort((a, b) => b.rank - a.rank);
            libraries = libraries.slice(0, offset).concat(temp);

            let best: Library;
            do best = libraries[offset++];
            while (best && (days - best.num_days_for_signup < 0));
            if (!best) break;

            days -= best.num_days_for_signup;
            simulated.push(best);
            best.books
                .sort((a, b) => input.scores[b] - input.scores[a])
                .slice(0, days * best.num_books_per_day)
                .each(book => {
                    taken[book] = true;
                    collected[book].each(library => library.books.remove(book));
                    points += input.scores[book];
                });
        }
        // console.timeEnd('time');

        yield {points, weights, libraries: simulated};
        ({value: weights, done} = optimizer.next(points));
    }
}

function score() {

}
