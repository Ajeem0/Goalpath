const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ReadingBook = require('../models/ReadingBook');
const BookNote = require('../models/BookNote');
const User = require('../models/User');

const XP_PER_BOOK_ADDED = 15;
const XP_PER_NOTE_ADDED = 5;
const XP_PER_PAGE_READ = 1; // per 10 pages

// @route   GET /api/books
router.get('/', protect, async (req, res) => {
  try {
    const books = await ReadingBook.find({ user: req.user._id }, { orderBy: 'created_at ASC' });
    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/books
router.post('/', protect, async (req, res) => {
  try {
    const { title, author, totalPages, currentPage, status, color } = req.body;

    if (!title || !totalPages) {
      return res.status(400).json({ message: 'Title and total pages are required' });
    }

    const book = await ReadingBook.create({
      user: req.user._id,
      title,
      author: author || '',
      totalPages: Number(totalPages) || 0,
      currentPage: Number(currentPage) || 0,
      status: status || 'Reading',
      color: color || '#3b82f6',
    });

    // Update user XP
    const user = await User.findById(req.user._id);
    user.xp += XP_PER_BOOK_ADDED;
    await user.save();

    res.status(201).json({ book, xpEarned: XP_PER_BOOK_ADDED });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/books/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const book = await ReadingBook.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/books/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const book = await ReadingBook.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    // Also delete all notes for this book
    const notes = await BookNote.find({ bookId: req.params.id });
    for (const note of notes) {
      await BookNote.findOneAndDelete({ _id: note._id });
    }
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/books/:id/notes
router.get('/:id/notes', protect, async (req, res) => {
  try {
    const book = await ReadingBook.findOne({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const notes = await BookNote.find(
      { bookId: req.params.id, user: req.user._id },
      { orderBy: 'page_number ASC, created_at DESC' }
    );
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/books/:id/notes
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const book = await ReadingBook.findOne({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const { pageNumber, noteType, title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const note = await BookNote.create({
      bookId: req.params.id,
      user: req.user._id,
      pageNumber: Number(pageNumber) || 0,
      noteType: noteType || 'note',
      title,
      content,
    });

    // Update user XP
    const user = await User.findById(req.user._id);
    user.xp += XP_PER_NOTE_ADDED;
    await user.save();

    res.status(201).json({ note, xpEarned: XP_PER_NOTE_ADDED });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   PUT /api/books/:id/notes/:noteId
router.put('/:id/notes/:noteId', protect, async (req, res) => {
  try {
    const note = await BookNote.findOneAndUpdate(
      { _id: req.params.noteId, bookId: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   DELETE /api/books/:id/notes/:noteId
router.delete('/:id/notes/:noteId', protect, async (req, res) => {
  try {
    const note = await BookNote.findOneAndDelete({
      _id: req.params.noteId,
      bookId: req.params.id,
      user: req.user._id,
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

