import {Library, Reader, Writer} from './index';

export default function (input: Reader): Writer {
    let libraries: Library[];
    let signUpWeight = 1;
    let throughputWeight = 1;
    let scoreAverageWeight = 1;
    let duplicateWeight = 1;
    let amountBooksWeight = 1;
    let max = 0;

    // while (true) {
        libraries = input.libraries
            .sort((a, b) => compare(b) - compare(a))
            .map(l => ({
                ...l,
                books: l.books.sort((a, b) => b - a)
            }) as Library);


        function compare(a: Library) {
            const signUp = a.num_days_for_signup * signUpWeight; // less is better
            const throughput = a.num_books_per_day * throughputWeight; // higher is better
            const scoreAverage = a.books // higher is better
                .sort((a, b) => input.scores[b] - input.scores[a])
                .reduce((p, a) => p + a, 0)
                / a.books.length * scoreAverageWeight;
            const duplicates = a.books.filter(b => !input.libraries
                .find(l => l.books.indexOf(b)))
                * duplicateWeight;
            return (-signUp + throughput + scoreAverage + -duplicates) / 4;
        }

        const books = new Set<number>();
        let points = 0;
        let availableDays = input.num_days;
        libraries = libraries.map(l => {
            if (availableDays > 0) {
                availableDays -= l.num_days_for_signup;
                return {
                    id: l.id,
                    books: l.books.filter(b => {
                        if (!books.has(b)) {
                            points += input.scores[b];
                            return true;
                        }
                        books.add(b);
                    }).slice(0, l.num_books_per_day * availableDays)
                } as Library;
            }
        }).filter(l => !!l).filter(l => !!l.books.length);

        if (points > max) {
            max = points;
            console.log('BETTER: ' + points);
        }
    // }

    return {libraries};
}
