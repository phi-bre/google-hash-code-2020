import {Library, Reader, Writer} from './index';

export default function (input: Reader): Writer {
    // const librarySignUpDaysMax = input.libraries.reduce((p, l) => l.num_days_for_signup > 0, input.libraries[0]);
    let libraries: Library[];
    let signUpWeight = 1;
    let throughputWeight = 1;
    let scoreAverageWeight = 1;
    let duplicateWeight = 1;
    let amountBooksWeight = 1;
    let max = 0;

    // while (true) {
        libraries = input.libraries
            .sort((a, b) => weigh(b) - weigh(a))
            .map(l => ({
                ...l,
                books: l.books.sort((a, b) => b - a)
            }) as Library);


        function weigh(a: Library) {
            const signUp = a.num_days_for_signup * signUpWeight; // less is better
            const throughput = a.num_books_per_day * throughputWeight; // higher is better
            const scoreMin = Math.min(...a.books);
            const scoreMax = Math.max(...a.books);
            let scoreAverage = a.books // higher is better
                .sort((a, b) => input.scores[b] - input.scores[a])
                .reduce((p, a) => p + a, 0);
            scoreAverage = (scoreAverage - scoreMin) / scoreMax / a.books.length * scoreAverageWeight
            const duplicates = a.books.filter(b => !input.libraries
                .find(l => l.books.indexOf(b) === -1))
                * duplicateWeight;
            // let amount = input.num_days - a.books.length;
            // if (amount < 0) amount = 0;
            // amount = amount / input.num_days * amountBooksWeight;

            // console.log(duplicates, (-signUp + throughput + scoreAverage + -duplicates) / 4)
            return (-signUp + throughput + scoreAverage + -duplicates /* + amount */) / 4;
        }

        const books = [];
        let points = 0;
        let availableDays = input.num_days;
        libraries = libraries.map(l => {
            if (availableDays - l.num_days_for_signup > 0) {
                availableDays -= l.num_days_for_signup;
                let counter = 0;
                l = {
                    id: l.id,
                    books: l.books.filter(b => {
                        counter++;
                        if (counter <= l.num_books_per_day * availableDays) {
                            if (books.indexOf(b) === -1) {
                                points += input.scores[b];
                                books.push(b);
                                return true;
                            }
                        }
                    })
                } as Library;
                return l
            }
        }).filter(l => !!l).filter(l => !!l.books.length);

        if (points > max) {
            max = points;
            console.log('BEST: ' + points.toLocaleString());
        }
    // }

    return {libraries};
}
