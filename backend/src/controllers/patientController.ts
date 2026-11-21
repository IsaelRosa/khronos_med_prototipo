import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const createPatient = async (req: AuthRequest, res: Response) => {
  try {
    const {
      code,
      name,
      cpf,
      birth,
      sex,
      phone,
      whatsapp,
      email,
      address,
      emergencyContact,
      insurance,
      insuranceCard,
      allergies = [],
      medications = [],
      notes,
    } = req.body;

    if (!name || !cpf || !email) {
      return res.status(400).json({ error: 'Nome, CPF e Email são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO patients (
        code, name, cpf, birth, sex, phone, whatsapp, email, 
        address, emergency_contact, insurance, insurance_card,
        allergies, medications, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
      RETURNING *, birth::text AS birth`,
      [
        code,
        name,
        cpf,
        birth,
        sex,
        phone,
        whatsapp,
        email,
        address,
        emergencyContact,
        insurance,
        insuranceCard,
        JSON.stringify(allergies),
        JSON.stringify(medications),
        notes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({ error: 'Erro ao criar paciente' });
  }
};

export const getAllPatients = async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT *, birth::text AS birth FROM patients ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter pacientes:', error);
    res.status(500).json({ error: 'Erro ao obter pacientes' });
  }
};

export const getPatientById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT *, birth::text AS birth FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter paciente:', error);
    res.status(500).json({ error: 'Erro ao obter paciente' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'name',
      'phone',
      'whatsapp',
      'email',
      'address',
      'emergency_contact',
      'insurance',
      'insurance_card',
      'allergies',
      'medications',
      'notes',
    ];

    const fieldsToUpdate = Object.keys(updates).filter((key) => allowedFields.includes(key));

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    const setClause = fieldsToUpdate.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const values = fieldsToUpdate.map((field) => {
      if (['allergies', 'medications'].includes(field)) {
        return JSON.stringify(updates[field]);
      }
      return updates[field];
    });

    const result = await pool.query(
      `UPDATE patients SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({ error: 'Erro ao atualizar paciente' });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { id } = req.params;

    const result = await pool.query('DELETE FROM patients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({ message: 'Paciente deletado' });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    res.status(500).json({ error: 'Erro ao deletar paciente' });
  }
};

export const searchPatients = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Parâmetro de busca obrigatório' });
    }

    const result = await pool.query(
      'SELECT * FROM patients WHERE name ILIKE $1 OR cpf ILIKE $1 OR email ILIKE $1',
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    res.status(500).json({ error: 'Erro ao buscar pacientes' });
  }
};
