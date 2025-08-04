const express = require('express');
const { register, login, validUser, googleAuth, logout, searchUsers, updateInfo, getUserById } = require('../controllers/user');
const { Auth } = require('../middleware/user');
const router = express.Router();


router.post('/auth/register', register);
router.post('/auth/login', login)
router.get('/auth/valid', Auth, validUser);
router.get('/auth/logout', Auth, logout);
router.post('/api/google', googleAuth);
router.get('/api/user?', Auth, searchUsers);
router.get('/api/users/:id', Auth, getUserById);
router.patch('/api/users/update/:id', Auth, updateInfo);


module.exports = router;
