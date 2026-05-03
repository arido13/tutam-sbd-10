import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from './prisma.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(
  cors({
    origin: clientOrigin
  })
);
app.use(express.json());

function createToken(user) {
  return jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Sesi login tidak valid' });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Todo API',
    health: '/health',
    auth: ['/api/auth/register', '/api/auth/login'],
    todos: '/api/todos'
  });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(3, 'Username minimal 3 karakter').max(30, 'Username maksimal 30 karakter'),
      password: z.string().min(6, 'Password minimal 6 karakter').max(100, 'Password terlalu panjang')
    });

    const payload = schema.parse(req.body);
    const normalizedUsername = payload.username.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername }
    });

    if (existingUser) {
      return res.status(409).json({ message: 'Username sudah dipakai' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash
      }
    });

    return res.status(201).json({
      token: createToken(user),
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || 'Validasi gagal' });
    }
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const schema = z.object({
      username: z.string().trim().min(1, 'Username wajib diisi'),
      password: z.string().min(1, 'Password wajib diisi')
    });

    const payload = schema.parse(req.body);
    const username = payload.username.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    return res.json({
      token: createToken(user),
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || 'Validasi gagal' });
    }
    next(error);
  }
});

app.get('/api/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.get('/api/todos', authenticateToken, async (req, res, next) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

app.post('/api/todos', authenticateToken, async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(1, 'Judul todo wajib diisi').max(120, 'Judul maksimal 120 karakter')
    });

    const payload = schema.parse(req.body);
    const todo = await prisma.todo.create({
      data: {
        title: payload.title,
        userId: req.user.userId
      }
    });

    res.status(201).json(todo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0]?.message || 'Validasi gagal' });
    }
    next(error);
  }
});

app.delete('/api/todos/:id', authenticateToken, async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID todo tidak valid' });
    }

    const todo = await prisma.todo.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!todo) {
      return res.status(404).json({ message: 'Todo tidak ditemukan' });
    }

    await prisma.todo.delete({ where: { id: todo.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.name === 'PrismaClientValidationError') {
    return res.status(400).json({ message: 'Permintaan tidak valid' });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'Todo tidak ditemukan' });
  }

  console.error(error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
