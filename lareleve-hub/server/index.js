import { app, initApp } from './app.js';

const { PORT = 3001 } = process.env;

await initApp();

app.listen(Number(PORT), () => {
  console.log(`LaReleve API listening on http://localhost:${PORT}`);
});
