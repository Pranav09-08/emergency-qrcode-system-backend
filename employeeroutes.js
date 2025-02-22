const express = require("express");
const router = express.Router();
const db = require("./config/db");

// Register new employee
router.post("/employees", async (req, res) => {
    const { full_name, email, phone, blood_group, emergency_contact_name, emergency_contact_phone, medical_conditions, allergies, qr_code } = req.body;

    if (!full_name || !email || !phone || !qr_code) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const [result] = await db.query(
            "INSERT INTO Users (full_name, email, phone, blood_group, emergency_contact_name, emergency_contact_phone, medical_conditions, allergies, qr_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [full_name, email, phone, blood_group, emergency_contact_name, emergency_contact_phone, medical_conditions, allergies, qr_code]
        );

        res.status(201).json({ message: "Employee registered successfully", user_id: result.insertId });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error" });
    }
});

// Fetch employee details by QR code
router.get("/employees/:qr_code", async (req, res) => {
    const { qr_code } = req.params;

    try {
        console.log("Fetching employee with QR code:", qr_code);
        const [employee] = await db.query("SELECT * FROM Users WHERE qr_code = ?", [qr_code]);

        if (employee.length === 0) {
            return res.status(404).json({ error: "Employee not found" });
        }

        res.json(employee[0]);
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ error: "Database error" });
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

module.exports = router;  // ✅ Ensure this exports the router
