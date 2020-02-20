import { Library, Reader, Writer } from './index';

interface RankedLibrary {
    library: Library,
    total_days?: number,
    points?: number,
    sorted_books?: number[],
    scanable_books?: number[],
}

function sortBooksByScore(books: number[], scores: number[]) {
    const objects = books.map(idx => ({ idx, score: scores[idx] }));
    const sorted = objects.sort((a, b) => (b.score - a.score));
    return sorted.map(obj => obj.idx);
}

function rankLibrary(library: Library, book_scores: number[], total_days: number, ratio: number): RankedLibrary | null {
    const percentage = library.num_days_for_signup / total_days;
    if (percentage > ratio) {
        return null;
    }

    total_days -= library.num_days_for_signup;

    const sorted_books = sortBooksByScore(library.books, book_scores);
    const scanable_books = [];

    let points = 0;
    for (let i = 0; i < sorted_books.length; i++) {
        const book = sorted_books[i];
        points += book_scores[book];
        scanable_books.push(book);

        if ((i % library.num_books_per_day) === 0) {
            total_days--;

            if (total_days === 0) {
                return {
                    library,
                    total_days,
                    points: points / library.num_days_for_signup,
                    sorted_books,
                    scanable_books
                };
            }
        }
    }

    return { library, total_days, points: points / library.num_days_for_signup, sorted_books, scanable_books };
}

function reRankLibrary(input: Library, scores: number[]): RankedLibrary {
    let total = 0;
    for (const book of input.books) {
        total += scores[book];
    }
    return { library: input, points: total / input.num_days_for_signup };
}

interface Test {
    library: Library
    scanned_books: number,
}

function calculateTotal(libs: Library[], scores: number[], total_days: number): number {
    const processed = new Array<Test>();
    let points = 0;

    let currentSignUpIndex = 0;
    let currentSignUpLib: Library = null;
    let currentSignUpLeft = 0;

    for (let i = 0; i < total_days; i++) {
        if (currentSignUpLeft === 0) {
            if (currentSignUpLib !== null) {
                processed.push({ library: currentSignUpLib, scanned_books: 0 });
            }

            if (currentSignUpLeft !== libs.length) {
                currentSignUpLib = libs[currentSignUpIndex++];
                currentSignUpLeft = currentSignUpLib.num_days_for_signup;
            }
        }
        currentSignUpLeft--;

        for (let j = 0; j < processed.length; j++) {
            const lib = processed[j];

            for (let k = 0; k < lib.library.num_books_per_day; i++) {
                if (lib.scanned_books >= lib.library.books.length) {
                    break;
                }

                const book = lib.library.books[lib.scanned_books++];
                points += scores[book];
            }
        }
    }

    return points;
}

function runWithRatio(input: Reader, ratio: number): Writer {
    const rankedLibraries = new Array<RankedLibrary>();
    for (const library of input.libraries) {
        const ranked = rankLibrary(library, input.scores, input.num_days, ratio);
        if (ranked === null) {
            continue;
        }
        rankedLibraries.push(ranked);
    }

    const sortedRankedLibraries = rankedLibraries.sort((a, b) => (b.points - a.points));
    const scannedBooks = [];

    const reRankedLibraries = new Array<RankedLibrary>();

    for (const ranked of sortedRankedLibraries) {
        const books = [];
        for (const book of ranked.scanable_books) {
            if (scannedBooks[book] === true) {
                continue;
            }

            scannedBooks[book] = true;
            books.push(book);
        }

        if (books.length === 0) {
            continue;
        }

        const lib: Library = {
            ...ranked.library,
            books: books
        };

        const reRanked = reRankLibrary(lib, input.scores);
        reRankedLibraries.push(reRanked);
    }

    const sortedReRankedLibraries = reRankedLibraries.sort((a, b) => (b.points - a.points));
    const libraries: Array<Library> = sortedReRankedLibraries.map(lib => lib.library);

    return { libraries };
}

export default function (input: Reader): Writer {
    let output = runWithRatio(input, 0.15);
    // let max = 0;
    //
    // for (let ratio = 0.1; ratio < 1; ratio += 0.1) {
    //     const res = runWithRatio(input, ratio);
    //     const total = calculateTotal(res.libraries, input.scores, input.num_days);
    //
    //     if (total > max) {
    //         output = res;
    //     }
    // }

    return output;
}
