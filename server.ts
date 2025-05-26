import express from 'express';

import userRoutes from './Interfaces/Routes/userRoutes';
import quizRoutes from './Interfaces/Routes/quizRoutes';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Access Blocked ...');
});
app.use('/api/users/auth',userRoutes);
app.use('/api/quiz',quizRoutes );

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server is running on port ${process.env.PORT || 5000}`);
}
);