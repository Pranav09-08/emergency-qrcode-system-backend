// backend/routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const db = require('./config/db'); // Assuming you have your database connection in db.js

// POST: Register a new admin
const bcrypt = require('bcryptjs');


router.post('/register', async (req, res) => {
  const { full_name, email, phone, role, password, confirmPassword } = req.body;
  
  // Check if the password and confirm password match
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'INSERT INTO Admins (full_name, email, phone, role, password) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.query(query, [full_name, email, phone, role, hashedPassword]);

    res.status(201).json({ message: 'Admin registered successfully', adminId: result.insertId });
  } catch (error) {
    console.error('Error registering admin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getadmins', (req, res) => {
  const query = 'SELECT admin_id, full_name, phone FROM admins';

  db.query(query, (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Failed to fetch admins' });
      }
      res.json(results);
  });
});

module.exports = router;


module.exports = router;
