const express = require('express');
const upload = require('../config/upload');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/signup', authController.showSignup);
router.post('/signup', upload.single('pet_image'), authController.signup);
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

module.exports = router;
