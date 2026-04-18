import app from './app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = parseInt(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`[PushSMS] Server running on http://localhost:${PORT}`);
  console.log(`[PushSMS] Environment: ${process.env.NODE_ENV || 'development'}`);
});
