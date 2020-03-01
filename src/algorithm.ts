import {Library, Reader} from './index';
import optimize from './optimize';
import {log} from "./setup";

interface Statistic {
    max: number;
    min: number;
    average: number;
    spread: number;
}

function stats<T>(array: T[], reducer: (item: T) => number = item => item as unknown as number): Statistic {
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
        fake: stats(libraries, library =>
            (library.num_books_per_day * input.num_days > library.books.length)
                ? library.books.length : library.num_books_per_day * input.num_days),
        size: stats(libraries, library => library.books.length),
        rarity: null as Statistic,
    };

    log.white('DAYS:', input.num_days.toLocaleString());
    log.white('LIBRARIES:', input.num_libraries.toLocaleString());
    log.white('BOOKS:', input.num_books.toLocaleString());

    // SETUP
    libraries.each(library => {
        library.set = library.books;
        library.books = [];
        library.rank = 0;
        library.throughput = 0;
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

    statistics.rarity = stats(filtered, book => collected[book].length);
    console.table(statistics);

    // OPTIMIZING
    const rank = [];
    const optimizer = optimize(Infinity, 10);
    let {value: weights, done} = optimizer.next();
    while (!done) {

        // RESET
        libraries.each(library => {
            library.books.length = 0;
            library.rank = 0;
        });

        // SORT BOOKS
        filtered.each(book => {
            rank[book] = (
                // + collected[book].length * weights[4]
                + input.scores[book] * weights[5]
            );
        });
        filtered.sort((a, b) => rank[b] - rank[a]);

        // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
        filtered.each(book => {
            const libraries = collected[book];
            libraries.each(library => {
                library.rank = (
                    - library.num_days_for_signup * weights[1]
                    + library.num_books_per_day * weights[2]
                    + library.set.length * weights[3]
                    + library.throughput * weights[9]
                    // + library.set.reduce((p, book) => p + collected[book].length - 1, 0) * weights[9]
                    + library.books.length * weights[6]
                );
            });
            const [best] = libraries.sort((a, b) => b.rank - a.rank);
            best.rank += (
                // + libraries.length * weights[7]
                + input.scores[book] * weights[8]
            );
            best.books.push(book);
        });

        // SORT LIBRARIES
        libraries.sort(((a, b) => b.rank - a.rank));

        // CALCULATE THROUGHPUT AND POINTS
        let days = input.num_days, points = 0;
        const simulated = [];
        for (const library of libraries) {
            if (days - library.num_days_for_signup < 0) continue;
            days -= library.num_days_for_signup;
            library.throughput = days * library.num_books_per_day;
            if (library.throughput > library.set.length) {
                library.throughput = library.set.length;
            }
            library.books.slice(0, library.throughput).each(book => points += input.scores[book]);
            simulated.push(library);
        }

        // TODO: TRY REDISTRIBUTING LOST BOOKS
        // simulated.each(library => {
        //     const unused = library.set
        //         .filter(book => !library.books.includes(book))
        //         .filter(book => !simulated.find(l => l !== library && !l.books.includes(book)));
        //     if (unused.length) {
        //         console.log(unused.length, library.throughput);
        //     }
        // });
        // console.log(input.num_books, simulated.reduce((p, library) => p + library.books.length, 0), simulated.length);

        yield {points, weights, libraries: simulated};
        ({value: weights, done} = optimizer.next(points));
    }
}
