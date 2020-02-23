export const colors = {
    magenta: '\x1b[30m\x1b[35m\x1b[1m',
    cyan: '\x1b[30m\x1b[36m\x1b[1m',
    white: '\x1b[30m\x1b[37m\x1b[1m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

function logger(color: string) {
    return function (title: string, ...value: any[]) {
        console.log(`${color}${title}${colors.reset}`);
        if (value.length) {
            console.log(...value);
            console.log();
        }
    }
}

export const log = {
    magenta: logger(colors.magenta),
    cyan: logger(colors.cyan),
    white: logger(colors.white),
    bold: logger(colors.bold),
};

export function setup(files: string[], run: (file: string, label: string) => void) {
    console.log(`${colors.white}${colors.reset}`);
    log.white('Google Hash Code 2020 🎉');
    for (const file of files) {
        const label = `${colors.white}FILE:${colors.reset} ${file}.in ${colors.bold}`;
        run(file, label);
        process.stdout.write(colors.reset);
    }
}
