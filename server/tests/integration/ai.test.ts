import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('AI — mock provider integration', () => {
  it('POST /api/ai/generate-text returns a mocked response and logs usage', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };

    const res = await request(app)
      .post('/api/ai/generate-text')
      .set(auth)
      .send({
        universeId: universe.id,
        mode: 'rewrite',
        selection: 'Aldric grimaced.',
        instruction: 'Make it darker.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.mocked).toBe(true);
    expect(res.body.data.mode).toBe('rewrite');
    expect(res.body.data.text).toMatch(/^\[mock:rewrite\]/);

    const usage = await request(app).get('/api/ai/usage').set(auth);
    expect(usage.status).toBe(200);
    expect(usage.body.data.totals.calls).toBe(1);
    expect(usage.body.data.byAction.generate_text.calls).toBe(1);
  });

  it('POST /api/ai/generate-image returns a placeholder URL', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post('/api/ai/generate-image')
      .set('Authorization', `Bearer ${token}`)
      .send({ universeId: universe.id, prompt: 'an old wizard', style: 'realistic' });

    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toMatch(/^https:\/\/placehold\.co/);
    expect(res.body.data.mocked).toBe(true);
  });

  it('POST /api/ai/analyze-consistency returns the mocked empty report', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post('/api/ai/analyze-consistency')
      .set('Authorization', `Bearer ${token}`)
      .send({ universeId: universe.id, text: 'A long scene with characters.' });

    expect(res.status).toBe(200);
    expect(res.body.data.issues).toEqual([]);
    expect(res.body.data.mocked).toBe(true);
  });

  it('POST /api/ai/assist-creation surfaces the raw response when not valid JSON', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post('/api/ai/assist-creation')
      .set('Authorization', `Bearer ${token}`)
      .send({
        universeId: universe.id,
        entityType: 'character',
        brief: 'an aged mage mentor',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.entityType).toBe('character');
    expect(res.body.data.suggestion).toBeDefined();
    expect(res.body.data.mocked).toBe(true);
  });

  it('returns 404 when calling a universe owned by another user', async () => {
    const a = await loginAs(app);
    const universe = await createUniverse(app, a.token);
    const b = await loginAs(app);
    const res = await request(app)
      .post('/api/ai/generate-text')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ universeId: universe.id, mode: 'expand', selection: 'x' });
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/ai/generate-text')
      .send({ universeId: 'x', mode: 'expand' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid mode with 400', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post('/api/ai/generate-text')
      .set('Authorization', `Bearer ${token}`)
      .send({ universeId: universe.id, mode: 'sing-a-song' });
    expect(res.status).toBe(400);
  });
});
