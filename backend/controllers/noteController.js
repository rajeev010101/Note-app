const Note = require('../models/Note');
const bcrypt = require('bcryptjs');

const shareConditions = (token) => ({
  shareToken: token,
  revoked: false,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }]
});

const consumeSharedNote = async (token, shareType) => {
  const conditions = shareConditions(token);
  if (shareType === 'one-time') {
    conditions.shareType = 'one-time';
    conditions.viewCount = 0;
  }

  return Note.findOneAndUpdate(conditions, { $inc: { viewCount: 1 } }, { new: true });
};

// Get all notes for logged in user
const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single note by ID
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Get note by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new note
const createNote = async (req, res) => {
  try {
    const title = req.body.title?.trim();
    const content = req.body.content?.trim();
    if (!title || !content) {
      return res.status(400).json({ message: 'A title and content are required.' });
    }
    
    const note = new Note({
      title,
      content,
      userId: req.user.id
    });
    
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update note
const updateNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    if (req.body.title !== undefined) {
      if (!req.body.title.trim()) return res.status(400).json({ message: 'Title cannot be empty.' });
      note.title = req.body.title.trim();
    }
    if (req.body.content !== undefined) {
      if (!req.body.content.trim()) return res.status(400).json({ message: 'Content cannot be empty.' });
      note.content = req.body.content.trim();
    }
    
    await note.save();
    res.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete note
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.json({ message: 'Note removed' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate share link for a note
const createShareLink = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    const { shareType, accessType, expiresIn } = req.body;
    
    // Validate inputs
    if (!shareType || !['one-time', 'time-based'].includes(shareType)) {
      return res.status(400).json({ message: 'Invalid share type' });
    }
    
    if (!accessType || !['public', 'password-protected'].includes(accessType)) {
      return res.status(400).json({ message: 'Invalid access type' });
    }
    
    // Generate share token
    note.shareToken = note.generateShareToken();
    note.shareType = shareType;
    note.accessType = accessType;
    note.revoked = false;
    
    // Set expiration if time-based
    if (shareType === 'time-based') {
      const expiresInMs = parseInt(expiresIn) * 60 * 1000; // Convert minutes to milliseconds
      if (isNaN(expiresInMs) || expiresInMs <= 0) {
        return res.status(400).json({ message: 'Invalid expiration time' });
      }
      note.expiresAt = new Date(Date.now() + expiresInMs);
    } else {
      note.expiresAt = null;
    }
    
    let generatedPassword = null;
    // Generate password if needed
    if (accessType === 'password-protected') {
      generatedPassword = note.generateSharePassword();
      note.sharePassword = await bcrypt.hash(generatedPassword, 12);
    } else {
      note.sharePassword = null;
    }
    
    await note.save();
    
    // Return the share token and password (if applicable)
    res.json({
      shareToken: note.shareToken,
      sharePassword: generatedPassword,
      expiresAt: note.expiresAt
    });
  } catch (error) {
    console.error('Create share link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Revoke/share link
const revokeShareLink = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    note.shareToken = null;
    note.sharePassword = null;
    note.shareType = 'none';
    note.accessType = 'public';
    note.expiresAt = null;
    note.revoked = true;
    
    await note.save();
    
    res.json({ message: 'Share link revoked' });
  } catch (error) {
    console.error('Revoke share link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get note by share token (public access)
const getNoteByShareToken = async (req, res) => {
  try {
    const note = await Note.findOne(shareConditions(req.params.token));
    
    if (!note) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    
    // For password-protected links, we don't return the note yet
    // The frontend will need to submit the password
    if (note.accessType === 'password-protected') {
      return res.json({
        requiresPassword: true,
        noteId: note._id
      });
    }
    
    const sharedNote = await consumeSharedNote(req.params.token, note.shareType);
    if (!sharedNote) return res.status(410).json({ message: 'Link has expired, been revoked, or was already used.' });

    res.json({ note: sharedNote });
  } catch (error) {
    console.error('Get note by share token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify password for share link and get note
const verifySharePassword = async (req, res) => {
  try {
    const note = await Note.findOne(shareConditions(req.params.token)).select('+sharePassword');
    
    if (!note) {
      return res.status(404).json({ message: 'Invalid or expired link' });
    }
    
    // Check if password is required
    if (note.accessType === 'password-protected') {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      if (!note.sharePassword || !(await bcrypt.compare(password, note.sharePassword))) {
        return res.status(401).json({ message: 'Invalid password' });
      }
    }
    
    const sharedNote = await consumeSharedNote(req.params.token, note.shareType);
    if (!sharedNote) return res.status(410).json({ message: 'Link has expired, been revoked, or was already used.' });

    res.json({ note: sharedNote });
  } catch (error) {
    console.error('Verify share password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  createShareLink,
  revokeShareLink,
  getNoteByShareToken,
  verifySharePassword
};
