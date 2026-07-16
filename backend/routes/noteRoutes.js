const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  createShareLink,
  revokeShareLink
} = require('../controllers/noteController');

// Protected routes
router.use(protect);

router.route('/').get(getNotes).post(createNote);
router.route('/:id').get(getNoteById).put(updateNote).delete(deleteNote);
router.route('/:id/share').post(createShareLink);
router.route('/:id/share').delete(revokeShareLink); // Adding delete route for revoking share link

module.exports = router;
