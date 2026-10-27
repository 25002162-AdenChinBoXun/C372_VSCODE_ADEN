const express = require('express');
const pageController = require('../controllers/pageController');

const router = express.Router();

router.get('/', pageController.showIndex);

module.exports = router;
