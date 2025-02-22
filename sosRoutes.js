const express = require("express");
const db = require("./config/db");
const nodemailer = require("nodemailer");

const router = express.Router();

// 🚨 SOS Alert Route (POST method)
router.post("/send-alert", async (req, res) => {
  // Extract user_id from query parameters (for GET) or from body (for POST)
  const { user_id } = req.query || req.body;  // Support both GET (query) and POST (body)

  console.log("Received user_id:", user_id);  // Debugging log

  if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Fetch user details from the database using async/await
    console.log("Fetching user details for user_id:", user_id);
    const [users] = await db.query("SELECT * FROM Users WHERE user_id = ?", [user_id]);

    console.log("Fetched user details:", users);  // Debugging log

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];

    // Fetch all admin emails using async/await
    console.log("Fetching admin emails...");
    const [admins] = await db.query("SELECT email FROM Admins");

    console.log("Fetched admin emails:", admins);  // Debugging log

    const adminEmails = admins.map((admin) => admin.email);
    if (adminEmails.length === 0) {
      return res.status(400).json({ error: "No admins found" });
    }

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails.join(","),
      subject: "🚨 SOS Alert - Emergency Situation!",
      text: `Emergency alert triggered by ${user.full_name}.\n
      📧 Email: ${user.email}
      📞 Phone: ${user.phone}
      🩸 Blood Group: ${user.blood_group}
      🆘 Emergency Contact: ${user.emergency_contact_name} (${user.emergency_contact_phone})
      🏥 Medical Conditions: ${user.medical_conditions}
      🚨 Please take immediate action!`,
    };

    console.log("Sending email with options:", mailOptions);  // Debugging log

    // Send email
    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");  // Debugging log
    res.json({ message: "🚀 SOS Alert Sent Successfully!" });

  } catch (error) {
    console.error("Unexpected error occurred:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

module.exports = router;