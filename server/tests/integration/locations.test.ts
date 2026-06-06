import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Locations (hierarchy)', () => {
  it('creates a parent → child hierarchy', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);

    const parent = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Continent of Nyrath', geography: 'mountainous' });
    expect(parent.status).toBe(201);

    const child = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'City of Vael', parentId: parent.body.data.id });
    expect(child.status).toBe(201);
    expect(child.body.data.parentId).toBe(parent.body.data.id);
  });

  it('rejects a parentId from another universe', async () => {
    const { token } = await loginAs(app);
    const u1 = await createUniverse(app, token, { name: 'U1' });
    const u2 = await createUniverse(app, token, { name: 'U2' });

    const foreign = await request(app)
      .post(`/api/universes/${u1.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Foreign City' });

    const res = await request(app)
      .post(`/api/universes/${u2.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invalid Child', parentId: foreign.body.data.id });
    expect(res.status).toBe(400);
  });

  it('rejects self-parenting', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const loc = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Solo' });
    const res = await request(app)
      .patch(`/api/universes/${universe.id}/locations/${loc.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: loc.body.data.id });
    expect(res.status).toBe(400);
  });

  it('can disconnect parent by sending parentId: null', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const parent = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Parent' });
    const child = await request(app)
      .post(`/api/universes/${universe.id}/locations`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Child', parentId: parent.body.data.id });
    const detached = await request(app)
      .patch(`/api/universes/${universe.id}/locations/${child.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: null });
    expect(detached.body.data.parentId).toBeNull();
  });
});
