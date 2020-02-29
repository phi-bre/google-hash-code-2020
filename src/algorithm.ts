import {Library, Reader} from './index';
import {log} from './setup';

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

export default function (input: Reader) {
    let libraries = input.libraries;

    const statistics = {
        score: stats(input.scores),
        signup: stats(libraries, library => library.num_days_for_signup),
        fake: stats(libraries, library => library.num_books_per_day),
        throughput: stats(libraries, library =>
            (library.num_books_per_day * input.num_days > library.books.length)
                ? library.books.length : library.num_books_per_day * input.num_days),
        size: stats(libraries, library => library.books.length),
        rarity: null as Statistic,
    };

    log.white('DAYS:', input.num_days.toLocaleString());
    log.white('LIBRARIES:', input.num_libraries.toLocaleString());
    log.white('BOOKS:', input.num_books.toLocaleString());

    // ASSOCIATE BOOKS WITH LIBRARIES
    const collected = new Array(input.scores.length).fill(0).map(() => []) as Library[][];
    libraries.each(library => {
        library.set = library.books;
        library.table = [];
        library.throughput = Number.MAX_VALUE;
        library.books = [];
        library.rank = 0;
        library.set.each(book => {
            collected[book].push(library);
            library.table[book] = 1;
        });

    });

    // FILTER BOOKS WITHOUT LIBRARY
    const filtered = [] as number[], map = new Map();
    collected.each((libraries, book) => {
        if (libraries.length) {
            filtered.push(book);
            map.set(libraries, book);
        }
    });

    statistics.rarity = stats(filtered, book => collected[book].length);
    console.table(statistics);

    const bookSort = (book: number) => (
        // + input.scores[book] * statistics.score.spread
        + collected[book].length //* statistics.rarity.spread
    );

    const librarySort = (library: Library) => (
        - library.num_days_for_signup * statistics.signup.spread
        + library.num_books_per_day * statistics.throughput.spread // TODO: Try with 'actual' throughput
        + library.set.length * statistics.size.spread
        // + library.set.reduce((p, book) => p + bookSort(book), 0) // TODO: Try with 'actual' books
    );


    // libraries.sort(((a, b) => b.set.length - a.set.length));
    collected.sort(((a, b) => bookSort(map.get(b)) - bookSort(map.get(a))));

    let points = 0, days = input.num_days, signed = new Set();
    for (let book = 0; book < collected.length; book++) {
        const libraries = collected[book];
        const best = libraries
            .each(library => {
                library.rank = library.set.reduce((p, book) => {
                    return p + collected[book].length;
                }, 0);
            })
            .sort((a, b) => b.rank - a.rank)
            .find(library => library.set.length > library.books.length);

        if (best) {
            if (!signed.has(best)) {
                days -= best.num_days_for_signup;
                signed.add(best);
            }
            best.books.push(book);
            points += input.scores[book];
        }

        if (days < 0) {
            break;
        }
    }

    // libraries.sort(((a, b) => b.rank - a.rank));
    // let points = 0, days = input.num_days;
    // const simulated = [], taken = [];
    // for (const library of libraries) {
    //     if (days - library.num_days_for_signup <= 0) break;
    //     days -= library.num_days_for_signup;
    //     simulated.push(library);
    //     library.books = library.set
    //         .filter(book => !taken[book])
    //         .slice(0, days * library.num_books_per_day)
    //         .each(book => {
    //             points += input.scores[book];
    //             taken[book] = true;
    //         })
    // }

    return {points, libraries};

    // let days = input.num_days, points = 0;
    // let a = libraries[0], i = 0;
    // const simulated = [], taken = [];
    //
    // while (days - a.num_days_for_signup > 0) {
    //     days -= a.num_days_for_signup;
    //     let throughput = days * a.num_books_per_day;
    //     if (throughput > a.set.length) {
    //         throughput = a.set.length
    //     }
    //     for (const book of a.set) {
    //         if (!taken[book]) {
    //             taken[book] = true;
    //             a.books.push(book);
    //         }
    //     }
    //
    //     let overlap = Number.MAX_VALUE, best = libraries[0];
    //
    //     for (let j = 1; j < libraries.length; j++) {
    //         const b = libraries[j];
    //         let o = 0;
    //         for (let i = 0; i < a.set.length; i++) {
    //             if (b.table[a.set[i]] === 1) {
    //                 o++;
    //                 // console.log(o);
    //             }
    //         }
    //
    //         // console.log(o);
    //         const hasLessOverlap = o > overlap;
    //         const hasMoreBooksInCaseOfSameOverlap = o === overlap && (b.set.length > best.set.length);
    //         if (hasLessOverlap || hasMoreBooksInCaseOfSameOverlap) {
    //             best = b;
    //             i = j;
    //             overlap = o;
    //         }
    //     }
    //
    //     // console.log(overlap)
    //
    //     simulated.push(a);
    //     libraries.splice(i, 1);
    //     a = best;
    // }

    // const ranked = [], taken = []; // TODO: Try taken with book switching
    // let days = input.num_days, points = 0;
    // for (const library of libraries) {
    //     if ((days - library.num_days_for_signup) <= 0) continue;
    //     days -= library.num_days_for_signup;
    //     let throughput = days * library.num_books_per_day;
    //     if (throughput > library.set.length) {
    //         throughput = library.set.length;
    //     }
    //     for (const book of library.set) {
    //         if (library.books.length >= throughput) break;
    //         if (!taken[book]) {
    //             points += input.scores[book];
    //             taken[book] = library;
    //             library.books.push(book);
    //         }
    //     }
    // }

    // filtered.sort((a, b) => bookSort(b) - bookSort(a));
    //
    // let points = 0, days = input.num_days;
    // for (const book of filtered) {
    //     const optimal = collected[book]
    //         .sort((a, b) => librarySort(b) - librarySort(a))
    //         .find(library => library.books.length < library.throughput);
    //
    //     if (optimal) {
    //         optimal.books.push(book);
    //         points += input.scores[book];
    //
    //         if (optimal.books.length === 1) {
    //             days -= optimal.num_days_for_signup;
    //             if (days <= 0) break;
    //             optimal.throughput = optimal.num_books_per_day * days;
    //
    //             if (optimal.throughput > optimal.set.length) {
    //                 optimal.throughput = optimal.set.length;
    //             }
    //         }
    //     }
    // }

    // return score(input, libraries);
    //
    // function score(input: Reader, sorted: Library[]) {
    //     const taken = [] as boolean[];
    //     let points = 0;
    //     let availableDays = input.num_days;
    //     const libraries = [] as Library[];
    //     for (const library of sorted) {
    //         if (!(availableDays - library.num_days_for_signup > 0)) continue;
    //         availableDays -= library.num_days_for_signup;
    //         let counter = 0;
    //         const books = [];
    //
    //         for (const book of library.books) {
    //             counter++;
    //             if (counter > (library.num_books_per_day * availableDays)) break;
    //             if (taken[book] === true) continue;
    //             points += input.scores[book];
    //             books.push(book);
    //             taken[book] = true;
    //         }
    //
    //         if (books.length === 0) {
    //             availableDays += library.num_days_for_signup;
    //             continue;
    //         }
    //         libraries.push({id: library.id, books});
    //     }
    //     return {libraries, points};
    // }

    // for (const book of filtered) {
    //     const sort = library => (
    //         + library.rank
    //         + library.books.length
    //     );
    //     const optimal = collected[book]
    //         .sort((a, b) => sort(b) - sort(a))
    //         .find(library => library.books.length < library.throughput);
    //     if (optimal) {
    //         optimal.books.push(book);
    //         points += input.scores[book];
    //
    //         if (optimal.books.length === 1) {
    //             days -= optimal.num_days_for_signup;
    //             if (days <= 0) break;
    //             optimal.throughput = optimal.num_days_for_signup * days;
    //             if (optimal.throughput > optimal.set.length) {
    //                 optimal.throughput = optimal.set.length;
    //             }
    //
    //         }
    //     }
    // }

    // return score(input, libraries);

    // function score(input: Reader, sorted: Library[]) {
    //     const taken = [] as boolean[];
    //     let points = 0;
    //     let availableDays = input.num_days;
    //     const libraries = [] as Library[];
    //     for (const library of sorted) {
    //         if (!(availableDays - library.num_days_for_signup > 0)) continue;
    //         availableDays -= library.num_days_for_signup;
    //         let counter = 0;
    //         const books = [];
    //
    //         for (const book of library.books) {
    //             counter++;
    //             if (counter > (library.num_books_per_day * availableDays)) break;
    //             if (taken[book] === true) continue;
    //             points += input.scores[book];
    //             books.push(book);
    //             taken[book] = true;
    //         }
    //
    //         if (books.length === 0) continue;
    //         libraries.push({id: library.id, books});
    //     }
    //     return {libraries, points};
    // }
    // yield score(input, libraries);
    // yield {points, libraries};
    // return;

    // LIBRARY ASSOCIATIONS FOR BOOKS
    // filtered.each(book => {
    //     collected[book].each(library => {
    //         library.rank -= library.num_days_for_signup * librarySignUpSpread;
    //         // library.rank += library.num_books_per_day * libraryThroughputSpread;
    //         // const throughput = library.num_books_per_day * input.num_days;
    //         // library.rank += library.throughput * libraryLengthSpread;
    //         // console.log(((library.set.length > throughput) ? throughput : library.set.length) * libraryLengthSpread)
    //     });
    //     collected[book].sort((a, b) => b.rank - a.rank);
    // });
    //
    // // SORT BOOKS
    // const rank = [];
    // filtered.each(book => {
    //     rank[book] = (
    //         // + collected[book].length * bookScoreSpread // The rarity of the book
    //         + input.scores[book] * bookScoreSpread
    //     );
    // });
    // filtered.sort((a, b) => rank[b] - rank[a]);
    //
    // // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
    // filtered.each(book => {
    //     const libraries = collected[book];
    //     libraries.each(library => {
    //         library.rank += library.books.length * bookScoreSpread;
    //     });
    //     const [best] = libraries.sort((a, b) => b.rank - a.rank);
    //     best.rank += (
    //         + libraries.length
    //         + input.scores[book] * bookScoreSpread
    //     );
    //     best.books.push(book);
    // });
    //
    // // SORT LIBRARIES
    // libraries.sort(((a, b) => b.rank - a.rank));
    //
    // // CALCULATE THROUGHPUT AND POINTS
    // let days = input.num_days, points = 0;
    // const simulated = [];
    // for (const library of libraries) {
    //     if (days - library.num_days_for_signup < 0) continue;
    //     days -= library.num_days_for_signup;
    //     library.throughput = days * library.num_books_per_day;
    //     if (library.throughput > library.set.length) {
    //         library.throughput = library.set.length;
    //     }
    //     library.books.slice(0, library.throughput).each(book => points += input.scores[book]);
    //     simulated.push(library);
    // }
    // yield {points, libraries: simulated};
    // return;
    // OPTIMIZING
    // const rank = [];
    // const optimizer = optimize(Infinity, 10);
    // let {value: weights, done} = optimizer.next();
    // while (!done) {
    //
    //     // RESET
    //     libraries.each(library => {
    //         library.books.length = 0;
    //         library.rank = 0;
    //     });
    //
    //     // LIBRARY ASSOCIATIONS FOR BOOKS
    //     filtered.each(book => {
    //         collected[book].each(library => {
    //             library.rank += (0
    //                 - library.num_days_for_signup * weights[0]
    //                 // + library.num_books_per_day * weights[1]
    //                 // + library.throughput * weights[2]
    //                 // + library.set.length * weights[3]
    //             )
    //         });
    //         collected[book].sort((a, b) => b.rank - a.rank);
    //     });
    //
    //     // SORT BOOKS
    //     filtered.each(book => {
    //         rank[book] = (
    //             + collected[book].length * weights[4] // The rarity of the book
    //             + input.scores[book] * weights[5] // The score of the book
    //         );
    //     });
    //     filtered.sort((a, b) => rank[b] - rank[a]);
    //
    //     // DISTRIBUTE BOOKS TO THE 'BEST' LIBRARIES
    //     filtered.each(book => {
    //         const libraries = collected[book];
    //         libraries.each(library => {
    //             library.rank += (
    //                 library.books.length * weights[6]
    //             );
    //         });
    //         const [best] = libraries.sort((a, b) => b.rank - a.rank);
    //         best.rank += (
    //             + libraries.length * weights[7] // How unique the book is
    //             + input.scores[book] * weights[8] // How many points the book can score
    //         );
    //         best.books.push(book);
    //     });
    //
    //     // SORT LIBRARIES
    //     libraries.sort(((a, b) => b.rank - a.rank));
    //
    //     // CALCULATE THROUGHPUT AND POINTS
    //     let days = input.num_days, points = 0;
    //     const simulated = [];
    //     for (const library of libraries) {
    //         if (days - library.num_days_for_signup < 0) continue;
    //         days -= library.num_days_for_signup;
    //         library.throughput = days * library.num_books_per_day;
    //         if (library.throughput > library.set.length) {
    //             library.throughput = library.set.length;
    //         }
    //         library.books.slice(0, library.throughput).each(book => points += input.scores[book]);
    //         simulated.push(library);
    //     }
    //
    //     // TODO: TRY REDISTRIBUTING LOST BOOKS
    //     // simulated.each(library => {
    //     //     const unused = library.set
    //     //         .filter(book => !library.books.includes(book))
    //     //         .filter(book => !simulated.find(l => l !== library && !l.books.includes(book)));
    //     //     if (unused.length && library.throughput) {
    //     //         console.log(unused.length, library.throughput);
    //     //     }
    //     // });
    //     // console.log(input.num_books, simulated.reduce((p, library) => p + library.books.length, 0), simulated.length);
    //
    //     yield {points, weights, libraries: simulated};
    //     ({value: weights, done} = optimizer.next(points));
    // }
}
