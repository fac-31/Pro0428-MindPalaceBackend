import express, { Request, Response } from 'express';
const app = express();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server connected at http://localhost:${PORT}`);
});
