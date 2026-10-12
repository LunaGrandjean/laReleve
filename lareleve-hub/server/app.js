import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

const {
  MONGODB_URI,
  MONGODB_DB = 'lareleve',
  JWT_SECRET,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME = 'Luna Grandjean',
  CLIENT_ORIGIN = 'http://localhost:8080',
} = process.env;

if (!MONGODB_URI || !JWT_SECRET) {
  throw new Error('Missing MONGODB_URI or JWT_SECRET');
}

export const app = express();
const client = new MongoClient(MONGODB_URI);
let initPromise;

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', CLIENT_ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const db = () => client.db(MONGODB_DB);
const users = () => db().collection('users');
const backups = () => db().collection('backups');

app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ ok: true, service: 'lareleve-api' });
});

function signUser(user) {
  return jwt.sign(
    { id: String(user._id), email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '14d' }
  );
}

function publicUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies.lareleve_token;
    if (!token) return res.status(401).json({ error: 'Non connecte' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin requis' });
  next();
}

async function ensureAdminUser() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existing = await users().findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) return;

  await users().insertOne({
    email: ADMIN_EMAIL.toLowerCase(),
    name: ADMIN_NAME,
    role: 'admin',
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    createdAt: new Date(),
  });
  console.log(`Admin user created: ${ADMIN_EMAIL}`);
}

export async function initApp() {
  if (!initPromise) {
    initPromise = (async () => {
      await client.connect();
      await users().createIndex({ email: 1 }, { unique: true });
      await backups().createIndex({ userId: 1 }, { unique: true });
      await ensureAdminUser();
    })();
  }
  return initPromise;
}

app.post(['/api/auth/login', '/auth/login'], async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await users().findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }

  res.cookie('lareleve_token', signUser(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  });
  res.json({ user: publicUser(user) });
});

app.post(['/api/auth/logout', '/auth/logout'], (_req, res) => {
  res.clearCookie('lareleve_token');
  res.json({ ok: true });
});

app.get(['/api/auth/me', '/auth/me'], requireAuth, async (req, res) => {
  const user = await users().findOne({ _id: new ObjectId(req.user.id) });
  if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });
  res.json({ user: publicUser(user) });
});

app.get(['/api/data', '/data'], requireAuth, async (req, res) => {
  const ownerId = req.user.role === 'admin' && req.query.userId ? String(req.query.userId) : req.user.id;
  const backup = await backups().findOne({ userId: ownerId });
  res.json({ backup: backup?.data || null, updatedAt: backup?.updatedAt || null });
});

app.put(['/api/data', '/data'], requireAuth, async (req, res) => {
  await backups().updateOne(
    { userId: req.user.id },
    { $set: { userId: req.user.id, data: req.body.backup || null, updatedAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true });
});

app.get(['/api/admin/users', '/admin/users'], requireAuth, requireAdmin, async (_req, res) => {
  const rows = await users().find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
  res.json({ users: rows.map(publicUser) });
});

app.post(['/api/admin/users', '/admin/users'], requireAuth, requireAdmin, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const name = String(req.body.name || '').trim();
  const password = String(req.body.password || '');
  const role = 'user';

  if (!email || !name || password.length < 8) {
    return res.status(400).json({ error: 'Nom, email et mot de passe de 8 caracteres minimum requis' });
  }

  const existing = await users().findOne({ email });
  if (existing) return res.status(409).json({ error: 'Cet email existe deja' });

  const result = await users().insertOne({
    email,
    name,
    role,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date(),
  });

  res.status(201).json({ user: { id: String(result.insertedId), email, name, role } });
});

app.post(['/api/admin/users/:id/data', '/admin/users/:id/data'], requireAuth, requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  const exists = await users().findOne({ _id: new ObjectId(userId) });
  if (!exists) return res.status(404).json({ error: 'Utilisateur introuvable' });

  await backups().updateOne(
    { userId },
    { $set: { userId, data: req.body.backup || null, updatedAt: new Date() } },
    { upsert: true }
  );
  res.json({ ok: true });
});

app.delete(['/api/admin/users/:id', '/admin/users/:id'], requireAuth, requireAdmin, async (req, res) => {
  const userId = String(req.params.id);
  if (userId === req.user.id) return res.status(400).json({ error: 'Impossible de supprimer ton propre compte' });
  await users().deleteOne({ _id: new ObjectId(userId) });
  await backups().deleteOne({ userId });
  res.json({ ok: true });
});
