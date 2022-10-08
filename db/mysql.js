const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ||'',
    database: process.env.DB_DATABASE || 'test'
});

const connect = () => connection.connect(function (error) {
    if (error) {
        console.log('Error al contectar a la bd: ' + error.stack);
        return;
    }

    console.log('Conexión lista!!!');
});

const escapeData = (data) => {
    return mysql.escape(data);
}

module.exports = {connect, connection, escapeData}