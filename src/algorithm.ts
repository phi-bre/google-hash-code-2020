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

function rankLibrary(library: Library, book_scores: number[], total_days: number): RankedLibrary|null {
    const percentage = library.num_days_for_signup / total_days;
    if (percentage > 0.3) {
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
                return { library, total_days, points, sorted_books, scanable_books };
            }
        }
    }

    return { library, total_days, points, sorted_books, scanable_books };
}

function reRankLibrary(input: Library, scores: number[]): RankedLibrary {
    let total = 0;
    for (const book of input.books) {
        total += scores[book];
    }
    return { library: input, points: total };
}

export default function (input: Reader): Writer {
    const rankedLibraries = new Array<RankedLibrary>();
    for (const library of input.libraries) {
        const ranked = rankLibrary(library, input.scores, input.num_days);
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
            if (scannedBooks[book]) {
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
            books: books,
        };

        const reRanked = reRankLibrary(lib, input.scores);
        reRankedLibraries.push(reRanked);
    }

    const sortedReRankedLibraries = reRankedLibraries.sort((a, b) => (b.points - a.points));
    const libraries: Array<Library> = sortedReRankedLibraries.map(lib => lib.library);

    return { libraries };
}
