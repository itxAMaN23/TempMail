import express from 'express';
import dotenv from 'dotenv';
import mailRoutes from './routes/mailRoutes.js';
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL]
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.use('/api/mail', mailRoutes);

app.listen(PORT, () => {
    console.log(`Server Started: ${PORT}`);
})