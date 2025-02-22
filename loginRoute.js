const express = require('express');
const bcrypt = require('bcryptjs');  // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken
const db = require('./config/db');  // Assuming db is your database module

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key'; // Secret key for JWT

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Query to fetch user by email
    const query = 'SELECT * FROM Admins WHERE email = ?';
    const [rows] = await db.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare the provided password with the hashed password stored in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expiration time
    );

    // Respond with the token and user data
    res.json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Dashboard endpoint - Get user info from JWT token
router.get('/dashboard', (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Not authorized' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Send back the user data stored in the token
    res.json(decoded);
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Logout endpoint - Just remove the token on the client side
router.post('/logout', (req, res) => {
  // No need to do anything on the server side for JWT logout
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
