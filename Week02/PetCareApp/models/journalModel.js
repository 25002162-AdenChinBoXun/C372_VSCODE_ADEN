const connection = require('../config/db');

function findByOwnerForAdmin(userId, callback) {
  const sql = `
    SELECT journal.*, pets.id AS pet_id
    FROM journal
    JOIN pets ON journal.pet_id = pets.id
    WHERE pets.owner_id = ?
  `;
  connection.query(sql, [userId], callback);
}

function findForPetList(userId, selectedPetId, callback) {
  const sql = `
      SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
      FROM journal 
      JOIN pets ON journal.pet_id = pets.id 
      WHERE pets.owner_id = ? AND pets.id = ?
    `;
  connection.query(sql, [userId, selectedPetId], callback);
}

function create(petId, activity, notes, entryDate, callback) {
  const sql = 'INSERT INTO journal (pet_id, activity, notes, entry_date) VALUES (?, ?, ?, ?)';
  connection.query(sql, [petId, activity, notes, entryDate], callback);
}

function findById(journalId, callback) {
  const sql = 'SELECT * FROM journal WHERE id = ?';
  connection.query(sql, [journalId], callback);
}

function update(journalId, entryDate, activity, notes, petId, callback) {
  const sql = 'UPDATE journal SET entry_date = ?, activity = ?, notes = ?, pet_id = ? WHERE id = ?';
  connection.query(sql, [entryDate, activity, notes, petId, journalId], callback);
}

function findPetId(journalId, callback) {
  const sql = 'SELECT pet_id FROM journal WHERE id = ?';
  connection.query(sql, [journalId], callback);
}

function remove(journalId, callback) {
  const sql = 'DELETE FROM journal WHERE id = ?';
  connection.query(sql, [journalId], callback);
}

function search(userId, searchQuery, selectedPetId, callback) {
  let sql = `
      SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
      FROM journal 
      JOIN pets ON journal.pet_id = pets.id 
      WHERE pets.owner_id = ? AND (journal.activity LIKE ? OR journal.notes LIKE ?)`;

  const params = [userId, searchQuery, searchQuery];

  if (selectedPetId) {
    sql += ' AND pets.id = ?';
    params.push(selectedPetId);
  }

  connection.query(sql, params, callback);
}

module.exports = {
  findByOwnerForAdmin,
  findForPetList,
  create,
  findById,
  update,
  findPetId,
  remove,
  search
};
