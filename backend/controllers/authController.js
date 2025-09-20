import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function register(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already exists' });
    const passHash = await bcrypt.hash(password, 10);
    const u = await User.create({ email, passHash, role: 'client' });
    return res.json({ message: 'User created', id: u.id });
  } catch (e) {
    console.error('register error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing email/password' });
    const u = await User.findOne({ where: { email } });
    if (!u) return res.status(401).json({ error: 'Bad credentials' });
    const ok = await bcrypt.compare(password, u.passHash);
    if (!ok) return res.status(401).json({ error: 'Bad credentials' });
    const token = jwt.sign(
      { sub: u.id, email: u.email, role: u.role },
      process.env.JWT_SECRET || 'change_me',
      { expiresIn: process.env.JWT_EXPIRES || '7d' }
    );
    return res.json({ token });
  } catch (e) {
    console.error('login error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req, res) {
  return res.json({ id: req.user?.sub, email: req.user?.email, role: req.user?.role });
}
