import request from 'supertest';
import { ERROR_CODES } from '@verser/shared';
import { buildTestApp } from '../helpers/test-app';
import { createTestUser } from '../helpers/factories';

const { app } = buildTestApp();

async function loginAndGetToken(): Promise<{ token: string; userId: string; email: string }> {
  const { user, password } = await createTestUser();
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: user.email, password });
  return { token: res.body.data.tokens.accessToken, userId: user.id, email: user.email };
}

describe('GET /api/users/me', () => {
  it('returns the authenticated user', async () => {
    const { token, email } = await loginAndGetToken();
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(email);
  });

  it('returns 401 without bearer', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/users/me', () => {
  it('updates the display name', async () => {
    const { token } = await loginAndGetToken();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Renamed');
  });

  it('returns 400 for empty body', async () => {
    const { token } = await loginAndGetToken();
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/users/me/password', () => {
  it('changes the password and revokes sessions', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'BrandNew2@' });
    expect(res.status).toBe(204);

    // Old password no longer works
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(oldLogin.status).toBe(401);

    // New password works
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'BrandNew2@' });
    expect(newLogin.status).toBe(200);
  });

  it('returns 403 on wrong current password', async () => {
    const { token } = await loginAndGetToken();
    const res = await request(app)
      .patch('/api/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'NotIt1!', newPassword: 'BrandNew2@' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/users/me', () => {
  it('soft-deletes the account and prevents subsequent login', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const token = login.body.data.tokens.accessToken;

    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password });
    expect(res.status).toBe(204);

    const after = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(after.status).toBe(401);
    expect(after.body.error.code).toBe(ERROR_CODES.ACCOUNT_DISABLED);
  });

  it('returns 403 on wrong password', async () => {
    const { token } = await loginAndGetToken();
    const res = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPass1!' });
    expect(res.status).toBe(403);
  });
});
