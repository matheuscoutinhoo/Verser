import { resolve } from 'node:path';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import request from 'supertest';
import { buildTestApp } from '../helpers/test-app';
import { createUniverse, loginAs } from '../helpers/universe-helpers';

const { app } = buildTestApp();

const PNG_1x1 = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63600100000005000119cb0c1c0000000049454e44ae426082',
  'hex',
);

const TXT = Buffer.from('not-an-image');

const uploadDir = resolve(process.cwd(), './uploads');

describe('Image uploads', () => {
  afterAll(() => {
    if (existsSync(uploadDir)) {
      for (const entry of readdirSync(uploadDir)) {
        if (entry === '.gitkeep') continue;
        rmSync(resolve(uploadDir, entry), { recursive: true, force: true });
      }
    }
  });

  it('uploads a universe cover image', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post(`/api/universes/${universe.id}/cover`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_1x1, { filename: 'cover.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.data.universe.coverUrl).toMatch(/^\/uploads\//);
    expect(res.body.data.file.mimeType).toBe('image/png');
  });

  it('rejects non-image uploads with 400', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const res = await request(app)
      .post(`/api/universes/${universe.id}/cover`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', TXT, { filename: 'evil.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('uploads a character image and updates the row', async () => {
    const { token } = await loginAs(app);
    const universe = await createUniverse(app, token);
    const char = await request(app)
      .post(`/api/universes/${universe.id}/characters`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Portrait' });

    const res = await request(app)
      .post(`/api/universes/${universe.id}/characters/${char.body.data.id}/image`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', PNG_1x1, { filename: 'face.png', contentType: 'image/png' });
    expect(res.status).toBe(200);
    expect(res.body.data.character.imageUrl).toMatch(/^\/uploads\//);
  });
});
