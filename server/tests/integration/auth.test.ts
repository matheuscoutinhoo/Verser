import request from 'supertest';
import { AUTH, ERROR_CODES } from '@verser/shared';
import { buildTestApp } from '../helpers/test-app';
import { createTestUser, DEFAULT_TEST_PASSWORD } from '../helpers/factories';

const { app } = buildTestApp();

function getRefreshCookie(setCookieHeader: string[] | string | undefined): string | undefined {
  if (!setCookieHeader) return undefined;
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  const match = cookies.find((c) => c.startsWith(`${AUTH.REFRESH_COOKIE_NAME}=`));
  if (!match) return undefined;
  const value = match.split(';')[0];
  return value;
}

describe('POST /api/auth/register', () => {
  it('returns 201, sets refresh cookie, and returns user + access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'NewUser@Test.LOCAL', password: 'StrongPass1!', displayName: 'New User' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('newuser@test.local');
    expect(res.body.data.user.displayName).toBe('New User');
    expect(typeof res.body.data.tokens.accessToken).toBe('string');
    expect(res.body.data.tokens.expiresIn).toBeGreaterThan(0);
    expect(getRefreshCookie(res.headers['set-cookie'])).toBeDefined();
  });

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.test', password: 'weak', displayName: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
  });

  it('returns 409 when email already exists', async () => {
    await createTestUser({ email: 'taken@test.local' });
    const res = await request(app).post('/api/auth/register').send({
      email: 'taken@test.local',
      password: 'StrongPass1!',
      displayName: 'Taken Writer',
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe(ERROR_CODES.EMAIL_TAKEN);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 200 with valid credentials', async () => {
    const { user, password } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(getRefreshCookie(res.headers['set-cookie'])).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.local', password: DEFAULT_TEST_PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('returns 401 for wrong password', async () => {
    const { user } = await createTestUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'WrongPass1!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
  });

  it('returns 401 for disabled account', async () => {
    const { user, password } = await createTestUser({ isActive: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(ERROR_CODES.ACCOUNT_DISABLED);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates tokens — new cookie returned, old becomes invalid', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const oldCookie = getRefreshCookie(login.headers['set-cookie']);
    expect(oldCookie).toBeDefined();

    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie as string);
    expect(refresh.status).toBe(200);
    expect(refresh.body.data.tokens.accessToken).toEqual(expect.any(String));
    const newCookie = getRefreshCookie(refresh.headers['set-cookie']);
    expect(newCookie).toBeDefined();
    expect(newCookie).not.toBe(oldCookie);

    // Reusing the old cookie must now fail with TOKEN_REUSED.
    const reuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', oldCookie as string);
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe(ERROR_CODES.TOKEN_REUSED);

    // After reuse detection, the new cookie should also be invalidated.
    const newAfterReuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', newCookie as string);
    expect(newAfterReuse.status).toBe(401);
  });

  it('returns 401 when no refresh cookie is sent', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the session and clears the cookie', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const cookie = getRefreshCookie(login.headers['set-cookie']);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie as string);
    expect(logout.status).toBe(204);

    const after = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie as string);
    expect(after.status).toBe(401);
  });
});

describe('GET /api/auth/sessions & DELETE /api/auth/sessions/:id', () => {
  it('lists active sessions and marks the current', async () => {
    const { user, password } = await createTestUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const accessToken = login.body.data.tokens.accessToken;
    const cookie = getRefreshCookie(login.headers['set-cookie']);

    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie as string);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].current).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/auth/sessions');
    expect(res.status).toBe(401);
  });

  it('revokes a session by id', async () => {
    const { user, password } = await createTestUser();
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password });

    const accessToken = login2.body.data.tokens.accessToken;
    const cookie2 = getRefreshCookie(login2.headers['set-cookie']);

    const list = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Cookie', cookie2 as string);
    const other = list.body.data.find((s: { current: boolean }) => !s.current);
    expect(other).toBeDefined();

    const del = await request(app)
      .delete(`/api/auth/sessions/${other.id}`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(204);

    // login1's refresh should now fail
    const cookie1 = getRefreshCookie(login1.headers['set-cookie']);
    const refresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookie1 as string);
    expect(refresh.status).toBe(401);
  });
});
