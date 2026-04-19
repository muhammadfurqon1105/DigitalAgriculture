const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({ host: 'localhost', user: 'root', password: '' });

db.connect((err) => {
    if (err) {
        console.error('❌ Koneksi database gagal:', err);
        return;
    }
    console.log('⏳ Menyiapkan Database dan Tabel secara otomatis...');
    
    db.query('CREATE DATABASE IF NOT EXISTS db_digital_agri', (err) => {
        if(err) console.error(err);
        
        db.query('USE db_digital_agri', (err) => {
            if(err) console.error(err);
            
            db.query(`CREATE TABLE IF NOT EXISTS products (
                id VARCHAR(20) PRIMARY KEY, nama VARCHAR(100), kategori VARCHAR(50), lokasi VARCHAR(100), 
                harga INT, stok INT, status VARCHAR(50), progress INT, tanggal VARCHAR(50), 
                metode VARCHAR(50), deskripsi TEXT, img VARCHAR(255)
            )`, (err) => { if(err) console.error(err); });
          
            db.query(`CREATE TABLE IF NOT EXISTS orders (
                id VARCHAR(20) PRIMARY KEY, pembeli VARCHAR(50), produk VARCHAR(100), 
                qty INT, total INT, status VARCHAR(50), tanggal VARCHAR(50)
            )`, (err) => { if(err) console.error(err); });

            db.query('SELECT COUNT(*) AS count FROM products', (err, results) => {
                if (err) return console.error(err);
                
                if (results[0].count === 0) {
                    const insertSQL = `INSERT INTO products (id, nama, kategori, lokasi, harga, stok, status, progress, tanggal, metode, deskripsi, img) VALUES 
                    ('p1', 'Cabai Merah Keriting', 'Bumbu', '📍 Blok A, Garut', 35000, 1500, 'Masa Perawatan', 65, 'Estimasi: 12 Mei', 'Konvensional', 'Cabai varietas unggul pedas tinggi. Cocok untuk industri saus.', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=600'),
                    ('p2', 'Kentang Granola Grade A', 'Sayuran', '📍 Blok C, Dieng', 15000, 5000, 'Siap Panen', 100, 'Siap Kirim Hari Ini', 'Semi-Organik', 'Kentang ukuran besar, kulit mulus. Direkomendasikan untuk french fries.', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=600'),
                    ('p3', 'Tomat Cherry Organik', 'Sayuran', '📍 Green House, Lembang', 25000, 300, 'Masa Perawatan', 40, 'Estimasi: 20 Juni', 'Hidroponik', 'Tomat cherry manis segar tanpa pestisida kimia. Standar restoran premium.', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=600'),
                    ('p4', 'Bawang Merah Bima', 'Bumbu', '📍 Lahan Tani, Brebes', 28000, 2000, 'Siap Panen', 100, 'Siap Kirim Hari Ini', 'Konvensional', 'Bawang merah kering siap simpan. Aroma sangat tajam khas Brebes.', 'https://images.unsplash.com/photo-1615486171448-4fd1bb2b38ed?q=80&w=600')`;
                    
                    db.query(insertSQL, (err) => {
                        if(err) console.error(err);
                        else console.log('✅ Produk awal berhasil diisi otomatis!');
                    });
                }
                console.log('✅ Sistem Backend dan MySQL siap digunakan!');
            });
        });
    });
});

app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
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
    const { harga, stok, status, progress, tanggal } = req.body;
    db.query('UPDATE products SET harga=?, stok=?, status=?, progress=?, tanggal=? WHERE id=?', [harga, stok, status, progress, tanggal, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Lahan diupdate'});
    });
});

app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id=?', [req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Dihapus'});
    });
});

app.get('/api/orders', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY id DESC', (err, results) => {
        if(err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/orders', (req, res) => {
    const { id, pembeli, produk, qty, total, status, tanggal, id_produk } = req.body;
    db.query('UPDATE products SET stok = stok - ? WHERE id = ?', [qty, id_produk], (err) => {
        if(err) return res.status(500).json(err);
        
        db.query('INSERT INTO orders VALUES (?,?,?,?,?,?,?)', [id, pembeli, produk, qty, total, status, tanggal], (err) => {
            if(err) return res.status(500).json(err);
            res.json({msg: 'Pesanan Dibuat'});
        });
    });
});

app.put('/api/orders/:id', (req, res) => {
    db.query('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id], (err) => {
        if(err) return res.status(500).json(err);
        res.json({msg: 'Order diupdate'});
    });
});

app.listen(5000, () => console.log('🚀 Server menyala di Port 5000'));