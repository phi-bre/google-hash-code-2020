import {Library, Reader} from './index';
import {log} from './setup';
import write from './writer';
import optimize from './optimize';

// What is the minimum of libraries to get the maximum of books -> distribution
// Getting the highest score -> sorting the books by their score & sorting the libraries by their throughput
// Finding the throughput of a library -> distribution -> get the max

// Rank the books
// - rarity
// - score

// Rank the libraries by
// - sign-up time
// - number of books per day
// ~ what books it has (e.g. rarity and score of its books)
// ~ throughput

export default function (input: Reader, file: string) {
    let libraries = input.libraries;

    // const avg_library_size = input.libraries.reduce((p, l) => p + l.books.length, 0) / input.libraries.length;
    // console.log('APROX MAX POINTS: ' + input.libraries.reduce((p, l) => {
    //     return p +
    // }));

    console.log('SETUP');
    for (let i = 0; i < libraries.length; i++) {
        const library = libraries[i];
        // library.table = [];
        // library.books.each(book => library.table[book] = input.scores[book]);
        // library.set = new Set<number>(library.books);
        library.set = library.books;
        library.books = [];
        library.rank = 0;
        library.associations = [];
    }

    console.log('COLLECTING');
    const collected = new Array(input.scores.length).fill(0).map(s => []);
    libraries.each(library => {
        library.set.forEach(book => {
            collected[book].push(library);
        });
    });

    const filtered = [];
    collected.each((libraries, book) => {
        if (libraries.length) {
            filtered.push(book);
        }
    });

    let max = 0;
    while (true) {
        optimize(6, weights => {
            libraries.each(library => {
                library.books = [];
                library.rank = 0;
            });

            filtered
                .each(book => {
                    collected[book]
                        .each(library => {
                            library.rank += (
                                // - libraries.length * weights[0]
                                - library.num_days_for_signup * weights[1]
                                + library.num_books_per_day * weights[2]
                            )
                        })
                        .sort((a, b) => b.rank - a.rank);
                })
                .sort((a, b) => {
                    const sort = book => (
                        + collected[b].length * weights[3]
                        + input.scores[book] * weights[4]
                    );
                    return sort(b) - sort(a);
                })
                .each(book => {
                    const libraries = collected[book];
                    const largest = libraries[0];
                    largest.rank += (
                        // + libraries.length * weights[7]
                        + input.scores[book] * weights[5]
                    );
                    largest.books.push(book);
                });

            libraries.sort(((a, b) => b.rank - a.rank));
            const {points, libraries: scored} = score(input, libraries);
            if (points > max) {
                max = points;
                log.magenta('BEST: ' + points.toLocaleString());
                console.log(weights);
                write({libraries: scored})(`../out/${file}.txt`);
            }
            return points;
        });
    }

    return max;
}

function score(input: Reader, sorted: Library[]) {
    const taken = [] as boolean[];
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
            if (taken[book] === true) continue;
            points += input.scores[book];
            books.push(book);
            taken[book] = true;
        }

        if (books.length === 0) continue;
        libraries.push({id: library.id, books} as Library);
    }
    return {libraries, points};
}
