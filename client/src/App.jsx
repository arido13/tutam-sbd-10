import { useEffect, useMemo, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const completedCount = useMemo(() => todos.length, [todos]);

  async function loadTodos() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/todos`);
      if (!response.ok) {
        throw new Error('Gagal mengambil data todo');
      }
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Judul todo tidak boleh kosong');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Gagal membuat todo');
      }

      const newTodo = await response.json();
      setTodos((current) => [newTodo, ...current]);
      setTitle('');
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus todo');
      }

      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus data');
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">SBD Modul 10</p>
          <h1>Todo List sederhana dengan React, Express, dan PostgreSQL</h1>
          <p className="subtext">
            Aplikasi ini mendukung Create, Read, dan Delete dengan backend API dan database Neon.
          </p>
        </div>

        <form className="todo-form" onSubmit={handleSubmit}>
          <label htmlFor="title">Todo baru</label>
          <div className="input-row">
            <input
              id="title"
              type="text"
              placeholder="Contoh: Belajar sistem basis data"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
            <button type="submit" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Tambah'}
            </button>
          </div>
        </form>
      </section>

      <section className="list-card">
        <div className="list-header">
          <h2>Daftar Todo</h2>
          <span>{completedCount} item</span>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {loading ? (
          <div className="empty-state">Memuat data...</div>
        ) : todos.length === 0 ? (
          <div className="empty-state">Belum ada todo. Tambahkan item pertama sekarang.</div>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className="todo-item">
                <div>
                  <p className="todo-title">{todo.title}</p>
                  <span className="todo-meta">{new Date(todo.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <button className="danger" type="button" onClick={() => handleDelete(todo.id)}>
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
