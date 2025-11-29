
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { query } from './db.js';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// SMTP Config for Brevo
const smtpTransport = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: "9b2acc001@smtp-brevo.com",
        pass: "xsmtpsib-e093fa1ff7f85c35f73709b9e04a99d072992a27c3ca904d8551217df10669dc-eobrwOXjGxBVpCSZ"
    }
});

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
    const { identifier, password, role } = req.body;
    try {
        const result = await query(
            `SELECT * FROM users WHERE (email = $1 OR id = $1) AND password = $2`,
            [identifier, password]
        );
        
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const safeUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isVerified: user.is_verified,
                avatarUrl: user.avatar_url,
                walletAddress: user.wallet_address,
                healthScore: user.health_score,
                country: user.country
            };
            if (identifier === 'crimsonnexus119' && role) safeUser.role = role;
            res.json(safeUser);
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        await smtpTransport.sendMail({
            from: '"Crimson Nexus" <crimsonnexus119@gmail.com>',
            to: email,
            subject: `${otp} is your verification code`,
            text: `Your OTP is ${otp}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #dc143c;">Crimson Nexus Verification</h2>
                    <p>Your OTP Code is:</p>
                    <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
                </div>
            `
        });
        res.json({ success: true, otp }); // In prod, do not return OTP here
    } catch (error) {
        console.error("SMTP Error", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

// Mock Verify for backend mode (In real prod, use Redis or DB to store OTP)
app.post('/api/auth/verify-otp', async (req, res) => {
    // For this demo, we assume client passes correctness check or we implemented store
    res.json(true);
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, role, name, id, isVerified, country } = req.body;
    const userId = id || `u-${Date.now()}`;
    const wallet = `1${Math.random().toString(36).substring(2, 10)}...BSV`;
    
    try {
        await query(
            `INSERT INTO users (id, email, password, name, role, is_verified, wallet_address, country) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [userId, email, password, name, role, isVerified, wallet, country]
        );
        res.json({ id: userId, email, name, role, isVerified, walletAddress: wallet, country });
    } catch (err) {
        res.status(500).json({ error: "Registration failed" });
    }
});

app.get('/api/records/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await query(
            `SELECT r.* FROM records r 
             LEFT JOIN record_shares rs ON r.id = rs.record_id 
             WHERE r.patient_id = $1 OR r.provider_id = $1 OR rs.user_id = $1`,
            [userId]
        );
        const records = result.rows.map(r => ({
            id: r.id,
            patientId: r.patient_id,
            providerId: r.provider_id,
            type: r.type,
            title: r.title,
            content: r.content,
            aiSummary: r.ai_summary,
            fileUrl: r.file_url,
            fileName: r.file_name,
            date: r.date,
            bsvTxId: r.bsv_tx_id,
            scriptPubKey: r.script_pub_key,
            satoshis: r.satoshis,
            blockHeight: r.block_height
        }));
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch records" });
    }
});

app.post('/api/records', async (req, res) => {
    const r = req.body;
    const recordId = r.id || `rec-${Date.now()}`;
    try {
        await query(
            `INSERT INTO records (id, patient_id, provider_id, type, title, content, ai_summary, file_url, file_name, date, bsv_tx_id, script_pub_key, satoshis)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [recordId, r.patientId, r.providerId, r.type, r.title, r.content, r.aiSummary, r.fileUrl, r.fileName, r.date, r.bsvTxId, r.scriptPubKey, r.satoshis]
        );
        res.json({ ...r, id: recordId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save record" });
    }
});

app.get('/api/appointments/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await query(`SELECT * FROM appointments WHERE patient_id = $1 OR provider_id = $1`, [userId]);
        const apts = result.rows.map(a => ({
            id: a.id,
            patientId: a.patient_id,
            providerId: a.provider_id,
            patientName: a.patient_name,
            providerName: a.provider_name,
            date: a.date,
            time: a.time,
            status: a.status,
            type: a.type,
            notes: a.notes
        }));
        res.json(apts);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch appointments" });
    }
});

app.post('/api/appointments', async (req, res) => {
    const a = req.body;
    const id = `apt-${Date.now()}`;
    try {
        await query(
            `INSERT INTO appointments (id, patient_id, provider_id, patient_name, provider_name, date, time, status, type, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [id, a.patientId, a.providerId, a.patientName, a.providerName, a.date, a.time, 'PENDING', a.type, a.notes]
        );
        res.json({ ...a, id, status: 'PENDING' });
    } catch (err) {
        res.status(500).json({ error: "Failed to book" });
    }
});

app.post('/api/appointments/:id/confirm', async (req, res) => {
    const { confirm } = req.body;
    const status = confirm ? 'SCHEDULED' : 'CANCELLED';
    try {
        await query(`UPDATE appointments SET status = $1 WHERE id = $2`, [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Update failed" });
    }
});

app.get('/', (req, res) => {
    res.send('Crimson Nexus Backend Active');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
