import {Library, Reader} from './index';
import {log} from './setup';
import write, {write as blub} from './writer';
import optimize from './optimize';

declare global {
    interface Array<T> {
        each: (callback: (value: T, index: number, array: T[]) => any) => this;
    }
}

Array.prototype.each = function (callback) {
    this.forEach(callback);
    return this;
};

export default function (input: Reader, file: string) {
    const libraries = input.libraries;
    let max = 0;

    console.log('SETUP');
    for (let i = 0; i < libraries.length; i++) {
        const library = libraries[i];
        library.table = [];
        library.books.each(book => library.table[book] = input.scores[book]);
        library.set = new Set<number>(library.books);
        library.books = [];
        // library.total_score = library.table.reduce((score, book) => score + book, 0);
    }

    console.log('COLLECTING');
    const collected = new Array(input.scores.length).fill(0).map(s => []);
    libraries.each(library => library.set.forEach(book => collected[book].push(library)));
    // blub(collected.sort((a, b) => b.length - a.length).reduce((p, c) => p + ' ' + c.length, ''))(`../out/distribution.txt`);

    console.log('OPTIMIZING');
    optimize(6, weights => {
        let points = 0;

        // Sort libraries
        libraries.each(library => {
            library.books = [];
            library.rank = (
                // - library.num_days_for_signup * weights[0]
                // + library.num_books_per_day * weights[1]
                + library.set.size * weights[4]
                // + library.total_score / library.set.size * weights[5]
            );
        });
        libraries.sort((a, b) => b.rank - a.rank);

        const collected = new Array(input.scores.length).fill(0).map(s => []);
        libraries.each(library => library.set.forEach(book => collected[book].push(library)));
        collected.each((libraries, book) => {
            if (!libraries.length) return;
            const uniqueness = libraries.length;
            const score = input.scores[book];

            let largest = libraries[0];
            for (const library of libraries) {
                if (library.rank > largest.rank) {
                    largest = library;
                }
            }

            largest.books.push(book);
            largest.rank += (
                + uniqueness * weights[2]
                + score * weights[3]
            );
        });


        libraries.each(library => library.rank = (
            + library.books.length * weights[4]
        ));

        libraries.sort((a, b) => b.rank - a.rank);

        const scored = score(input, libraries);
        points = scored.points;

        if (points > max) {
            max = points;
            log.magenta('BEST: ' + points.toLocaleString());
            console.log(weights);
            write({libraries: scored.libraries})(`../out/${file}.txt`);
        }

        return points;
    });

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
        libraries.push({id: library.id, books});
    }
    return {libraries, points};
}
