import { app, initApp } from '../server/app.js';

export default async function handler(req, res) {
  await initApp();
  return app(req, res);
}
