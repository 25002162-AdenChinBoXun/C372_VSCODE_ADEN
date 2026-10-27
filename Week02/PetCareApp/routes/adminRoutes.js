const express = require('express');
const { isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.get('/admin/dashboard', isAdmin, adminController.showDashboard);
router.get('/admin/users', isAdmin, adminController.listUsers);
router.get('/admin/users/:id', isAdmin, adminController.showUserDetails);
router.get('/admin/users/delete/:id', isAdmin, adminController.deleteUser);

module.exports = router;
