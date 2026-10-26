// Pet Care Journal System
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const session = require('express-session');
const flash = require('connect-flash');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

app.use(flash());

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname); 
    }
});

const upload = multer({ storage: storage });

// View Engine and Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'secret123',
  resave: false,
  saveUninitialized: true
}));

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'RP738964$',
  database: 'petcare'
});

function sha256Hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

// Auth Middleware
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.send('Access Denied!');
}

// =========================
// Authentication Routes
// =========================

// Sign Up Page
app.get('/signup', (req, res) => {
  res.render('signup', { session: req.session });
});

// Handle Sign Up Submission
app.post('/signup', upload.single('pet_image'), (req, res) => {
  const { username, password, name, role, pet_name, species, breed, age } = req.body;
  //const petImage = req.file ? req.file.filename : '';
  let petImage;
    if (req.file) {
        petImage = req.file.filename; // Save only the filename
    } else {
        petImage = null;
    }

  const hashedPassword = sha256Hash(password);
  const sqlUser = 'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)';
  connection.query(sqlUser, [username, hashedPassword, name, role], (err, result) => {
    if (err) {
      console.error('Error creating user:', err);
      req.flash('error', 'Sign up failed. Please try again.');
      return res.redirect('/signup');
    }

    const userId = result.insertId;
    console.log(userId);
    console.log(petImage);
    const sqlPet = 'INSERT INTO pets (owner_id, name, species, breed, age, image ) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(sqlPet, [userId, pet_name, species, breed, age, petImage], (err2) => {
      if (err2) {
        console.error('Error creating pet:', err2);
        req.flash('error', 'Sign up failed while saving pet. Please try again.');
        return res.redirect('/signup');
      }

      res.redirect('/login');
    });
  });
});


// Login Page
app.get('/login', (req, res) => {
  res.render('login', { messages: req.flash('success'), 
        errors: req.flash('error'), session: req.session });
});

// Handle Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = sha256Hash(password);
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(sql, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error('Login query error:', err);
      req.flash('error', 'Unable to log in. Please check database setup.');
      return res.redirect('/login');
    }

    if (results.length > 0) {
      req.session.user = results[0];
      req.flash('success', 'Login successful!');
      if (results[0].role === 'admin') {
        res.redirect('/admin/dashboard');
      } else {
        res.redirect('/journals');
      }
    } else {
      req.flash('error', 'Invalid username or password.');
      return res.redirect('/login');
    }
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Index Page
app.get('/', (req, res) => {
  res.render('index', { session: req.session });
});

// =========================
// Dashboard (Admin)
// =========================

app.get('/admin/dashboard', isAdmin, (req, res) => {
  res.render('adminDashboard', { session: req.session });
});

// =========================
// View Users Route (Admin)
// =========================

// View All Users 
app.get('/admin/users', isAdmin, (req, res) => {
  const sql = 'SELECT id, name, username, role FROM users';
  connection.query(sql, (err, results) => {
    if (err) return res.send('Error loading users');

    res.render('adminUsers', {
      users: results,
      session: req.session
    });
  });
});

// app.get('/admin/users', isAdmin, (req, res) => {
//   const sql = `
//     SELECT users.id AS user_id, users.name AS user_name, users.username, users.role,
//            pets.name AS pet_name, pets.species, pets.breed, pets.image
//     FROM users
//     LEFT JOIN pets ON users.id = pets.owner_id
//     ORDER BY users.id
//   `;
//   connection.query(sql, (err, results) => {
//     if (err) throw err;
//     res.render('adminUsers', { usersWithPets: results, session: req.session });
//   });
// });

