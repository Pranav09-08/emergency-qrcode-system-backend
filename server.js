require('dotenv').config(); // Load environment variables first
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const usersRouter = require('./user'); 
const admin = require('./adminRoutes')
const login = require('./loginRoute')

const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use('/api', usersRouter);
app.use('/admin',admin)
app.use('/login',login)


app.get("/", (req, res) => {
  res.send("Backend server is running!");
});

app.get("/welcome", (req, res) => {
  res.send("Welcome to System!");
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log("✅ Database Connected Successfully");
});
