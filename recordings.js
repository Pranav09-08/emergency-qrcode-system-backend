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

// Create the recordings table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS recordings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    duration INT NOT NULL,
    size INT NOT NULL,
    mimeType VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
`;

db.query(createTableQuery)
    .then(() => console.log("Recordings table is ready"))
    .catch(err => console.error('Table creation error:', err));

// Upload a recording
recordingsRouter.post('/voice/recordings', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No audio file uploaded' });

        const { filename, path: filePath, size } = req.file;
        const duration = req.body.duration || 0; // Default to 0 if duration is not provided
        const mimeType = mime.lookup(filename) || req.file.mimetype;
        const userId = 90007;
        // const userId = req.body.user_id; // Assume user_id is passed in the request body

        // Insert the new recording into the MySQL database
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
recordingsRouter.get('/', async (req, res) => {
    try {
        // Join the recordings table with the users table to get the user details
        const query = `
            SELECT 
                r.id, 
                r.filename, 
                r.path, 
                r.duration, 
                r.size, 
                r.mimeType, 
                r.createdAt, 
                u.full_name, 
                u.phone, 
                u.email
            FROM recordings r
            LEFT JOIN users u ON r.user_id = u.user_id
            ORDER BY r.createdAt DESC;
        `;

        const [recordings] = await db.query(query);

        const html = `
        <html>
            <head>
                <title>Recordings List</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f7fa; }
                    .recording { 
                        margin-bottom: 30px; 
                        padding: 20px; 
                        border: 1px solid #ddd; 
                        border-radius: 8px;
                        background: #ffffff;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    audio {
                        margin-top: 20px;
                        width: 100%;
                        max-width: 600px;
                        display: block;
                        border-radius: 8px;
                        background-color: #f8f9fa;
                        border: 1px solid #ccc;
                        padding: 10px;
                    }
                    .filename {
                        color: #333; 
                        font-weight: bold; 
                        font-size: 1.2em;
                        margin-bottom: 10px;
                    }
                    .meta { 
                        color: #666; 
                        font-size: 0.9em; 
                        margin-bottom: 15px;
                    }
                    .user-details { 
                        font-size: 0.9em; 
                        color: #444; 
                        margin-top: 10px; 
                        padding-top: 10px;
                        border-top: 1px solid #ddd;
                    }
                    .user-details div { 
                        margin-bottom: 5px;
                    }
                    .user-details strong {
                        color: #333;
                    }
                    .recording:hover {
                        background-color: #f9f9f9;
                        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
                    }
                                .users-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            width: 100%;
        }

        .user-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease;
            border-left: 4px solid #6c63ff;
            margin-bottom:20px;
        }

        .user-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }

        .user-details {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .detail-item {
            padding: 0.8rem;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #444;
        }

        .detail-label {
            display: block;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 0.3rem;
            font-size: 0.9rem;
        }

        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }

        .active {
            background: #28a745;
        }

        .inactive {
            background: #dc3545;
        }
                </style>
            </head>
            <body>
                <h1>Recordings List (${recordings.length})</h1>
                ${recordings.map(rec => `
                    <div class="user-card">
            <div class="user-details">
                <div class="detail-item">
                    <span class="detail-label">Employee Name : </span>
                    ${rec.full_name}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    ${rec.email}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone</span>
                    ${rec.phone}
                </div>
                <audio controls>
                            <source src=".${rec.path}" type="${rec.mimeType}">
                            <source src=".${rec.path}" type="audio/mpeg">
                            <source src=".${rec.path}" type="audio/webm">
                            Your browser does not support audio playback
                        </audio>
            </div>
        </div>

                `).join('')}
            </body>
        </html>`;

        res.send(html);
    } catch (error) {
        console.error('Error loading recordings:', error);
        res.status(500).send('Error loading recordings');
    }
});

module.exports = recordingsRouter;