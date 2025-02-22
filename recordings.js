require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const db = require('./config/db'); // Use db instead of pool

const recordingsRouter = express.Router();

// Middleware Configuration
recordingsRouter.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));


// Static File Serving with Proper MIME Types
recordingsRouter.use('/uploads', express.static(path.join(__dirname, 'uploads'), (req, res, next) => {
    const file = path.join(__dirname, 'uploads', req.path);
    const mimeType = mime.lookup(file);
    
    if (mimeType) res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    next();
}));

// File Upload Configuration
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max size
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Only audio files are allowed'));
    }
});



// Upload a recording
// Change the route to include user_id as a parameter
recordingsRouter.post('/voice/recordings/:userId', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

        const { filename, path: filePath, size } = req.file;
        const duration = req.body.duration || 0;
        const mimeType = mime.lookup(filename) || req.file.mimetype;
        const userId = req.body.user_id; // Get user_id from URL parameters

        if (!userId) return res.status(400).json({ error: 'User ID is required' });

        const insertQuery = `
            INSERT INTO recordings (filename, path, duration, size, mimeType, user_id)
            VALUES (?, ?, ?, ?, ?, ?);
        `;
        
        const [result] = await db.query(insertQuery, [filename, `/uploads/${req.file.filename}`, duration, size, mimeType, userId]);

        const newRecording = {
            id: result.insertId,
            filename,
            path: `/uploads/${req.file.filename}`,
            duration,
            size,
            mimeType,
            createdAt: new Date(),
            user_id: userId
        };

        res.status(201).json(newRecording);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'Failed to save recording' });
    }
});



recordingsRouter.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const query = `
            SELECT 
                id, 
                filename, 
                path, 
                duration, 
                size, 
                mimeType, 
                createdAt,
                user_id
            FROM recordings
            WHERE user_id = ?
            ORDER BY createdAt DESC;
        `;

        const [recordings] = await db.query(query, [userId]);

        // Return the recordings as JSON
        res.json(recordings);
    } catch (error) {
        console.error('Error loading recordings:', error);
        res.status(500).json({ message: 'Error loading recordings' });
    }
});


module.exports = recordingsRouter;