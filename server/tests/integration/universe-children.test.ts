import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Universe child resources — smoke tests', () => {
  it('exercises systems, lore, laws, tags happy paths', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };

    // World system
    const sys = await request(app)
      .post(`/api/universes/${universe.id}/systems`)
      .set(auth)
      .send({ name: 'Memory Magic', type: 'magic', rules: 'costs memory' });
    expect(sys.status).toBe(201);
    expect(sys.body.data.type).toBe('magic');

    const sysList = await request(app)
      .get(`/api/universes/${universe.id}/systems`)
      .set(auth);
    expect(sysList.body.data.total).toBe(1);

    // Lore entry with importance filter
    const loreA = await request(app)
      .post(`/api/universes/${universe.id}/lore-entries`)
      .set(auth)
      .send({
        title: 'First War',
        category: 'history',
        content: 'A long war ended in tragedy.',
        importance: 'critical',
      });
    expect(loreA.status).toBe(201);

    const loreB = await request(app)
      .post(`/api/universes/${universe.id}/lore-entries`)
      .set(auth)
      .send({
        title: 'Local tradition',
        category: 'culture',
        content: 'A minor custom.',
        importance: 'low',
      });
    expect(loreB.status).toBe(201);

    const loreList = await request(app)
      .get(`/api/universes/${universe.id}/lore-entries?importance=critical`)
      .set(auth);
    expect(loreList.body.data.total).toBe(1);
    expect(loreList.body.data.items[0].title).toBe('First War');

    // Immutable law
    const law = await request(app)
      .post(`/api/universes/${universe.id}/immutable-laws`)
      .set(auth)
      .send({
        title: 'No Resurrection',
        description: 'The dead cannot return.',
        category: 'divine',
      });
    expect(law.status).toBe(201);

    // Tag (unique per universe)
    const tag = await request(app)
      .post(`/api/universes/${universe.id}/tags`)
      .set(auth)
      .send({ name: 'prologue', color: '#c4a265' });
    expect(tag.status).toBe(201);

    const dupTag = await request(app)
      .post(`/api/universes/${universe.id}/tags`)
      .set(auth)
      .send({ name: 'prologue' });
    expect(dupTag.status).toBe(409);

    // Tag with invalid color → 400
    const badColor = await request(app)
      .post(`/api/universes/${universe.id}/tags`)
      .set(auth)
      .send({ name: 'epilogue', color: 'not-a-color' });
    expect(badColor.status).toBe(400);
  });
});
