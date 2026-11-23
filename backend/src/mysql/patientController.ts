import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPool, rows, transaction, write, logError, Row } from './database';

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { code, name, cpf, birth, sex, phone, whatsapp, email, address, emergencyContact,
      insurance, insuranceCard, allergies = [], medications = [], notes } = req.body;
    if (!name || !cpf || !email) return res.status(400).json({ error: 'Nome, CPF e Email são obrigatórios' });
    const id = randomUUID();
    const patient = await transaction(async db => {
      await write(db, `INSERT INTO patients
        (id, code, name, cpf, birth, sex, phone, whatsapp, email, address, emergency_contact,
         insurance, insurance_card, allergies, medications, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, name, cpf, birth, sex, phone, whatsapp, email, address, emergencyContact,
        insurance, insuranceCard, JSON.stringify(allergies), JSON.stringify(medications), notes]);
      return (await rows<Row>(db, 'SELECT * FROM patients WHERE id = ?', [id]))[0];
    });
    return res.status(201).json(patient);
  } catch (error) {
    logError('Erro ao criar paciente:', error);
    return res.status(500).json({ error: 'Erro ao criar paciente' });
  }
};

export const getAllPatients = async (_req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), 'SELECT * FROM patients ORDER BY name ASC'));
  } catch (error) {
    logError('Erro ao obter pacientes:', error);
    return res.status(500).json({ error: 'Erro ao obter pacientes' });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response) => {
  try {
    const [patient] = await rows<Row>(getPool(), 'SELECT * FROM patients WHERE id = ?', [req.params.id]);
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
    return res.json(patient);
  } catch (error) {
    logError('Erro ao obter paciente:', error);
    return res.status(500).json({ error: 'Erro ao obter paciente' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = ['name', 'phone', 'whatsapp', 'email', 'address', 'emergency_contact',
      'insurance', 'insurance_card', 'allergies', 'medications', 'notes'];
    const fields = Object.keys(req.body).filter(field => allowed.includes(field));
    if (!fields.length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    const values = fields.map(field => ['allergies', 'medications'].includes(field)
      ? JSON.stringify(req.body[field]) : req.body[field]);
    const patient = await transaction(async db => {
      const result = await write(db,
        `UPDATE patients SET ${fields.map(field => `\`${field}\` = ?`).join(', ')}, updated_at = NOW(6) WHERE id = ?`,
        [...values, req.params.id]);
      return result.affectedRows ? (await rows<Row>(db, 'SELECT * FROM patients WHERE id = ?', [req.params.id]))[0] : null;
    });
    if (!patient) return res.status(404).json({ error: 'Paciente não encontrado' });
    return res.json(patient);
  } catch (error) {
    logError('Erro ao atualizar paciente:', error);
    return res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
    const result = await write(getPool(), 'DELETE FROM patients WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Paciente não encontrado' });
    return res.json({ message: 'Paciente deletado' });
  } catch (error) {
    logError('Erro ao deletar paciente:', error);
    return res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
};

export const searchPatients = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.query.q) return res.status(400).json({ error: 'Parâmetro de busca obrigatório' });
    const value = `%${req.query.q}%`;
    return res.json(await rows<Row>(getPool(),
      'SELECT * FROM patients WHERE name LIKE ? OR cpf LIKE ? OR email LIKE ?', [value, value, value]));
  } catch (error) {
    logError('Erro ao buscar pacientes:', error);
    return res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
};
