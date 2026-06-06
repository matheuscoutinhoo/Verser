import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Characters & Relations', () => {
  it('full CRUD + relation creation flow', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);

    // Create two characters
    const a = await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Aldric',
        aliases: ['Gray Wolf'],
        personality: 'stoic',
        customFields: { age: 47 },
      });
    expect(a.status).toBe(201);
    expect(a.body.data.aliases).toEqual(['Gray Wolf']);
    expect(a.body.data.customFields).toEqual({ age: 47 });

    const b = await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mira' });
    expect(b.status).toBe(201);

    // List
    const list = await request(app)
      .get(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.total).toBe(2);

    // Update
    const upd = await request(app)
      .patch(`/api/universes/${universe.id}/characters/${a.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ personality: 'cynical', aliases: ['Gray Wolf', 'Shadow'] });
    expect(upd.status).toBe(200);
    expect(upd.body.data.aliases).toHaveLength(2);

    // Create a relation
    const rel = await request(app)
      .post(`/api/universes/${universe.id}/character-relations`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromCharacterId: a.body.data.id,
        toCharacterId: b.body.data.id,
        relationType: 'mentor',
      });
    expect(rel.status).toBe(201);

    // Duplicate relation should fail with 409
    const dup = await request(app)
      .post(`/api/universes/${universe.id}/character-relations`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromCharacterId: a.body.data.id,
        toCharacterId: b.body.data.id,
        relationType: 'mentor',
      });
    expect(dup.status).toBe(409);

    // Self-relation should fail with 400 (Zod refine)
    const self = await request(app)
      .post(`/api/universes/${universe.id}/character-relations`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        fromCharacterId: a.body.data.id,
        toCharacterId: a.body.data.id,
        relationType: 'rival',
      });
    expect(self.status).toBe(400);

    // List relations
    const relList = await request(app)
      .get(`/api/universes/${universe.id}/character-relations`)
      .set('Authorization', `Bearer ${token}`);
    expect(relList.body.data).toHaveLength(1);

    // Delete relation
    const delRel = await request(app)
      .delete(`/api/universes/${universe.id}/character-relations/${rel.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delRel.status).toBe(204);

    // Delete character
    const delChar = await request(app)
      .delete(`/api/universes/${universe.id}/characters/${a.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delChar.status).toBe(204);
  });

  it('returns 404 when accessing a character through another user universe', async () => {
    const a = await loginAs(app);
    const universe = await createUniverse(app, a.token);
    const char = await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ name: 'Secret' });

    const b = await loginAs(app);
    const res = await request(app)
      .get(`/api/universes/${universe.id}/characters/${char.body.data.id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });
});