//View user's profile
app.get('/admin/users/:id', isAdmin, (req, res) => {
  const userId = req.params.id;

  const userSql = 'SELECT id, name, username, role FROM users WHERE id = ?';
  const petSql = 'SELECT * FROM pets WHERE owner_id = ?';
  const journalSql = `
    SELECT journal.*, pets.id AS pet_id
    FROM journal
    JOIN pets ON journal.pet_id = pets.id
    WHERE pets.owner_id = ?
  `;

  connection.query(userSql, [userId], (err, userResults) => {
    if (err || userResults.length === 0) return res.send('User not found');

    connection.query(petSql, [userId], (err2, petResults) => {
      if (err2) return res.send('Error retrieving pet info');

      connection.query(journalSql, [userId], (err3, journalResults) => {
        if (err3) return res.send('Error retrieving journal entries');

        res.render('adminUserDetails', {
          user: userResults[0],
          pets: petResults,
          journals: journalResults,
          session: req.session
        });
      });
    });
  });
});

//delete users
app.get('/admin/users/delete/:id', isAdmin, (req, res) => {
  const userId = req.params.id;
  const sql = 'DELETE FROM users WHERE id = ?';
    console.log(userId);
  connection.query(sql, [userId], (err) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.send('Error deleting user');
    }
    res.redirect('/admin/users');
  });
});


// =========================
// Pet Route
// =========================

// View Pet Profile
// app.get('/pets/:id', isLoggedIn, (req, res) => {
//   const sql = 'SELECT * FROM pets WHERE id = ?';
//   connection.query(sql, [req.params.id], (err, results) => {
//     if (err) throw err;
//     res.render('petProfile', { pet: results[0] });
//   });
// });

//add pet
app.get('/pets/new', isLoggedIn, (req, res) => {
  res.render('newPet', {session: req.session});
});

app.post('/pets', upload.single('pet_image'), isLoggedIn, (req, res) => {
  const { pet_name, species, breed, age } = req.body;
  let petImage;

  if (req.file) {
    petImage = req.file.filename; // use uploaded filename
  } else {
    petImage = null;
  }

  const ownerId = req.session.user.id;

  const sql = 'INSERT INTO pets (owner_id, name, species, breed, age, image) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(sql, [ownerId, pet_name, species, breed, age, petImage], (err) => {
    if (err) {
      console.error(err);
      return res.send('Failed to add pet.');
    }
    res.redirect('/journals');
  });
});


// =========================
// Journal Routes
// =========================

// View All Journals
app.get('/journals', isLoggedIn, (req, res) => {
  const userId = req.session.user.id;
  let selectedPetId = req.query.petId;

  // Get all pets of this user
  const petSql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(petSql, [userId], (err, pets) => {
    if (err) return res.send('Error loading pets');

    // If no pet selected yet, default to first pet (if available)
    if (!selectedPetId && pets.length > 0) {
      selectedPetId = pets[0].id;
    }

    if (!selectedPetId) {
      // No pets at all
      return res.render('journals', {
        journals: [],
        pets,
        selectedPetId: '',
        pet: null,
        session: req.session
      });
    }

    const journalSql = `
      SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
      FROM journal 
      JOIN pets ON journal.pet_id = pets.id 
      WHERE pets.owner_id = ? AND pets.id = ?
    `;
    const params = [userId, selectedPetId];

    connection.query(journalSql, params, (err2, journals) => {
      if (err2) return res.send('Error loading journals');

      // Pet info always comes from the pets list
      const petInfo = pets.find(p => p.id == selectedPetId);

      return res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet: petInfo,
        session: req.session
      });
    });
  });
});

// app.get('/journals', isLoggedIn, (req, res) => {
//   const userId = req.session.user.id;
//   const sql = `SELECT journal.*, pets.name, pets.species, pets.breed, pets.age, pets.image 
//                 AS image FROM pets 
//                 LEFT JOIN journal ON pets.id = journal.pet_id 
//                 WHERE pets.owner_id = ?`;
//   connection.query(sql, [userId], (err, journals) => {
//     res.render('journals', { journals, session: req.session });
//   });
// });

// New Journal Form
app.get('/journals/new', isLoggedIn, (req, res) => {
  const userId = req.session.user.id;
  const selectedPetId = req.query.petId; // Get optional petId from query

  const sql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(sql, [userId], (err, pets) => {
    if (err) return res.send('Error loading pets');
    
    res.render('newJournal', { pets, session: req.session, selectedPetId });
  });
});

