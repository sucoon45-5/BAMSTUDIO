import express from 'express';
import https from 'https';
import pool from '../config/db.js';

const router = express.Router();

// POST /api/payments/initialize — Initialize Paystack transaction
router.post('/initialize', async (req, res) => {
    const { booking_id, email, amount } = req.body;
    if (!booking_id || !email || !amount) return res.status(400).json({ error: 'booking_id, email, amount required.' });

    const params = JSON.stringify({ email, amount: amount * 100, metadata: { booking_id } }); // amount in kobo

    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
    };

    const paystackReq = https.request(options, (paystackRes) => {
        let data = '';
        paystackRes.on('data', (chunk) => (data += chunk));
        paystackRes.on('end', async () => {
            const parsed = JSON.parse(data);
            if (!parsed.status) return res.status(400).json({ error: 'Failed to initialize payment.' });
            await pool.query(
                'INSERT INTO payments (booking_id, amount, paystack_reference, status) VALUES (?, ?, ?, ?)',
                [booking_id, amount, parsed.data.reference, 'pending']
            );
            res.json({ authorization_url: parsed.data.authorization_url, reference: parsed.data.reference });
        });
    });
    paystackReq.on('error', (e) => res.status(500).json({ error: e.message }));
    paystackReq.write(params);
    paystackReq.end();
});

// GET /api/payments/verify/:reference — Verify payment after redirect
router.get('/verify/:reference', async (req, res) => {
    const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path: `/transaction/verify/${req.params.reference}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    };

    https.get(options, (paystackRes) => {
        let data = '';
        paystackRes.on('data', (chunk) => (data += chunk));
        paystackRes.on('end', async () => {
            const parsed = JSON.parse(data);
            if (parsed.data?.status === 'success') {
                const ref = req.params.reference;
                await pool.query("UPDATE payments SET status = 'success' WHERE paystack_reference = ?", [ref]);
                const [[payment]] = await pool.query('SELECT booking_id FROM payments WHERE paystack_reference = ?', [ref]);
                if (payment) {
                    await pool.query("UPDATE bookings SET payment_status = 'completed', status = 'approved' WHERE id = ?", [payment.booking_id]);
                }
                res.json({ success: true, message: 'Payment verified and booking confirmed.' });
            } else {
                res.json({ success: false, message: 'Payment not successful.' });
            }
        });
    }).on('error', (e) => res.status(500).json({ error: e.message }));
});

export default router;
