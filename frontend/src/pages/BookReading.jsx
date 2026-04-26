import React, { useState, useEffect } from 'react';
import {
  getBooks, addBook, updateBook, deleteBook,
  getBookNotes, addBookNote, updateBookNote, deleteBookNote,
} from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './BookReading.css';

const NOTE_TYPES = ['note', 'photo', 'diagram', 'code'];
const NOTE_TYPE_ICONS = { note: '📝', photo: '📷', diagram: '📊', code: '💻' };
const NOTE_TYPE_LABELS = { note: 'Note', photo: 'Photo', diagram: 'Diagram', code: 'Code' };

const PRESET_BOOKS = [
  { title: 'Book One', author: 'Author A', totalPages: 456, color: '#3b82f6' },
  { title: 'Book Two', author: 'Author B', totalPages: 462, color: '#10b981' },
  { title: 'Book Three', author: 'Author C', totalPages: 573, color: '#8b5cf6' },
];

const EMPTY_NOTE_FORM = {
  pageNumber: '',
  noteType: 'note',
  title: '',
  content: '',
};

export default function BookReading() {
  const { refreshUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [bookForm, setBookForm] = useState({ title: '', author: '', totalPages: '', currentPage: '', status: 'Reading', color: '#3b82f6' });
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [noteFilter, setNoteFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadBooks(); }, []);

  useEffect(() => {
    if (selectedBook) {
      loadNotes(selectedBook._id);
    } else {
      setNotes([]);
    }
  }, [selectedBook]);

  const loadBooks = async () => {
    setLoading(true);
    try {
      const res = await getBooks();
      setBooks(res.data.books);
      // Auto-select first book if none selected
      if (res.data.books.length > 0 && !selectedBook) {
        setSelectedBook(res.data.books[0]);
      }
    } catch (e) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (bookId) => {
    setNotesLoading(true);
    try {
      const res = await getBookNotes(bookId);
      setNotes(res.data.notes);
    } catch (e) {
      toast.error('Failed to load notes');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleAddPresetBooks = async () => {
    setSubmitting(true);
    try {
      for (const book of PRESET_BOOKS) {
        await addBook(book);
      }
      await refreshUser();
      toast.success('3 preset books added!');
      loadBooks();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding books');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await addBook({
        ...bookForm,
        totalPages: Number(bookForm.totalPages),
        currentPage: Number(bookForm.currentPage),
      });
      await refreshUser();
      toast.success(`Book added! +${res.data.xpEarned} XP 📚`);
      setShowBookModal(false);
      setBookForm({ title: '', author: '', totalPages: '', currentPage: '', status: 'Reading', color: '#3b82f6' });
      loadBooks();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding book');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (bookId, newPage) => {
    try {
      const book = books.find(b => b._id === bookId);
      if (!book) return;
      const page = Math.max(0, Math.min(Number(newPage), book.totalPages));
      let status = book.status;
      if (page >= book.totalPages) status = 'Completed';
      else if (page > 0) status = 'Reading';
      else status = 'Not Started';

      await updateBook(bookId, { currentPage: page, status });
      setBooks(books.map(b => b._id === bookId ? { ...b, currentPage: page, status } : b));
      if (selectedBook?._id === bookId) {
        setSelectedBook({ ...selectedBook, currentPage: page, status });
      }
      toast.success('Progress updated');
    } catch (e) {
      toast.error('Failed to update progress');
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Delete this book and all its notes?')) return;
    try {
      await deleteBook(id);
      toast.success('Book deleted');
      if (selectedBook?._id === id) setSelectedBook(null);
      loadBooks();
    } catch (e) {
      toast.error('Failed to delete book');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!selectedBook) return;
    setSubmitting(true);
    try {
      const res = await addBookNote(selectedBook._id, {
        ...noteForm,
        pageNumber: Number(noteForm.pageNumber),
      });
      await refreshUser();
      toast.success(`Note added! +${res.data.xpEarned} XP 📝`);
      setShowNoteModal(false);
      setNoteForm(EMPTY_NOTE_FORM);
      setEditingNote(null);
      loadNotes(selectedBook._id);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error adding note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!selectedBook || !editingNote) return;
    setSubmitting(true);
    try {
      await updateBookNote(selectedBook._id, editingNote._id, {
        ...noteForm,
        pageNumber: Number(noteForm.pageNumber),
      });
      toast.success('Note updated');
      setShowNoteModal(false);
      setNoteForm(EMPTY_NOTE_FORM);
      setEditingNote(null);
      loadNotes(selectedBook._id);
    } catch (e) {
      toast.error('Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await deleteBookNote(selectedBook._id, noteId);
      toast.success('Note deleted');
      loadNotes(selectedBook._id);
    } catch (e) {
      toast.error('Failed to delete note');
    }
  };

  const openEditNote = (note) => {
    setEditingNote(note);
    setNoteForm({
      pageNumber: note.pageNumber,
      noteType: note.noteType,
      title: note.title,
      content: note.content,
    });
    setShowNoteModal(true);
  };

  const openAddNote = () => {
    setEditingNote(null);
    setNoteForm({ ...EMPTY_NOTE_FORM, pageNumber: selectedBook?.currentPage || '' });
    setShowNoteModal(true);
  };

  const filteredNotes = noteFilter === 'all'
    ? notes
    : notes.filter(n => n.noteType === noteFilter);

  const totalPagesRead = books.reduce((sum, b) => sum + (b.currentPage || 0), 0);
  const totalPagesAll = books.reduce((sum, b) => sum + (b.totalPages || 0), 0);

  return (
    <div>
      <div className="page-header flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>📚 Book Reading</h1>
          <p>Track your reading progress and capture notes, photos, diagrams & code snippets</p>
        </div>
        <div className="flex gap-2">
          {books.length === 0 && (
            <button className="btn btn-success" onClick={handleAddPresetBooks} disabled={submitting}>
              {submitting ? 'Adding...' : '➕ Add 3 Preset Books'}
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>+ Add Book</button>
        </div>
      </div>

      {/* Stats */}
      {books.length > 0 && (
        <div className="grid-4 mb-3">
          <StatMini label="Books" value={books.length} icon="📚" />
          <StatMini label="Pages Read" value={totalPagesRead} icon="📖" />
          <StatMini label="Total Pages" value={totalPagesAll} icon="📄" />
          <StatMini label="Notes" value={notes.length} icon="📝" />
        </div>
      )}

      <div className="book-reading-layout">
        {/* Books sidebar */}
        <div className="books-sidebar">
          <h3 className="books-sidebar-title">Your Books</h3>
          {loading ? <div className="spinner" /> : (
            <div className="books-list">
              {books.map(book => (
                <div
                  key={book._id}
                  className={`book-item ${selectedBook?._id === book._id ? 'active' : ''}`}
                  onClick={() => setSelectedBook(book)}
                >
                  <div className="book-item-color" style={{ background: book.color }} />
                  <div className="book-item-info">
                    <div className="book-item-title">{book.title}</div>
                    <div className="book-item-meta">{book.author} • {book.totalPages} pages</div>
                    <div className="book-item-progress">
                      <div className="progress-bar-container" style={{ height: '6px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${book.totalPages ? (book.currentPage / book.totalPages) * 100 : 0}%`,
                            background: book.color,
                          }}
                        />
                      </div>
                      <span className="book-item-progress-text">
                        {book.currentPage}/{book.totalPages} ({book.totalPages ? Math.round((book.currentPage / book.totalPages) * 100) : 0}%)
                      </span>
                    </div>
                    <span className={`tag ${book.status === 'Completed' ? 'tag-green' : book.status === 'Reading' ? 'tag-blue' : 'tag-orange'}`}>
                      {book.status}
                    </span>
                  </div>
                  <button
                    className="book-item-delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteBook(book._id); }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {books.length === 0 && (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-icon">📚</div>
                  <p>No books yet. Add preset books or create your own!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="book-main-content">
          {selectedBook ? (
            <>
              {/* Book header */}
              <div className="card mb-2">
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="flex gap-2 align-items-center">
                    <div
                      className="book-avatar"
                      style={{ background: selectedBook.color }}
                    >
                      {selectedBook.title.charAt(0)}
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{selectedBook.title}</h2>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {selectedBook.author} • {selectedBook.totalPages} pages
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 align-items-center">
                    <span className={`tag ${selectedBook.status === 'Completed' ? 'tag-green' : selectedBook.status === 'Reading' ? 'tag-blue' : 'tag-orange'}`}>
                      {selectedBook.status}
                    </span>
                  </div>
                </div>

                {/* Progress control */}
                <div className="mt-2">
                  <div className="flex-between mb-1">
                    <span className="text-sm text-muted">Reading Progress</span>
                    <span className="text-sm font-mono">
                      {selectedBook.currentPage} / {selectedBook.totalPages} pages
                    </span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${selectedBook.totalPages ? (selectedBook.currentPage / selectedBook.totalPages) * 100 : 0}%`,
                        background: selectedBook.color,
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2 align-items-center">
                    <label className="text-sm text-muted">Update page:</label>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: '100px' }}
                      min={0}
                      max={selectedBook.totalPages}
                      value={selectedBook.currentPage}
                      onChange={(e) => handleUpdateProgress(selectedBook._id, e.target.value)}
                    />
                    <input
                      type="range"
                      className="page-slider"
                      min={0}
                      max={selectedBook.totalPages}
                      value={selectedBook.currentPage}
                      onChange={(e) => handleUpdateProgress(selectedBook._id, e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes section */}
              <div className="card">
                <div className="flex-between mb-2" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0 }}>📝 Notes & Insights</h3>
                  <div className="flex gap-2">
                    <select
                      className="form-select"
                      style={{ width: 'auto' }}
                      value={noteFilter}
                      onChange={(e) => setNoteFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      {NOTE_TYPES.map(t => (
                        <option key={t} value={t}>{NOTE_TYPE_ICONS[t]} {NOTE_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={openAddNote}>+ Add Note</button>
                  </div>
                </div>

                {notesLoading ? <div className="spinner" /> : (
                  <div className="notes-grid">
                    {filteredNotes.map(note => (
                      <div key={note._id} className={`note-card note-type-${note.noteType}`}>
                        <div className="note-card-header">
                          <div className="flex gap-1 align-items-center">
                            <span className="note-type-icon">{NOTE_TYPE_ICONS[note.noteType]}</span>
                            <span className="note-title">{note.title}</span>
                          </div>
                          <div className="flex gap-1">
                            <span className="tag tag-cyan">Page {note.pageNumber}</span>
                            <button className="note-action-btn" onClick={() => openEditNote(note)}>✏️</button>
                            <button className="note-action-btn" onClick={() => handleDeleteNote(note._id)}>🗑️</button>
                          </div>
                        </div>
                        <div className="note-card-body">
                          {note.noteType === 'photo' || note.noteType === 'diagram' ? (
                            <img
                              src={note.content}
                              alt={note.title}
                              className="note-image"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : note.noteType === 'code' ? (
                            <pre className="note-code"><code>{note.content}</code></pre>
                          ) : (
                            <p className="note-text">{note.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredNotes.length === 0 && (
                      <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                        <div className="empty-icon">📝</div>
                        <h3>No notes yet</h3>
                        <p>Click "Add Note" to capture your learnings</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state card" style={{ padding: '4rem 2rem' }}>
              <div className="empty-icon">📚</div>
              <h3>Select a book to view details</h3>
              <p>Choose a book from the sidebar or add a new one to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowBookModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">📚 Add New Book</span>
              <button className="modal-close" onClick={() => setShowBookModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddBook}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Clean Code" value={bookForm.title}
                  onChange={e => setBookForm({ ...bookForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Author</label>
                <input className="form-input" placeholder="e.g. Robert C. Martin" value={bookForm.author}
                  onChange={e => setBookForm({ ...bookForm, author: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Pages *</label>
                  <input className="form-input" type="number" min={1} placeholder="300" value={bookForm.totalPages}
                    onChange={e => setBookForm({ ...bookForm, totalPages: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Page</label>
                  <input className="form-input" type="number" min={0} placeholder="0" value={bookForm.currentPage}
                    onChange={e => setBookForm({ ...bookForm, currentPage: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={bookForm.status}
                    onChange={e => setBookForm({ ...bookForm, status: e.target.value })}>
                    <option>Not Started</option>
                    <option>Reading</option>
                    <option>Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div className="color-picker">
                    {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`color-swatch ${bookForm.color === c ? 'active' : ''}`}
                        style={{ background: c }}
                        onClick={() => setBookForm({ ...bookForm, color: c })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : '💾 Save Book'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowBookModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showNoteModal && selectedBook && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title">
                {editingNote ? '✏️ Edit Note' : '📝 Add Note'} — {selectedBook.title}
              </span>
              <button className="modal-close" onClick={() => { setShowNoteModal(false); setEditingNote(null); setNoteForm(EMPTY_NOTE_FORM); }}>×</button>
            </div>
            <form onSubmit={editingNote ? handleUpdateNote : handleAddNote}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Page Number</label>
                  <input className="form-input" type="number" min={0} max={selectedBook.totalPages}
                    value={noteForm.pageNumber}
                    onChange={e => setNoteForm({ ...noteForm, pageNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Note Type</label>
                  <div className="note-type-selector">
                    {NOTE_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        className={`note-type-btn ${noteForm.noteType === t ? 'active' : ''}`}
                        onClick={() => setNoteForm({ ...noteForm, noteType: t })}
                      >
                        <span>{NOTE_TYPE_ICONS[t]}</span>
                        <span>{NOTE_TYPE_LABELS[t]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="e.g. Key Insight on Chapter 3" value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {noteForm.noteType === 'photo' || noteForm.noteType === 'diagram'
                    ? 'Image URL *'
                    : noteForm.noteType === 'code'
                      ? 'Code Snippet *'
                      : 'Note Content *'}
                </label>
                {noteForm.noteType === 'code' ? (
                  <textarea
                    className="form-textarea code-textarea"
                    placeholder="Paste your code here..."
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    required
                    rows={10}
                  />
                ) : (
                  <textarea
                    className="form-textarea"
                    placeholder={
                      noteForm.noteType === 'photo' || noteForm.noteType === 'diagram'
                        ? 'Paste image URL here...'
                        : 'Write your notes here...'
                    }
                    value={noteForm.content}
                    onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                    required
                    rows={6}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingNote ? '💾 Update Note' : '💾 Save Note'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowNoteModal(false); setEditingNote(null); setNoteForm(EMPTY_NOTE_FORM); }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatMini({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