// app.get('/journals/new', isLoggedIn, (req, res) => {
//   const userId = req.session.user.id;
//   const sql = 'SELECT * FROM pets WHERE owner_id = ?';
//   connection.query(sql, [userId], (err, pets) => {
//     res.render('newJournal', { pets, session: req.session });
//   });
// });


// Handle New Journal Submission
app.post('/journals/new', isLoggedIn, (req, res) => {
  const { pet_id, activity, notes, entry_date } = req.body;

  const sql = 'INSERT INTO journal (pet_id, activity, notes, entry_date) VALUES (?, ?, ?, ?)';
  connection.query(sql, [pet_id, activity, notes, entry_date], (err) => {
    if (err) return res.send('Error saving journal');

    // Redirect to journals page and keep selected pet
    res.redirect(`/journals?petId=${pet_id}`);
  });
});


// Edit Journal Form
app.get('/journals/edit/:id', isLoggedIn, (req, res) => {
  const journalId = req.params.id;
  const userId = req.session.user.id;

  const sqlJournal = 'SELECT * FROM journal WHERE id = ?';
  const sqlPets = 'SELECT * FROM pets WHERE owner_id = ?';

  connection.query(sqlJournal, [journalId], (err, journalResults) => {
    if (err || journalResults.length === 0) return res.send('Journal not found');

    connection.query(sqlPets, [userId], (err2, pets) => {
      if (err2) return res.send('Error fetching pets');

      res.render('editJournal', { journal: journalResults[0], pets, session: req.session });
    });
  });
});


// Handle Edit Submission
app.post('/journals/edit/:id', isLoggedIn, (req, res) => {
  const { entry_date, activity, notes, pet_id } = req.body;
  const journalId = req.params.id;

  const sql = 'UPDATE journal SET entry_date = ?, activity = ?, notes = ?, pet_id = ? WHERE id = ?';
  connection.query(sql, [entry_date, activity, notes, pet_id, journalId], (err) => {
    if (err) return res.send('Error updating journal');
    res.redirect(`/journals?petId=${pet_id}`); // 🔁 Redirect back to selected pet
  });
});


// Delete Journal (Admin Only)
app.get('/journals/delete/:id', isLoggedIn, (req, res) => {
  const journalId = req.params.id;

  // First, find the pet_id for this journal
  const findPetSql = 'SELECT pet_id FROM journal WHERE id = ?';
  connection.query(findPetSql, [journalId], (err, result) => {
    if (err || result.length === 0) return res.send('Journal not found.');

    const petId = result[0].pet_id;

    // Now delete the journal
    const deleteSql = 'DELETE FROM journal WHERE id = ?';
    connection.query(deleteSql, [journalId], (err2) => {
      if (err2) return res.send('Error deleting journal.');

      // Redirect to journals page for the correct pet
      res.redirect(`/journals?petId=${petId}`);
    });
  });
});

// app.get('/journals/delete/:id', (req, res) => {
//   const sql = 'DELETE FROM journal WHERE id = ?'
//   connection.query( sql, [req.params.id], () => {
//     res.redirect('/journals');
//   });
// });

// Search Journals
app.get('/journals/search', isLoggedIn, (req, res) => {
  const userId = req.session.user.id;
  const searchQuery = `%${req.query.q}%`;
  const selectedPetId = req.query.petId;

  const petSql = 'SELECT * FROM pets WHERE owner_id = ?';
  connection.query(petSql, [userId], (err, pets) => {
    if (err) return res.send('Error loading pets');

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

    connection.query(sql, params, (err2, journals) => {
      if (err2) return res.send('Error searching journals');

      let pet = null;
      if (selectedPetId) {
        const found = pets.find(p => p.id.toString() === selectedPetId);
        if (found) pet = found;
      }

      res.render('journals', {
        journals,
        pets,
        selectedPetId,
        pet,
        session: req.session
      });
    });
  });
});

// =========================
// Start Server
// =========================
app.listen(PORT, () => console.log(`App running on http://localhost:${PORT}`));
