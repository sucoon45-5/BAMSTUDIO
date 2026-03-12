import express from 'express';
import pool from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const PRICING = {
    'Recording Studio': 10000,
    'Video Studio': 15000,
    'Podcast Studio': 8000,
    'Mixing & Mastering': 12000,
    'Voice-over Studio': 7000,
};

// POST /api/bookings — Create a booking (guest or authenticated)
router.post('/', async (req, res) => {
    const { customer_name, customer_email, customer_phone, service, room, date, time, duration, notes } = req.body;
    if (!customer_name || !customer_email || !service || !date || !time || !duration) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    const hourlyRate = PRICING[service] || 10000;
    const price = hourlyRate * duration;
    const user_id = req.user?.id || null;
    try {
        const [result] = await pool.query(
            `INSERT INTO bookings (user_id, customer_name, customer_email, customer_phone, service, room, date, time, duration, price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, customer_name, customer_email, customer_phone, service, room, date, time, duration, price, notes]
        );
        res.status(201).json({ id: result.insertId, price, message: 'Booking created. Proceed to payment.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/bookings/my — Get authenticated user's bookings
router.get('/my', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/bookings/availability — Check time slot availability
router.get('/availability', async (req, res) => {
    const { date, room } = req.query;
    if (!date || !room) return res.status(400).json({ error: 'date and room required.' });
    try {
        const [rows] = await pool.query(
            `SELECT time, duration FROM bookings WHERE date = ? AND room = ? AND status != 'cancelled'`,
            [date, room]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/bookings/:id/cancel — Cancel a booking
router.patch('/:id/cancel', authenticate, async (req, res) => {
    try {
        const [existing] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (existing.length === 0) return res.status(404).json({ error: 'Booking not found.' });
        await pool.query("UPDATE bookings SET status = 'cancelled', payment_status = 'cancelled' WHERE id = ?", [req.params.id]);
        res.json({ message: 'Booking cancelled.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/bookings/:id/reschedule — Reschedule a booking
router.patch('/:id/reschedule', authenticate, async (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) return res.status(400).json({ error: 'New date and time required.' });
    try {
        const [existing] = await pool.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (existing.length === 0) return res.status(404).json({ error: 'Booking not found.' });
        await pool.query('UPDATE bookings SET date = ?, time = ?, status = ? WHERE id = ?', [date, time, 'pending', req.params.id]);
        res.json({ message: 'Booking rescheduled.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
