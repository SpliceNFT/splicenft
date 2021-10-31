import dotenv from 'dotenv-flow';
dotenv.config();
import app from './server';

// Start the application by listening to specific port
const port = Number(process.env.PORT || 5999);
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
