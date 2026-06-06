import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

describe('Timeline events', () => {
  it('auto-assigns sortOrder, supports reorder', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const auth = { Authorization: `Bearer ${token}` };

    const a = await request(app)
      .post(`/api/universes/${universe.id}/timeline-events`)
      .set(auth)
      .send({ title: 'Founding', date: 'Year 0' });
    expect(a.body.data.sortOrder).toBe(10);

    const b = await request(app)
      .post(`/api/universes/${universe.id}/timeline-events`)
      .set(auth)
      .send({ title: 'First War', date: 'Year 102' });
    expect(b.body.data.sortOrder).toBe(20);

    // Reorder: swap
    const reorder = await request(app)
      .patch(`/api/universes/${universe.id}/timeline-events/reorder`)
      .set(auth)
      .send({
        order: [
          { id: a.body.data.id, sortOrder: 30 },
          { id: b.body.data.id, sortOrder: 5 },
        ],
      });
    expect(reorder.status).toBe(200);
    expect(reorder.body.data[0].id).toBe(b.body.data.id);
    expect(reorder.body.data[1].id).toBe(a.body.data.id);
  });

  it('rejects duplicate ids in reorder payload', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const ev = await request(app)
      .post(`/api/universes/${universe.id}/timeline-events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'X', date: 'Year 1' });
    const res = await request(app)
      .patch(`/api/universes/${universe.id}/timeline-events/reorder`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        order: [
          { id: ev.body.data.id, sortOrder: 1 },
          { id: ev.body.data.id, sortOrder: 2 },
        ],
      });
    expect(res.status).toBe(400);
  });
});
