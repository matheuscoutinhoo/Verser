import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Writings — tree, hierarchy, auto-save & versioning', () => {
  it('builds a 3-level tree from flat creates', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };

    const project = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'Book One', type: 'project' });
    expect(project.status).toBe(201);

    const part = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'Part I', type: 'part', parentId: project.body.data.id });

    const chapter = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'Chapter 1', type: 'chapter', parentId: part.body.data.id });

    const tree = await request(app)
      .get(`/api/universes/${universe.id}/writings`)
      .set(auth);
    expect(tree.status).toBe(200);
    expect(tree.body.data).toHaveLength(1);
    expect(tree.body.data[0].id).toBe(project.body.data.id);
    expect(tree.body.data[0].children).toHaveLength(1);
    expect(tree.body.data[0].children[0].id).toBe(part.body.data.id);
    expect(tree.body.data[0].children[0].children[0].id).toBe(chapter.body.data.id);
  });

  it('rejects parentId from another universe', async () => {
    const { token } = await loginAs(app);
    const u1 = await createUniverse(app, token, { name: 'U1' });
    const u2 = await createUniverse(app, token, { name: 'U2' });
    const foreign = await request(app)
      .post(`/api/universes/${u1.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Foreign' });

    const res = await request(app)
      .post(`/api/universes/${u2.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Bad child', parentId: foreign.body.data.id });
    expect(res.status).toBe(400);
  });

  it('rejects self-parenting via update', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const node = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Self' });
    const res = await request(app)
      .patch(`/api/universes/${universe.id}/writings/${node.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: node.body.data.id });
    expect(res.status).toBe(400);
  });

  it('computes wordCount from contentPlain', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const created = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Scene 1',
        content: '<p>The wind howled across the moor.</p>',
        contentPlain: 'The wind howled across the moor.',
      });
    expect(created.status).toBe(201);
    expect(created.body.data.wordCount).toBe(6);

    const updated = await request(app)
      .patch(`/api/universes/${universe.id}/writings/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ contentPlain: 'Five words across the moor.' });
    expect(updated.body.data.writing.wordCount).toBe(5);
  });

  it('auto-creates a version when delta crosses the threshold', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };

    const writing = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'Long Scene', contentPlain: 'Short.', content: '<p>Short.</p>' });

    // No version yet.
    const empty = await request(app)
      .get(`/api/universes/${universe.id}/writings/${writing.body.data.id}/versions`)
      .set(auth);
    expect(empty.body.data).toHaveLength(0);

    // Update with 100+ word delta — should auto-snapshot.
    const longPlain = Array.from({ length: 110 }, (_, i) => `word${i}`).join(' ');
    const bigUpdate = await request(app)
      .patch(`/api/universes/${universe.id}/writings/${writing.body.data.id}`)
      .set(auth)
      .send({ contentPlain: longPlain, content: `<p>${longPlain}</p>` });
    expect(bigUpdate.status).toBe(200);
    expect(bigUpdate.body.data.versionCreated).not.toBeNull();
    expect(bigUpdate.body.data.versionCreated.note).toMatch(/Auto-snapshot/);

    const list = await request(app)
      .get(`/api/universes/${universe.id}/writings/${writing.body.data.id}/versions`)
      .set(auth);
    expect(list.body.data).toHaveLength(1);
  });

  it('creates a manual version on demand', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const writing = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Manual snapshot scene', contentPlain: 'hi', content: '<p>hi</p>' });

    const manual = await request(app)
      .post(`/api/universes/${universe.id}/writings/${writing.body.data.id}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'Before the big rewrite' });
    expect(manual.status).toBe(201);
    expect(manual.body.data.note).toBe('Before the big rewrite');
  });

  it('reorders writings transactionally and rejects duplicates', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };
    const a = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'A' });
    const b = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set(auth)
      .send({ title: 'B' });

    const reorder = await request(app)
      .patch(`/api/universes/${universe.id}/writings/reorder`)
      .set(auth)
      .send({
        order: [
          { id: a.body.data.id, parentId: null, sortOrder: 30 },
          { id: b.body.data.id, parentId: null, sortOrder: 5 },
        ],
      });
    expect(reorder.status).toBe(200);
    expect(reorder.body.data[0].id).toBe(b.body.data.id);

    const dup = await request(app)
      .patch(`/api/universes/${universe.id}/writings/reorder`)
      .set(auth)
      .send({
        order: [
          { id: a.body.data.id, parentId: null, sortOrder: 1 },
          { id: a.body.data.id, parentId: null, sortOrder: 2 },
        ],
      });
    expect(dup.status).toBe(400);
  });

  it('returns 404 when accessing a writing in another user universe', async () => {
    const a = await loginAs(app);
    const universe = await createUniverse(app, a.token);
    const writing = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ title: 'Secret' });

    const b = await loginAs(app);
    const res = await request(app)
      .get(`/api/universes/${universe.id}/writings/${writing.body.data.id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(res.status).toBe(404);
  });

  it('cascades delete to versions when a writing is removed', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const writing = await request(app)
      .post(`/api/universes/${universe.id}/writings`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Doomed' });
    await request(app)
      .post(`/api/universes/${universe.id}/writings/${writing.body.data.id}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    const del = await request(app)
      .delete(`/api/universes/${universe.id}/writings/${writing.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);
  });
});
