const {connect, connection, escapeData} = require('./mysql')

const getByMail = async (mail) => {
    connect();
    const results = await connection.promise().query('SELECT * FROM users WHERE email = ?', [mail]);
    return results;
}

const getListProducts = async () => {
    connect();
    const results = await connection.promise().query('SELECT * FROM products');
    return results;
}

const getProductByCode = async (code) => {
    connect();
    const results = await connection.promise().query('SELECT * FROM products WHERE code = ?', [code]);
    return results;
}

module.exports = {getByMail, getListProducts, getProductByCode}
