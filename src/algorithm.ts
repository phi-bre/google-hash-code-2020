import {Library, Reader} from './index';
import optimize from './optimize';

export default function* (input: Reader) {
    let libraries = input.libraries;

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

        // LIBRARY ASSOCIATIONS FOR BOOKS
        filtered.each(book => {
            collected[book].each(library => {
                library.rank += (0
                    - library.num_days_for_signup * weights[0]
                    // + library.num_books_per_day * weights[1]
                    // + library.throughput * weights[2]
                    // + library.set.length * weights[3]
                )
            });
            collected[book].sort((a, b) => b.rank - a.rank);
        });

        // SORT BOOKS
        filtered.each(book => {
            rank[book] = (
                + collected[book].length * weights[4] // The rarity of the book
                + input.scores[book] * weights[5] // The score of the book
            );
        });
        filtered.sort((a, b) => rank[b] - rank[a]);

        // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
        filtered.each(book => {
            const libraries = collected[book];
            libraries.each(library => {
                library.rank += (
                    library.books.length * weights[6]
                );
            });
            const [best] = libraries.sort((a, b) => b.rank - a.rank);
            best.rank += (
                + libraries.length * weights[7] // How unique the book is
                + input.scores[book] * weights[8] // How many points the book can score
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
        //     if (unused.length && library.throughput) {
        //         console.log(unused.length, library.throughput);
        //     }
        // });
        console.log(input.num_books, simulated.reduce((p, library) => p + library.books.length, 0), simulated.length);

        yield {points, weights, libraries: simulated};
        ({value: weights, done} = optimizer.next(points));
    }
}
