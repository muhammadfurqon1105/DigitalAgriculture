const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. KONEKSI KE CLOUD DATABASE AIVEN
const db = mysql.createConnection({ 
    host: 'digital-agri-db-muhammadfurqon1105-823d.d.aivencloud.com',
    port: 19687,
    user: 'avnadmin',
    password: 'AVNS_L86Qr4SE7eiA4nqefty',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
    if (err) return console.error('❌ Koneksi database gagal:', err);
    console.log('✅ BERHASIL! Node.js tersambung ke MySQL Aiven Cloud!');
});

// --- API LOGIN & REGISTER ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (results && results.length > 0) res.json({ success: true, user: results[0] });
        else res.json({ success: false, msg: 'Username atau Password salah!' });
    });
});

// --- API PRODUK ---
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, r) => res.json(r || []));
});

// --- API ORDERS (DENGAN PENGURANGAN STOK OTOMATIS) ---
app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY id DESC', (err, r) => res.json(r || []));
});

app.post('/api/orders', (req, res) => {
    const o = req.body;
    // Logika Stok Real-time: Kurangi stok sebelum simpan order
    db.query('UPDATE products SET stok = stok - ? WHERE id = ?', [o.qty, o.id_produk], (err) => {
        if(err) return res.status(500).json(err);
        db.query('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)', 
        [o.id, o.pembeli, o.produk, o.alamat, o.qty, o.total, o.status, o.tanggal], (err) => {
            if(err) return res.status(500).json(err);
            res.json({ success: true });
        });
    });
});

// --- API BARU: UPDATE STATUS (Untuk Tombol Terima & Proses) ---
app.put('/api/orders/:id', (req, res) => {
    const { status } = req.body;
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ success: true, msg: 'Status diperbarui' });
    });
});

// --- API BARU: HAPUS PESANAN (Untuk Tombol Hapus Order) ---
app.delete('/api/orders/:id', (req, res) => {
    db.query('DELETE FROM orders WHERE id = ?', [req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({ success: true, msg: 'Pesanan dihapus' });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server menyala di Port ${PORT}`));
module.exports = app;
