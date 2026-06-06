import request from 'supertest';
import { prisma } from '../../src/config/database';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('GET /api/users/me/stats', () => {
  it('returns zeroed stats for a brand-new user', async () => {
    const { token } = await loginAs(app);
    const res = await request(app)
      .get('/api/users/me/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({
      universes: 0,
      writings: 0,
      words: 0,
      characters: 0,
      locations: 0,
      immutableLaws: 0,
    });
    expect(res.body.data.streak.current).toBe(0);
    expect(res.body.data.streak.longest).toBe(0);
    expect(res.body.data.streak.lastWriteDay).toBeNull();
  });

  it('aggregates universes, characters, laws and word counts across writings', async () => {
    const { token, userId } = await loginAs(app);
    const universe = await createUniverse(app, token);

    await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' });
    await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'B' });
    await request(app)
      .post(`/api/universes/${universe.id}/immutable-laws`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Law', description: 'x', category: 'physics' });

    // Create a writing with 5 words via the API to exercise the wordCount derivation.
    await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Scene',
        content: '<p>five short little simple words</p>',
        contentPlain: 'five short little simple words',
      });

    // Stamp a yesterday-update directly so we get a 2-day streak.
    await prisma.writing.create({
      data: {
        userId,
        universeId: universe.id,
        title: 'Yesterday',
        content: '',
        contentPlain: '',
        wordCount: 0,
        updatedAt: new Date(Date.now() - 24 * 3600 * 1000),
      },
    });

    const res = await request(app)
      .get('/api/users/me/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totals.universes).toBe(1);
    expect(res.body.data.totals.characters).toBe(2);
    expect(res.body.data.totals.immutableLaws).toBe(1);
    expect(res.body.data.totals.writings).toBe(2);
    expect(res.body.data.totals.words).toBe(5);
    expect(res.body.data.writingActivity.today).toBe(5);
    expect(res.body.data.streak.current).toBeGreaterThanOrEqual(2);
    expect(res.body.data.streak.lastWriteDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('counts AI calls in the last 24h separately from totals', async () => {
    const { token, userId } = await loginAs(app);
    await prisma.aIUsageLog.create({
      data: {
        userId,
        action: 'generate_text',
        model: 'mock',
        tokensInput: 10,
        tokensOutput: 20,
        cost: 0,
      },
    });
    // One ancient call should still count in the total but not the 24h window.
    await prisma.aIUsageLog.create({
      data: {
        userId,
        action: 'generate_image',
        model: 'mock',
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
        createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      },
    });

    const res = await request(app)
      .get('/api/users/me/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.ai.callsTotal).toBe(2);
    expect(res.body.data.ai.callsLast24h).toBe(1);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/users/me/stats');
    expect(res.status).toBe(401);
  });
});
