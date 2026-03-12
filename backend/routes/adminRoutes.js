import express from 'express';
import pool from '../config/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, adminOnly);

// GET /api/admin/bookings — Get all bookings
router.get('/bookings', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/bookings/:id/status — Approve or reject a booking
router.patch('/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }
    try {
        await pool.query('UPDATE bookings SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ message: `Booking ${status}.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/payments — Get all payments
router.get('/payments', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT p.*, b.customer_name, b.service, b.date FROM payments p
       JOIN bookings b ON p.booking_id = b.id ORDER BY p.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/stats — Overview stats for dashboard
router.get('/stats', async (req, res) => {
    try {
        const [[bookingStats]] = await pool.query(
            `SELECT COUNT(*) AS total, 
       SUM(status='approved') AS approved,
       SUM(status='pending') AS pending,
       SUM(status='cancelled') AS cancelled FROM bookings`
        );
        const [[revenueStats]] = await pool.query(
            `SELECT IFNULL(SUM(amount),0) AS total_revenue FROM payments WHERE status='success'`
        );
        res.json({ ...bookingStats, ...revenueStats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/users — List all customers
router.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
