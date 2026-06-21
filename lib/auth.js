import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const SECRET = process.env.JWT_SECRET || 'dev-secret';
export const hashPassword = (p) => bcrypt.hashSync(p, 10);
export const verifyPassword = (p, h) => bcrypt.compareSync(p, h);
export const signToken = (payload) => jwt.sign(payload, SECRET, { expiresIn: '1d' });
export function getUser(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
