const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '' });

db.connect((err) => {
    if (err) return console.error('❌ Koneksi database gagal:', err);
    console.log('⏳ Menyiapkan Database dan Tabel...');
    
    db.query('CREATE DATABASE IF NOT EXISTS db_digital_agri', () => {
        db.query('USE db_digital_agri', () => {
            
            // 1. Tabel Produk
            db.query(`CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(20) PRIMARY KEY, nama VARCHAR(100), kategori VARCHAR(50), lokasi VARCHAR(100), 
                harga INT, stok INT, status VARCHAR(50), progress INT, tanggal VARCHAR(50), 
                metode VARCHAR(50), deskripsi TEXT, img VARCHAR(255)
            )`);
            
            // 2. Tabel Order (Dengan Alamat)
            db.query(`CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(20) PRIMARY KEY, pembeli VARCHAR(50), produk VARCHAR(100), alamat TEXT, 
                qty INT, total INT, status VARCHAR(50), tanggal VARCHAR(50)
            )`);

            // 3. Tabel Users (Untuk menyimpan Akun & Alamat Permanen)
            db.query(`CREATE TABLE IF NOT EXISTS users (
                username VARCHAR(50) PRIMARY KEY, password VARCHAR(50), role VARCHAR(20), alamat TEXT
            )`, () => {
                // Akun Dummy untuk Testing
                db.query("INSERT IGNORE INTO users VALUES ('furqon', '123', 'pembeli', 'Jl. Tanjung Duren Barat, Jakarta Barat')");
                db.query("INSERT IGNORE INTO users VALUES ('petani1', '123', 'petani', '')");
            });

            console.log('✅ Sistem Backend MySQL siap digunakan!');
        });
    });
});

// --- API LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, msg: 'Username atau Password salah!' });
        }
    });
});

// --- API REGISTER (Pendaftaran Akun Baru) ---
app.post('/api/register', (req, res) => {
    const { username, password, role, alamat } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if(results.length > 0) {
            return res.json({ success: false, msg: 'Username sudah digunakan, pilih yang lain!' });
        }
        db.query('INSERT INTO users (username, password, role, alamat) VALUES (?, ?, ?, ?)', 
        [username, password, role, alamat], (err) => {
            if(err) return res.status(500).json({ success: false, msg: 'Gagal mendaftar.' });
            res.json({ success: true, msg: 'Akun berhasil dibuat.' });
        });
    });
});

// --- API PRODUK ---
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, r) => {
        res.json(r);
    });
});

app.post('/api/products', (req, res) => {
    const { id, nama, kategori, lokasi, harga, stok, status, progress, tanggal, metode, desc, img } = req.body;
    db.query('INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', [id, nama, kategori, lokasi, harga, stok, status, progress, tanggal, metode, desc, img], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Lahan ditambahkan'});
    });
});

app.put('/api/products/:id', (req, res) => {
    const p = req.body;
    db.query('UPDATE products SET harga=?, stok=?, status=?, progress=?, tanggal=? WHERE id=?', [p.harga, p.stok, p.status, p.progress, p.tanggal, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'ok'});
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id=?', [req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Dihapus'});
    });
});

// --- API ORDERS & TRACKING ---
app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY id DESC', (err, r) => {
        res.json(r);
    });
});

app.get('/api/orders/user/:pembeli', (req, res) => {
    db.query('SELECT * FROM orders WHERE pembeli = ? ORDER BY id DESC', [req.params.pembeli], (err, r) => {
        res.json(r);
    });
});

app.post('/api/orders', (req, res) => {
    const o = req.body;
    db.query('UPDATE products SET stok = stok - ? WHERE id = ?', [o.qty, o.id_produk], (err) => {
        if(err) return res.status(500).json(err);
        db.query('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)', [o.id, o.pembeli, o.produk, o.alamat, o.qty, o.total, o.status, o.tanggal], (err) => {
            if(err) return res.status(500).json(err);
            res.json({msg: 'ok'});
        });
    });
});

app.put('/api/orders/:id', (req, res) => {
    db.query('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'ok'});
    });
});

app.listen(5000, () => console.log('🚀 Server menyala di Port 5000'));
