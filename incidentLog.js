const express = require("express");
const router = express.Router();
const db = require("./config/db"); // Your database connection file

// GET all incident logs
router.get("/get-incident", async (req, res) => {
    try {
        const [logs] = await db.execute("SELECT * FROM IncidentLogs ORDER BY scan_time DESC");
        res.json(logs);
    } catch (error) {
        console.error("Error fetching incident logs:", error);
        res.status(500).json({ error: "Failed to fetch incident logs" });
    }
});

// GET logs for a specific user
router.get("/:user_id", async (req, res) => {
    try {
        const { user_id } = req.params;
        const [logs] = await db.execute("SELECT * FROM IncidentLogs WHERE user_id = ? ORDER BY scan_time DESC", [user_id]);
        res.json(logs);
    } catch (error) {
        console.error("Error fetching logs for user:", error);
        res.status(500).json({ error: "Failed to fetch user logs" });
    }
});

// POST - Add a new incident log (optional)
router.post("/incident", async (req, res) => {
    try {
        const { user_id, scanned_by_name, scanned_by_phone, scan_location_latitude, scan_location_longitude } = req.body;

        if (!user_id || !scanned_by_name || !scanned_by_phone || !scan_location_latitude || !scan_location_longitude) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Insert the incident log into the database
        await db.execute(
            "INSERT INTO IncidentLogs (user_id, scanned_by_name, scanned_by_phone, scan_location_latitude, scan_location_longitude, scan_time) VALUES (?, ?, ?, ?, ?, NOW())",
            [user_id, scanned_by_name, scanned_by_phone, scan_location_latitude, scan_location_longitude]
        );

        res.status(201).json({ message: "Incident log added successfully" });
    } catch (error) {
        console.error("Error adding incident log:", error);
        res.status(500).json({ error: "Failed to add incident log" });
    }
});


module.exports = router;