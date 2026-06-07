import { Router, type RequestHandler } from 'express';
import {
  createWritingSchema,
  createWritingVersionSchema,
  idParamSchema,
  paginationSchema,
  reorderTimelineSchema,
  reorderWritingsSchema,
  updateCharacterRelationSchema,
  updateCharacterSchema,
  updateImmutableLawSchema,
  updateLocationSchema,
  updateLoreEntrySchema,
  updateTimelineEventSchema,
  updateWorldSystemSchema,
  updateWritingSchema,
  upsertCharacterRelationSchema,
  upsertCharacterSchema,
  upsertImmutableLawSchema,
  upsertLocationSchema,
  upsertLoreEntrySchema,
  upsertTimelineEventSchema,
  upsertUniverseTagSchema,
  upsertWorldSystemSchema,
} from '@verser/shared';
import type { Container } from '../../container';
import { asyncHandler } from '../../utils/async-handler';
import { imageUpload } from '../middlewares/upload.middleware';
import { validate } from '../middlewares/validate.middleware';

export function createUniverseChildrenRouter(
  container: Container,
  authenticate: RequestHandler,
  universeAccess: RequestHandler,
): Router {
  // Express 5 routers don't merge params by default in older signatures; mergeParams ensures :universeId is available.
  const router = Router({ mergeParams: true });
  router.use(authenticate, universeAccess);

  const {
    characterController: ch,
    characterRelationController: rel,
    locationController: loc,
    worldSystemController: sys,
    loreEntryController: lore,
    immutableLawController: law,
    timelineEventController: tl,
    universeTagController: tag,
    uploadController: up,
    writingController: wr,
  } = container;

  // ── Cover image upload ─────────────────────────
  router.post('/cover', imageUpload.single('file'), asyncHandler(up.uploadCover));

  // ── Characters ─────────────────────────────────
  router.get('/characters', validate(paginationSchema, 'query'), asyncHandler(ch.list));
  router.post('/characters', validate(upsertCharacterSchema), asyncHandler(ch.create));
  router.get(
    '/characters/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(ch.detail),
  );
  router.patch(
    '/characters/:id',
    validate(idParamSchema, 'params'),
    validate(updateCharacterSchema),
    asyncHandler(ch.update),
  );
  router.delete(
    '/characters/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(ch.delete),
  );
  router.post(
    '/characters/:id/image',
    validate(idParamSchema, 'params'),
    imageUpload.single('file'),
    asyncHandler(up.uploadCharacterImage),
  );

  // ── Character relations ────────────────────────
  router.get('/character-relations', asyncHandler(rel.list));
  router.post(
    '/character-relations',
    validate(upsertCharacterRelationSchema),
    asyncHandler(rel.create),
  );
  router.patch(
    '/character-relations/:id',
    validate(idParamSchema, 'params'),
    validate(updateCharacterRelationSchema),
    asyncHandler(rel.update),
  );
  router.delete(
    '/character-relations/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(rel.delete),
  );

  // ── Locations ──────────────────────────────────
  router.get('/locations', validate(paginationSchema, 'query'), asyncHandler(loc.list));
  router.post('/locations', validate(upsertLocationSchema), asyncHandler(loc.create));
  router.get(
    '/locations/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(loc.detail),
  );
  router.patch(
    '/locations/:id',
    validate(idParamSchema, 'params'),
    validate(updateLocationSchema),
    asyncHandler(loc.update),
  );
  router.delete(
    '/locations/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(loc.delete),
  );
  router.post(
    '/locations/:id/image',
    validate(idParamSchema, 'params'),
    imageUpload.single('file'),
    asyncHandler(up.uploadLocationImage),
  );

  // ── World systems ──────────────────────────────
  router.get('/systems', validate(paginationSchema, 'query'), asyncHandler(sys.list));
  router.post('/systems', validate(upsertWorldSystemSchema), asyncHandler(sys.create));
  router.get(
    '/systems/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(sys.detail),
  );
  router.patch(
    '/systems/:id',
    validate(idParamSchema, 'params'),
    validate(updateWorldSystemSchema),
    asyncHandler(sys.update),
  );
  router.delete(
    '/systems/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(sys.delete),
  );
  router.post(
    '/systems/:id/image',
    validate(idParamSchema, 'params'),
    imageUpload.single('file'),
    asyncHandler(up.uploadSystemImage),
  );

  // ── Lore entries ───────────────────────────────
  router.get('/lore-entries', validate(paginationSchema, 'query'), asyncHandler(lore.list));
  router.post('/lore-entries', validate(upsertLoreEntrySchema), asyncHandler(lore.create));
  router.get(
    '/lore-entries/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(lore.detail),
  );
  router.patch(
    '/lore-entries/:id',
    validate(idParamSchema, 'params'),
    validate(updateLoreEntrySchema),
    asyncHandler(lore.update),
  );
  router.delete(
    '/lore-entries/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(lore.delete),
  );

  // ── Immutable laws ─────────────────────────────
  router.get('/immutable-laws', asyncHandler(law.list));
  router.post('/immutable-laws', validate(upsertImmutableLawSchema), asyncHandler(law.create));
  router.patch(
    '/immutable-laws/:id',
    validate(idParamSchema, 'params'),
    validate(updateImmutableLawSchema),
    asyncHandler(law.update),
  );
  router.delete(
    '/immutable-laws/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(law.delete),
  );

  // ── Timeline events ────────────────────────────
  router.get('/timeline-events', asyncHandler(tl.list));
  router.post('/timeline-events', validate(upsertTimelineEventSchema), asyncHandler(tl.create));
  router.patch(
    '/timeline-events/reorder',
    validate(reorderTimelineSchema),
    asyncHandler(tl.reorder),
  );
  router.patch(
    '/timeline-events/:id',
    validate(idParamSchema, 'params'),
    validate(updateTimelineEventSchema),
    asyncHandler(tl.update),
  );
  router.delete(
    '/timeline-events/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(tl.delete),
  );

  // ── Tags ───────────────────────────────────────
  router.get('/tags', asyncHandler(tag.list));
  router.post('/tags', validate(upsertUniverseTagSchema), asyncHandler(tag.create));
  router.delete('/tags/:id', validate(idParamSchema, 'params'), asyncHandler(tag.delete));

  // ── Writings (hierarchical tree) ───────────────
  router.get('/writings', asyncHandler(wr.tree));
  router.post('/writings', validate(createWritingSchema), asyncHandler(wr.create));
  router.patch(
    '/writings/reorder',
    validate(reorderWritingsSchema),
    asyncHandler(wr.reorder),
  );
  router.get(
    '/writings/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(wr.detail),
  );
  router.patch(
    '/writings/:id',
    validate(idParamSchema, 'params'),
    validate(updateWritingSchema),
    asyncHandler(wr.update),
  );
  router.delete(
    '/writings/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(wr.delete),
  );
  router.get(
    '/writings/:id/versions',
    validate(idParamSchema, 'params'),
    asyncHandler(wr.listVersions),
  );
  router.post(
    '/writings/:id/versions',
    validate(idParamSchema, 'params'),
    validate(createWritingVersionSchema),
    asyncHandler(wr.createVersion),
  );

  return router;
}
