const express = require('express');
const { Auth } = require('../middleware/user');
const router = express.Router();
const { accessChats, fetchAllChats, createGroup, renameGroup, addToGroup, removeFromGroup } = require('../controllers/chatControllers');


router.post('/', Auth, accessChats);
router.post('/', Auth, fetchAllChats);
router.post('/group', Auth, createGroup);
router.post('/group/rename', Auth, renameGroup);
router.post('/groupAdd', Auth, addToGroup);
router.post('/groupRemove', Auth, removeFromGroup);
router.post('/removeuser', Auth);


module.exports = router;
