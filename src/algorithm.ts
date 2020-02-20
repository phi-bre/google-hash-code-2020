import {Library, Reader, Writer} from './index';

export default function (input: Reader): Writer {
    let { num_libraries, libraries, num_books, num_days, scores } = input;

    /*const finalLibraries = [];
    const countedBooks = [];

    let mostValuableLibraryScore = 0;
    let mostValuableLibrary = null;
    for(let library of libraries){
        let scoreOfLibrary = 0;

        let restingDays = num_days - library.num_days_for_signup;

        let books_in_order = library.books.sort((a, b) => b - a);

        let daysToScanAllBooksOfLibrary = Math.floor(books_in_order.length / library.num_books_per_day) + 1;
        for (let day = 0; day < daysToScanAllBooksOfLibrary && day < restingDays; day++) {
            for (let i = 0; i < library.num_books_per_day; i++) {
                let indexInArray = day * library.num_books_per_day + i;
                if(indexInArray < library.books.length) {
                    scoreOfLibrary = scoreOfLibrary + books_in_order[indexInArray];
                } else {
                     break;
                }
            }
        }
        if(scoreOfLibrary > mostValuableLibraryScore){
            mostValuableLibraryScore = scoreOfLibrary;
            mostValuableLibrary = library;
        }
    }*/

    libraries = shuffle(libraries);
    getLibrariesAndBooks(libraries, num_days);

    return {libraries: finalLibraries};
}

const finalLibraries = [];
const countedBooks = [];
function getLibrariesAndBooks(restingLibraries: Library[], daysToGo: number) {
    let mostValuableLibraryScore = 0;
    let mostValuableLibrary: Library = null;
    let mostValuableLib_uses_books = [];
    for(let library of restingLibraries) {
        let scoreOfLibrary = 0;
        let library_uses_books = [];

        let restingDays = daysToGo - library.num_days_for_signup;

        let resting_books_in_order = library.books
            .filter(value => countedBooks.indexOf(value) == -1)
            .sort((a, b) => b - a);
        library.books = resting_books_in_order;

        let daysToScanAllBooksOfLibrary = Math.floor(resting_books_in_order.length / library.num_books_per_day) + 1;
        for (let day = 0; day < daysToScanAllBooksOfLibrary && day < restingDays; day++) {
            for (let i = 0; i < library.num_books_per_day; i++) {
                let indexInArray = day * library.num_books_per_day + i;
                if (indexInArray < resting_books_in_order.length) {
                    let book = resting_books_in_order[indexInArray];
                    library_uses_books.push(book);
                    scoreOfLibrary = scoreOfLibrary + book;
                } else {
                    break;
                }
            }
        }
        if (scoreOfLibrary > mostValuableLibraryScore) {
            mostValuableLibraryScore = scoreOfLibrary;
            mostValuableLibrary = library;
            mostValuableLib_uses_books = library_uses_books;
        }
    }
    if(mostValuableLibrary) {
        countedBooks.push(...mostValuableLib_uses_books);
        finalLibraries.push(mostValuableLibrary);

        restingLibraries.splice(restingLibraries.indexOf(mostValuableLibrary), 1);
        daysToGo = daysToGo - mostValuableLibrary.num_days_for_signup;

        let finished = daysToGo == 0 || restingLibraries.length == 0;
        if (finished) return;
        getLibrariesAndBooks(restingLibraries, daysToGo);
    }
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
