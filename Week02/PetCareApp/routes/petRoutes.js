const express = require('express');
const upload = require('../config/upload');
const { isLoggedIn } = require('../middleware/auth');
const petController = require('../controllers/petController');

const router = express.Router();

router.get('/pets/new', isLoggedIn, petController.showNewPet);
router.post('/pets', upload.single('pet_image'), isLoggedIn, petController.createPet);

module.exports = router;
