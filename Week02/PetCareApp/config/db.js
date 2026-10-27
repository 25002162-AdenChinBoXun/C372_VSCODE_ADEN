const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'RP738964$',
  database: 'petcare'
});

module.exports = connection;
