// testUser.js
const db = require('./config/db')

// Function to get all users
const getAllUsers = async () => {
    try {
        const [rows] = await db.query('SELECT * FROM users');
        console.log('Users:', rows);
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

// Call the function to test
getAllUsers();
