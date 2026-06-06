import request from 'supertest';
import { ERROR_CODES } from '@verser/shared';
import { buildTestApp } from '../helpers/test-app';
import { createTestUser } from '../helpers/factories';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Universes', () => {
  describe('POST /api/universes', () => {
    it('creates a universe and returns 201', async () => {
      const { token } = await loginAs(app);
      const res = await request(app)
        .post('/api/universes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Middle Earth', genre: 'fantasy' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Middle Earth');
      expect(res.body.data.userId).toBeDefined();
    });

    it('returns 400 for empty name', async () => {
      const { token } = await loginAs(app);
      const res = await request(app)
        .post('/api/universes')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).post('/api/universes').send({ name: 'X' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/universes', () => {
    it('returns paginated universes scoped to the user', async () => {
      const a = await loginAs(app);
      await createUniverse(app, a.token, { name: 'A1' });
      await createUniverse(app, a.token, { name: 'A2' });

      // Different user, different universe
      const { user: otherUser, password } = await createTestUser();
      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: otherUser.email, password });
      await createUniverse(app, otherLogin.body.data.tokens.accessToken, { name: 'B1' });

      const res = await request(app)
        .get('/api/universes')
        .set('Authorization', `Bearer ${a.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.items.map((u: { name: string }) => u.name).sort()).toEqual([
        'A1',
        'A2',
      ]);
    });
  });

  describe('GET /api/universes/:id', () => {
    it('returns universe with entity counts', async () => {
      const { token } = await loginAs(app);
      const universe = await createUniverse(app, token);
      const res = await request(app)
        .get(`/api/universes/${universe.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.counts).toEqual({
        characters: 0,
        locations: 0,
        systems: 0,
        loreEntries: 0,
        immutableLaws: 0,
        timelineEvents: 0,
        tags: 0,
        writings: 0,
      });
    });

    it('returns 404 for a universe owned by another user', async () => {
      const a = await loginAs(app);
      const aUniverse = await createUniverse(app, a.token);
      const b = await loginAs(app);
      const res = await request(app)
        .get(`/api/universes/${aUniverse.id}`)
        .set('Authorization', `Bearer ${b.token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/universes/:id', () => {
    it('updates the universe', async () => {
      const { token } = await loginAs(app);
      const universe = await createUniverse(app, token);
      const res = await request(app)
        .patch(`/api/universes/${universe.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renamed' });
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Renamed');
    });
  });

  describe('DELETE /api/universes/:id', () => {
    it('cascade-deletes children', async () => {
      const { token } = await loginAs(app);
      const universe = await createUniverse(app, token);

      await request(app)
        .post(`/api/universes/${universe.id}/characters`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Vanish' });

      const del = await request(app)
        .delete(`/api/universes/${universe.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(del.status).toBe(204);

      const after = await request(app)
        .get(`/api/universes/${universe.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(after.status).toBe(404);
    });
  });
});
