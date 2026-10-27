const connection = require('../config/db');

function create(ownerId, name, species, breed, age, image, callback) {
  const sql = 'INSERT INTO pets (owner_id, name, species, breed, age, image) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [ownerId, name, species, breed, age, image], callback);
}

function createFromSignup(ownerId, name, species, breed, age, image, callback) {
  const sql = 'INSERT INTO pets (owner_id, name, species, breed, age, image ) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [ownerId, name, species, breed, age, image], callback);
}

function findByOwner(ownerId, callback) {
  const sql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(sql, [ownerId], callback);
}

function findAllByOwner(ownerId, callback) {
  const sql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(sql, [ownerId], callback);
}

function findForAdmin(userId, callback) {
  const sql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(sql, [userId], callback);
}

module.exports = { create, createFromSignup, findByOwner, findAllByOwner, findForAdmin };
