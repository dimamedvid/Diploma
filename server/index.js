const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: false }));
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
