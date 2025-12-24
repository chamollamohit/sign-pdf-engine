import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { processPDF } from './src/controller/pdf.controller.js';

dotenv.config();

connectDB();

const app = express();
const upload = multer({
    storage: multer.memoryStorage(), limits: {
        fileSize: 10 * 1024 * 1024, // Limit PDF to 10MB
        fieldSize: 10 * 1024 * 1024 // Limit JSON Text Fields to 10MB
    }
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["POST"],
    credentials: true
}));
app.use(express.json());

app.post('/sign-pdf', upload.single('pdf'), processPDF);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Burn-In Engine running on port ${PORT}`);
});