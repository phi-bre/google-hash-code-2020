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

    // COLLECTING
    const collected = new Array(input.scores.length).fill(0).map(() => []) as Library[][];
    libraries.each(library => {
        library.set.each(book => {
            collected[book].push(library);
        });
    });

    // FILTERING
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
                library.rank += (
                    + library.set.length * weights[0]
                    - library.num_days_for_signup * weights[1]
                    + library.num_books_per_day * weights[2]
                    + library.throughput * weights[8]
                    // - library.num_days_for_signup / input.num_days * weights[9]
                )
            });
            collected[book].sort((a, b) => b.rank - a.rank);
        });

        // SORT BOOKS
        filtered.each(book => {
            rank[book] = (
                + collected[book].length * weights[3]
                + input.scores[book] * weights[4]
            );
        });
        filtered.sort((a, b) => rank[b] - rank[a]);

        // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
        filtered.each(book => {
            const libraries = collected[book];
            libraries.each(library => {
                library.rank += (
                    library.books.length * weights[5]
                );
            });
            const [best] = libraries.sort((a, b) => b.rank - a.rank);
            best.rank += (
                + libraries.length * weights[6]
                + input.scores[book] * weights[7]
            );
            best.books.push(book);
        });

        // SORT LIBRARIES
        libraries.sort(((a, b) => b.rank - a.rank));
        libraries.each(library => library.throughput = 0);

        // CALCULATE THROUGHPUT AND POINTS
        let days = input.num_days, points = 0;
        const simulated = [];
        for (const library of libraries) {
            if (days - library.num_days_for_signup < 0) continue;
            days -= library.num_days_for_signup;
            if (days < 0) days = 0;
            library.throughput = days * library.num_books_per_day;
            library.books.slice(0, library.throughput).each(book => points += input.scores[book]);
            simulated.push(library);
        }

        // TODO: TRY REDISTRIBUTING LOST BOOKS

        yield {points, weights, libraries: simulated};
        ({value: weights, done} = optimizer.next(points));
    }
}
