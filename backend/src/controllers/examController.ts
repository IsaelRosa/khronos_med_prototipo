import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Create exam order
export const createExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, professional_id, soap_note_id, date, exams, priority, observations, unit_id } = req.body;

    const result = await pool.query(
      `INSERT INTO exam_orders (patient_id, professional_id, soap_note_id, date, exams, priority, observations, unit_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'solicitado')
       RETURNING *`,
      [patient_id, professional_id, soap_note_id, date, JSON.stringify(exams), priority || 'normal', observations, unit_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating exam order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get exam orders by patient
export const getExamOrdersByPatient = async (req: AuthRequest, res: Response) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      `SELECT * FROM exam_orders WHERE patient_id = $1 ORDER BY date DESC`,
      [patientId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching exam orders:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get exam order by ID
export const getExamOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM exam_orders WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam order not found' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching exam order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update exam order status
export const updateExamOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, result_data, observations } = req.body;

    const result = await pool.query(
      `UPDATE exam_orders SET status = COALESCE($1, status), result_data = COALESCE($2::jsonb, result_data), observations = COALESCE($3, observations), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *`,
      [status, result_data ? JSON.stringify(result_data) : null, observations, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam order not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating exam order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Cancel exam order
export const cancelExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE exam_orders SET status = 'cancelado', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam order not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error canceling exam order:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get pending exam orders
export const getPendingExamOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { professional_id } = req.query;
    
    let query = `SELECT * FROM exam_orders WHERE status IN ('solicitado', 'em_andamento')`;
    const params: any[] = [];
    
    if (professional_id) {
      query += ` AND professional_id = $1`;
      params.push(professional_id);
    }
    
    query += ` ORDER BY date ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching pending exam orders:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get exam orders by SOAP note
export const getExamOrderBySoapNote = async (req: AuthRequest, res: Response) => {
  try {
    const { soapNoteId } = req.params;
    const result = await pool.query(
      `SELECT * FROM exam_orders WHERE soap_note_id = $1 ORDER BY date DESC`,
      [soapNoteId]
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching exam orders:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get exam orders by unit
export const getExamOrdersByUnit = async (req: AuthRequest, res: Response) => {
  try {
    const { unitId } = req.params;
    const { status } = req.query;
    
    let query = `SELECT * FROM exam_orders WHERE unit_id = $1`;
    const params: any[] = [unitId];
    
    if (status) {
      query += ` AND status = $2`;
      params.push(status);
    }
    
    query += ` ORDER BY date ASC`;
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching exam orders:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete exam order (admin only)
export const deleteExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`DELETE FROM exam_orders WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Exam order not found' });
    }

    res.json({ message: 'Exam order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting exam order:', error);
    res.status(400).json({ message: error.message });
  }
};
