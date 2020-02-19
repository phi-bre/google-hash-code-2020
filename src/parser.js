
export default function (string) {
    const lines = string.split('\n');
    const [max, types] = lines[0].split(' ').map(Number);
    const slices = lines[1].split(' ', types).map(Number);
    return {max, slices};
}
