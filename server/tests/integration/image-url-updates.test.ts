import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Universe cover URL (AI-generated)', () => {
  it('PATCH /api/universes/:id accepts coverUrl', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);

    const res = await request(app)
      .patch(`/api/universes/${universe.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverUrl: 'https://example.com/cover.png' });
    expect(res.status).toBe(200);
    expect(res.body.data.coverUrl).toBe('https://example.com/cover.png');
  });

  it('PATCH /api/universes/:id can clear the coverUrl', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    await request(app)
      .patch(`/api/universes/${universe.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverUrl: 'https://example.com/cover.png' });

    const res = await request(app)
      .patch(`/api/universes/${universe.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverUrl: null });
    expect(res.status).toBe(200);
    expect(res.body.data.coverUrl).toBeNull();
  });

  it('rejects a non-URL coverUrl with 400', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .patch(`/api/universes/${universe.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ coverUrl: 'not-a-url' });
    expect(res.status).toBe(400);
  });
});

describe('Character / Location imageUrl (AI-generated)', () => {
  it('PATCH character accepts imageUrl', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const char = await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Portrait subject' });

    const res = await request(app)
      .patch(`/api/universes/${universe.id}/characters/${char.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ imageUrl: 'https://example.com/portrait.png' });
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toBe('https://example.com/portrait.png');
  });

  it('PATCH location accepts imageUrl', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const loc = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Vista' });

    const res = await request(app)
      .patch(`/api/universes/${universe.id}/locations/${loc.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ imageUrl: 'https://example.com/loc.png' });
    expect(res.status).toBe(200);
    expect(res.body.data.imageUrl).toBe('https://example.com/loc.png');
  });
});
