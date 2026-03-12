const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
require('dotenv').config();
const Account = require('./models/Account');

const app = express();

// ==========================================
// 🛡️ CORS CONFIGURATION (খুবই জরুরি)
// ==========================================
app.use(cors({
    origin: "*", // সব জায়গা থেকে এক্সেস এলাউ করার জন্য এটি সবচেয়ে সহজ উপায়
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// 🔴 Secret Keys & Master Password
const JWT_SECRET = process.env.JWT_SECRET || "pims_super_secret_jwt_key_2024";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "pims_aes_encryption_key_secure";
const ADMIN_PASS = "123"; 

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Database Connected Successfully!"))
  .catch(err => console.error("DB Error:", err));

// ==========================================
// 🔐 ENCRYPTION LOGIC (AES)
// ==========================================
const encryptPass = (password) => {
    return CryptoJS.AES.encrypt(password, ENCRYPTION_KEY).toString();
};

const decryptPass = (encryptedPassword) => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return decrypted || encryptedPassword; 
    } catch (err) {
        return encryptedPassword;
    }
};

// ==========================================
// 🛡️ JWT Authentication Middleware
// ==========================================
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: "Access Denied" });
    
    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid Token" });
        next();
    });
};

// ==========================================
// 🚀 API ROUTES
// ==========================================

// ১. LOGIN API
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '2h' }); 
        res.json({ token, message: "Login Successful" });
    } else {
        res.status(401).json({ message: "Invalid Password" });
    }
});

// ২. GET API
app.get('/api/accounts', verifyToken, async (req, res) => {
    try {
        const accounts = await Account.find();
        const decryptedAccounts = accounts.map(acc => ({
            ...acc._doc,
            password: decryptPass(acc.password)
        }));
        res.json(decryptedAccounts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ৩. POST API
app.post('/api/accounts', verifyToken, async (req, res) => {
    try {
        const encryptedData = { ...req.body, password: encryptPass(req.body.password) };
        const newAccount = new Account(encryptedData);
        const savedAccount = await newAccount.save();
        res.status(201).json(savedAccount);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ৪. PUT API
app.put('/api/accounts/:id', verifyToken, async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = encryptPass(updateData.password);
        }
        const updatedAccount = await Account.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedAccount);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ৫. DELETE API
app.delete('/api/accounts/:id', verifyToken, async (req, res) => {
    try {
        await Account.findByIdAndDelete(req.params.id);
        res.json({ message: "Account deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Secure Server running on port ${PORT}`));