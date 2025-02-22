// backend/routes/users.js (or server.js if you don't have a routes file)
const express = require('express');
const db = require('./config/db');  // Import your DB connection

const router = express.Router();

// API endpoint to fetch all users
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        res.status(200).json(rows);  // Send the users as a JSON response
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
