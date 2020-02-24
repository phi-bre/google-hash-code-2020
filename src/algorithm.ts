import {Library, Reader} from './index';
import {log} from './setup';
import write from './writer';
import optimize from './optimize';

export default function (input: Reader, file: string) {
    let max = 0;

    const rating = new Array(input.scores.length).fill(1);
    input.libraries.forEach(l => l.books.forEach(b => rating[b] += 1));
    let libraries = input.libraries.map(library => ({
        ...library,
        rank: 0,
        throughput: 0,
        table: library.books.sort((a, b) => input.scores[b] - input.scores[a])
            .reduce((p, b) => (p[b] = input.scores[b], p), []),
        set: new Set(library.books.sort((a, b) => input.scores[b] - input.scores[a])),
    }));

    let books = input.libraries
        
        .sort((a, b) => input.scores[b] - input.scores[a]);
        // .reduce((p, l) => (l.books.forEach(b => p.add(b)), p), new Set<number>());
    // books = Array.from(books)

    optimize(6, weights => {
        // Sort the libraries by sign-up
        for (const library of libraries) {
            library.rank = (
                - library.num_days_for_signup * weights[2]
                + library.set.size * weights[3]
                + Array.from(library.set).reduce((p, b) => p + input.scores[b], 0) * weights[4]
                + library.books.reduce((p, b) => p + rating[b], 0) * weights[3]
            );
        }
        libraries.sort((a, b) => b.rank - a.rank);

        // Simulate and find throughput of libraries
        let days = input.num_days;
        const simulated = [] as Library[];
        for (const library of libraries) {
            if (days - library.num_days_for_signup < 0) continue;
            days -= library.num_days_for_signup;
            if (days < 0) days = 0;
            library.throughput = days * library.num_books_per_day;
            simulated.push(library);
        }

        // Move around the simulated libraries
        for (const library of simulated) {
            library.books = [];
            library.rank = (
                + library.throughput * weights[0]
                + Array.from(library.set).reduce((p, b) => p + input.scores[b], 0) * weights[4]
                // + library.books.reduce((p, b) => p + input.scores[b], 0) * weights[1]
            );
        }
        simulated.sort((a, b) => b.rank - a.rank);

        // Distribute the books
        let points = 0, loss = 0, slots = 0;
        if (true /*libraries.length === 30_000*/) {
            const taken = [] as boolean[];
            for (const library of simulated) {
                let collected = 0;
                library.set.forEach(book => {
                    if (library.books.length < library.throughput && !taken[book]) {
                        taken[book] = true;
                        points += input.scores[book];
                        library.books.push(book);
                        collected++;
                    }
                });
            }
        } else {
            const libraries = new Set<Library>(simulated);
            books: for (const book of books) {
                for (const library of libraries) {
                    if (library.books.length === library.throughput) {
                        libraries.delete(library);
                    }
                    if (library.table[book]) {
                        library.books.push(book);
                        points += input.scores[book];
                        continue books;
                    }
                }
            }

            // books: for (const book of books) {
            //     for (const library of simulated) {
            //         if (library.books.length < library.throughput && library.table[book]) {
            //             library.books.push(book);
            //             points += input.scores[book];
            //             continue books;
            //         }
            //     }
            //     loss++;
            // }
        }

        // for (const library of libraries) {
        //     slots += library.throughput - library.books.length;
        // }

        if (points > max) {
            max = points;
            log.magenta('BEST: ' + points.toLocaleString() + ' BOOKS: ' + simulated.reduce((p, l) => p + l.books.length, 0) + ' LIBRARIES: ' + simulated.length.toLocaleString());
            console.log(weights);
            write({libraries: simulated})(`../out/${file}.txt`);
        }

        return points;
    });

    return max;
}
