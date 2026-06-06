import request from 'supertest';
import type { Express } from 'express';
import { createTestUser } from './factories';

export interface AuthedClient {
  token: string;
  userId: string;
  email: string;
}

export async function loginAs(app: Express): Promise<AuthedClient> {
  const { user, password } = await createTestUser();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password });
  return {
    token: res.body.data.tokens.accessToken,
    userId: user.id,
    email: user.email,
  };
}

export async function createUniverse(
  app: Express,
  token: string,
  overrides: Partial<{ name: string; description: string; genre: string }> = {},
): Promise<{ id: string; name: string }> {
  const res = await request(app)
    .post('/api/universes')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: overrides.name ?? 'Aetherfall',
      description: overrides.description ?? 'A magic-driven world',
      genre: overrides.genre ?? 'fantasy',
    });
  return res.body.data;
}
