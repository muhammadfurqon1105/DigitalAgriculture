const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. KONEKSI KE CLOUD DATABASE AIVEN
const db = mysql.createConnection({ 
    host: 'digital-agri-db-muhammadfurqon1105-823d.d.aivencloud.com' ,
    port: 19687,
    user: 'avnadmin',
    password: 'AVNS_L86Qr4SE7eiA4nqefty',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) return console.error('❌ Koneksi database gagal:', err);
    console.log('✅ BERHASIL! Node.js tersambung ke MySQL Aiven Cloud!');
    
    db.query(`CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(20) PRIMARY KEY, nama VARCHAR(100), kategori VARCHAR(50), lokasi VARCHAR(100), 
        harga INT, stok INT, status VARCHAR(50), progress INT, tanggal VARCHAR(50), 
        metode VARCHAR(50), deskripsi TEXT, img VARCHAR(255)
    )`);
    
    db.query(`CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(20) PRIMARY KEY, pembeli VARCHAR(50), produk VARCHAR(100), alamat TEXT, 
        qty INT, total INT, status VARCHAR(50), tanggal VARCHAR(50)
    )`);

    db.query(`CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(50) PRIMARY KEY, password VARCHAR(50), role VARCHAR(20), alamat TEXT
    )`, () => {
        db.query("INSERT IGNORE INTO users VALUES ('furqon', '123', 'pembeli', 'Jl. Tanjung Duren Barat, Jakarta Barat')");
        db.query("INSERT IGNORE INTO users VALUES ('petani1', '123', 'petani', '')");
    });

    console.log('✅ Sistem Backend siap digunakan!');
});

// --- API ROUTES ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (results && results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, msg: 'Username atau Password salah!' });
        }
    });
});

app.post('/api/register', (req, res) => {
    const { username, password, role, alamat } = req.body;
    db.query('INSERT INTO users (username, password, role, alamat) VALUES (?, ?, ?, ?)', 
    [username, password, role, alamat], (err) => {
        if(err) return res.status(500).json({ success: false, msg: 'Gagal mendaftar.' });
        res.json({ success: true, msg: 'Akun berhasil dibuat.' });
    });
});

app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, r) => {
        res.json(r || []);
    });
});

app.post('/api/products', (req, res) => {
    const { id, nama, kategori, lokasi, harga, stok, status, progress, tanggal, metode, desc, img } = req.body;
    db.query('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [id, nama, kategori, lokasi, harga, stok, status, progress, tanggal, metode, desc, img], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Lahan ditambahkan'});
    });
});

app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY id DESC', (err, r) => {
        res.json(r || []);
    });
});

// ---------------------------------------------------------
// BARIS KERAMAT UNTUK VERCEL (WAJIB ADA)
// ---------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server menyala di Port ${PORT}`));

module.exports = app; // <--- INI YANG BIKIN TIDAK LAYAR PUTIH LAGI
