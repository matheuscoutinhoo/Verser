import { Router } from 'express';

export function createHealthRouter(): Router {
  const router = Router();
  router.get('/', (_req, res) => {
    res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
  });
  return router;
}
