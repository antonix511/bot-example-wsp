const cleanNumber = (number) => {
    number = number.replace('@c.us', '');
    number = `${number}@c.us`;
    return number;
}

const isValidNumber = (number) => {
    const regexGroup = /\@g.us\b/gm;
    const exist = number.match(regexGroup);
    return !exist;
}

module.exports = {cleanNumber, isValidNumber}
