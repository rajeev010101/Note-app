const express = require('express');
const { getNoteByShareToken, verifySharePassword } = require('../controllers/noteController');

const router = express.Router();

router.get('/:token', getNoteByShareToken);
router.post('/:token', verifySharePassword);

module.exports = router;
