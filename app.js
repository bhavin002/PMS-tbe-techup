const express = require('express');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const noteRoutes = require('./routes/noteRoutes');
const fileRoutes = require('./routes/fileRoutes');
const cors = require('cors');
dotenv.config();
const { connection } = require('./connection/connection');
connection();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use("/notes", noteRoutes);
app.use("/files", fileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
