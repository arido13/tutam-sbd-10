import { useEffect, useMemo, useState } from 'react';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getStoredAuth() {
  try {
    const raw = localStorage.getItem('todo-auth');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [authMode, setAuthMode] = useState('login');
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [todos, setTodos] = useState([]);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth?.token) {
      loadTodos(auth.token);
    } else {
      setLoading(false);
    }
  }, [auth?.token]);

  const completedCount = useMemo(() => todos.length, [todos]);

  async function fetchJson(path, options = {}, token) {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(payload?.message || 'Permintaan gagal');
    }

    return payload;
  }

  async function loadTodos(token) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchJson('/api/todos', {}, token);
      setTodos(data);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const username = authForm.username.trim().toLowerCase();
    const password = authForm.password;

    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setAuthLoading(true);
    setError('');
    try {
      const payload = await fetchJson(`/api/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const nextAuth = payload;
      localStorage.setItem('todo-auth', JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setAuthForm({ username: '', password: '' });
      setTodos([]);
      setLoading(true);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat login/register');
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('todo-auth');
    setAuth(null);
    setTodos([]);
    setTitle('');
    setError('');
    setLoading(false);
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
      const newTodo = await fetchJson('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle })
      }, auth.token);

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
      await fetchJson(`/api/todos/${id}`, {
        method: 'DELETE'
      }, auth.token);

      setTodos((current) => current.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus data');
    }
  }

  if (!auth?.token) {
    return (
      <main className="page-shell auth-shell">
        <section className="hero-card auth-card">
          <div className="hero-copy">
            <p className="eyebrow">tutam sbd modul 10</p>
            <h1>To Do List</h1>
            <p className="subtext">
             Masukkan informasi login untuk membuat to do list. Register jika belum memiliki akun.
            </p>
          </div>

          <div className="auth-toggle">
            <button type="button" className={authMode === 'login' ? 'tab active' : 'tab'} onClick={() => setAuthMode('login')}>
              Login
            </button>
            <button type="button" className={authMode === 'register' ? 'tab active' : 'tab'} onClick={() => setAuthMode('register')}>
              Register
            </button>
          </div>

          <form className="todo-form auth-form" onSubmit={handleAuthSubmit}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="masukkan username di sini"
              value={authForm.username}
              onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))}
              maxLength={30}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="minimum 6 karakter"
              value={authForm.password}
              onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              maxLength={100}
            />

            {error ? <div className="alert error">{error}</div> : null}

            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Memproses...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <h1>Welcome, {auth.user?.username}!</h1>
          
        </div>

        <div className="session-row">
          <div className="session-badge">@{auth.user?.username}</div>
          <button type="button" className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <form className="todo-form" onSubmit={handleSubmit}>
          <label htmlFor="title">To do baru</label>
          <div className="input-row">
            <input
              id="title"
              type="text"
              placeholder="tuliskan agendamu di sini"
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
          <h2>To do list milikmu</h2>
          <span>{completedCount} item</span>
        </div>

        {error ? <div className="alert error">{error}</div> : null}

        {loading ? (
          <div className="empty-state">Memuat data...</div>
        ) : todos.length === 0 ? (
          <div className="empty-state">Belum ada todo untuk akun ini. Tambahkan item pertama sekarang.</div>
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
