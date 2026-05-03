import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { prisma } from './prisma.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(
  cors({
    origin: clientOrigin
  })
);
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/todos', async (_req, res, next) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    next(error);
  }
});

app.post('/api/todos', async (req, res, next) => {
  try {
    const schema = z.object({
      title: z.string().trim().min(1, 'Judul todo wajib diisi').max(120, 'Judul maksimal 120 karakter')
    });

    const payload = schema.parse(req.body);
    const todo = await prisma.todo.create({
      data: {
        title: payload.title
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

app.delete('/api/todos/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ message: 'ID todo tidak valid' });
    }

    await prisma.todo.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error.code === 'P2025') {
    return res.status(404).json({ message: 'Todo tidak ditemukan' });
  }

  console.error(error);
  res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
