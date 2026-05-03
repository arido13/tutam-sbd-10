# Todo List CRD React + Express + PostgreSQL

Project ini dibuat untuk tugas Praktikum Sistem Basis Data Modul 10.

## Stack

- Frontend: React.js + Vite
- Backend: Express.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT sederhana dengan username dan password

## Struktur Folder

```text
.
├── client
│   ├── index.html
│   ├── package.json
│   └── src
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
└── server
	├── package.json
	├── prisma
	│   └── schema.prisma
	└── src
		├── index.js
		└── prisma.js
```

## Fitur

- Create todo
- Read todo
- Delete todo
- Register akun
- Login akun
- Todo tersimpan per akun

## Environment Variables

### `server/.env`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=isi_dengan_string_rahasia
```

### `client/.env`

```env
VITE_API_URL=http://localhost:3000
```

## Jalan Lokal

1. Masuk ke folder project.
2. Install dependency di `server` dan `client`.
3. Isi `server/.env` dengan connection string PostgreSQL dari Neon.
4. Jalankan migrasi Prisma.
5. Jalankan backend dan frontend.

## Command Utama

### Backend

```powershell
Set-Location 'c:\Users\ACER\Desktop\SBD LAB\SBD Modul 10 - Advanced Frontend\TUTAM modul 10\server'
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend

```powershell
Set-Location 'c:\Users\ACER\Desktop\SBD LAB\SBD Modul 10 - Advanced Frontend\TUTAM modul 10\client'
npm install
npm run dev
```

## Verifikasi CRD

- Create: tambah todo dari form.
- Read: daftar todo muncul setelah reload atau fetch data.
- Delete: tekan tombol hapus pada item todo.

## Verifikasi Akun

- Register akun baru dengan username dan password.
- Login dengan akun yang sama untuk memuat todo milik akun itu.
- Login dengan akun berbeda untuk melihat daftar todo yang berbeda.
- Logout lalu login ulang untuk memastikan data akun tetap tersimpan di database.

## Deploy

- Database: Neon
- Backend: Railway
- Frontend: Vercel

### Railway

1. Buat project baru dari folder `server`.
2. Set environment variables `DATABASE_URL`, `PORT`, dan `CLIENT_ORIGIN`.
3. Gunakan start command `npm start`.

### Vercel

1. Buat project baru dari folder `client`.
2. Set environment variable `VITE_API_URL` ke URL backend Railway.
3. Gunakan build command `npm run build`.
4. Output directory: `dist`.

## Troubleshooting Singkat

- Kalau frontend gagal konek, cek `VITE_API_URL`.
- Kalau backend menolak request, cek `CLIENT_ORIGIN` di Railway.
- Kalau Prisma error, pastikan `DATABASE_URL` dari Neon valid dan migrasi sudah dijalankan.
- Kalau build gagal di Vercel, pastikan project root mengarah ke folder `client`.
