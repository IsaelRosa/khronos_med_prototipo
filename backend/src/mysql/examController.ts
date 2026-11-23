import { randomUUID } from 'node:crypto';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getPool, rows, transaction, updateAndFetch, write, logError, Row } from './database';

export const createExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { patient_id, professional_id, soap_note_id, date, exams, priority, observations, unit_id } = req.body;
    const id = randomUUID();
    const exam = await transaction(async db => {
      await write(db, `INSERT INTO exam_orders
        (id, patient_id, professional_id, soap_note_id, date, exams, priority, observations, unit_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'solicitado')`,
      [id, patient_id, professional_id, soap_note_id, date, JSON.stringify(exams), priority || 'normal', observations, unit_id]);
      return (await rows<Row>(db, 'SELECT * FROM exam_orders WHERE id = ?', [id]))[0];
    });
    return res.status(201).json(exam);
  } catch (error) {
    logError('Error creating exam order:', error);
    return res.status(500).json({ message: 'Erro ao criar pedido de exame.' });
  }
};

export const getExamOrdersByPatient = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), 'SELECT * FROM exam_orders WHERE patient_id = ? ORDER BY date DESC', [req.params.patientId]));
  } catch (error) {
    logError('Error fetching exam orders:', error);
    return res.status(500).json({ message: 'Erro ao carregar pedidos de exame.' });
  }
};

export const getExamOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const [exam] = await rows<Row>(getPool(), 'SELECT * FROM exam_orders WHERE id = ?', [req.params.id]);
    if (!exam) return res.status(404).json({ message: 'Exam order not found' });
    return res.json(exam);
  } catch (error) {
    logError('Error fetching exam order:', error);
    return res.status(500).json({ message: 'Erro ao carregar pedido de exame.' });
  }
};

export const updateExamOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, result_data, observations } = req.body;
    const exam = await updateAndFetch('exam_orders',
      'status = COALESCE(?, status), result_data = COALESCE(?, result_data), observations = COALESCE(?, observations)',
      [status, result_data ? JSON.stringify(result_data) : null, observations], req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam order not found' });
    return res.json(exam);
  } catch (error) {
    logError('Error updating exam order:', error);
    return res.status(500).json({ message: 'Erro ao atualizar pedido de exame.' });
  }
};

export const cancelExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await updateAndFetch('exam_orders', "status = 'cancelado'", [], req.params.id);
    if (!exam) return res.status(404).json({ message: 'Exam order not found' });
    return res.json(exam);
  } catch (error) {
    logError('Error canceling exam order:', error);
    return res.status(500).json({ message: 'Erro ao cancelar pedido de exame.' });
  }
};

export const getPendingExamOrders = async (req: AuthRequest, res: Response) => {
  try {
    let sql = "SELECT * FROM exam_orders WHERE status IN ('solicitado', 'em_andamento')";
    const values: unknown[] = [];
    if (req.query.professional_id) { sql += ' AND professional_id = ?'; values.push(req.query.professional_id); }
    return res.json(await rows<Row>(getPool(), `${sql} ORDER BY date ASC`, values));
  } catch (error) {
    logError('Error fetching pending exam orders:', error);
    return res.status(500).json({ message: 'Erro ao carregar pedidos de exame.' });
  }
};

export const getExamOrderBySoapNote = async (req: AuthRequest, res: Response) => {
  try {
    return res.json(await rows<Row>(getPool(), 'SELECT * FROM exam_orders WHERE soap_note_id = ? ORDER BY date DESC', [req.params.soapNoteId]));
  } catch (error) {
    logError('Error fetching exam orders:', error);
    return res.status(500).json({ message: 'Erro ao carregar pedidos de exame.' });
  }
};

export const getExamOrdersByUnit = async (req: AuthRequest, res: Response) => {
  try {
    let sql = 'SELECT * FROM exam_orders WHERE unit_id = ?';
    const values: unknown[] = [req.params.unitId];
    if (req.query.status) { sql += ' AND status = ?'; values.push(req.query.status); }
    return res.json(await rows<Row>(getPool(), `${sql} ORDER BY date ASC`, values));
  } catch (error) {
    logError('Error fetching exam orders:', error);
    return res.status(500).json({ message: 'Erro ao carregar pedidos de exame.' });
  }
};

export const deleteExamOrder = async (req: AuthRequest, res: Response) => {
  try {
    const result = await write(getPool(), 'DELETE FROM exam_orders WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Exam order not found' });
    return res.json({ message: 'Exam order deleted successfully' });
  } catch (error) {
    logError('Error deleting exam order:', error);
    return res.status(500).json({ message: 'Erro ao excluir pedido de exame.' });
  }
};
