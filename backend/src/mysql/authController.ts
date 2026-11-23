import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { generateToken, hashPassword, comparePassword } from '../utils/jwt';
import { getPool, rows, write, logError, Row } from './database';

interface UserRow extends Row {
  id: string;
  email: string;
  name: string;
  role: string;
  password: string;
}

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role = 'recepcao' } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }
    const db = getPool();
    const existing = await rows<UserRow>(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ error: 'Email já cadastrado' });
    const id = randomUUID();
    await write(db, 'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, await hashPassword(password), name, role]);
    const user = { id, email, name, role };
    return res.status(201).json({ message: 'Usuário registrado com sucesso', user, token: generateToken(id, email, name, role) });
  } catch (error) {
    logError('Erro ao registrar:', error);
    return res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    const [user] = await rows<UserRow>(getPool(), 'SELECT id, email, password, name, role FROM users WHERE email = ?', [email]);
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const { id, name, role } = user;
    return res.json({
      message: 'Login realizado com sucesso',
      user: { id, email: user.email, name, role },
      token: generateToken(id, user.email, name, role),
    });
  } catch (error) {
    logError('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado' });
    const [user] = await rows<UserRow>(getPool(), 'SELECT id, email, name, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json(user);
  } catch (error) {
    logError('Erro ao obter perfil:', error);
    return res.status(500).json({ error: 'Erro ao obter perfil' });
  }
};
