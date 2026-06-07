import type { Request, Response } from 'express';
import { ValidationError } from '../../errors';
import type { IStorageProvider } from '../../providers/storage/types';
import type { CharacterService } from '../services/character.service';
import type { ImmutableLawService } from '../services/immutable-law.service';
import type { LocationService } from '../services/location.service';
import type { LoreEntryService } from '../services/lore-entry.service';
import type { UniverseService } from '../services/universe.service';
import type { WorldSystemService } from '../services/world-system.service';
import { jsonOk, requireUniverse, requireUser } from './controller-helpers';

export class UploadController {
  constructor(
    private readonly storage: IStorageProvider,
    private readonly universeService: UniverseService,
    private readonly characterService: CharacterService,
    private readonly locationService: LocationService,
    private readonly worldSystemService: WorldSystemService,
    private readonly loreEntryService: LoreEntryService,
    private readonly immutableLawService: ImmutableLawService,
  ) {}

  uploadCover = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    if (!req.file) throw new ValidationError('No file uploaded');
    const stored = await this.storage.write({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      ownerId: user.id,
    });
    const updated = await this.universeService.update(user.id, universe.id, {
      coverUrl: stored.url,
    });
    jsonOk(res, { universe: updated, file: stored });
  };

  // Generic helper: every entity upload writes the file with the same
  // storage call. Wraps the per-entity setImageUrl + response envelope so
  // the controller stays a thin one-liner per route.
  private async storeAndApply<T>(
    req: Request,
    apply: (universeId: string, id: string, url: string) => Promise<T>,
  ): Promise<{ entity: T; file: Awaited<ReturnType<IStorageProvider['write']>> }> {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    if (!req.file) throw new ValidationError('No file uploaded');
    const stored = await this.storage.write({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      ownerId: user.id,
    });
    const entity = await apply(universe.id, req.params.id as string, stored.url);
    return { entity, file: stored };
  }

  uploadCharacterImage = async (req: Request, res: Response): Promise<void> => {
    const { entity: character, file } = await this.storeAndApply(req, (uid, id, url) =>
      this.characterService.setImageUrl(uid, id, url),
    );
    jsonOk(res, { character, file });
  };

  uploadLocationImage = async (req: Request, res: Response): Promise<void> => {
    const { entity: location, file } = await this.storeAndApply(req, (uid, id, url) =>
      this.locationService.setImageUrl(uid, id, url),
    );
    jsonOk(res, { location, file });
  };

  uploadSystemImage = async (req: Request, res: Response): Promise<void> => {
    const { entity: system, file } = await this.storeAndApply(req, (uid, id, url) =>
      this.worldSystemService.setImageUrl(uid, id, url),
    );
    jsonOk(res, { system, file });
  };

  uploadLoreImage = async (req: Request, res: Response): Promise<void> => {
    const { entity: lore, file } = await this.storeAndApply(req, (uid, id, url) =>
      this.loreEntryService.setImageUrl(uid, id, url),
    );
    jsonOk(res, { lore, file });
  };

  uploadLawImage = async (req: Request, res: Response): Promise<void> => {
    const { entity: law, file } = await this.storeAndApply(req, (uid, id, url) =>
      this.immutableLawService.setImageUrl(uid, id, url),
    );
    jsonOk(res, { law, file });
  };
}
