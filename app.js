const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const cookieParser = require("cookie-parser");
const projectRoutes = require("./routes/projectRoutes");
const teamRoutes = require("./routes/teamRoutes");
const companyRoutes = require("./routes/companyRoutes");
const taskRoutes = require("./routes/taskRoutes")
const sprintRoutes = require("./routes/sprintRoutes")



const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mini-gira-frontend.onrender.com"
    ],
    credentials: true,
  }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/test", testRoutes);

app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/sprint", sprintRoutes);



app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
