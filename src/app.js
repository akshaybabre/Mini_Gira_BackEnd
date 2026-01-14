const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const cookieParser = require("cookie-parser");

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,     
  }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);


app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
