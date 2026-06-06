import type { Request, Response } from 'express';
import { ValidationError } from '../../errors';
import type { IStorageProvider } from '../../providers/storage/types';
import type { CharacterService } from '../services/character.service';
import type { LocationService } from '../services/location.service';
import type { UniverseService } from '../services/universe.service';
import { jsonOk, requireUniverse, requireUser } from './controller-helpers';

export class UploadController {
  constructor(
    private readonly storage: IStorageProvider,
    private readonly universeService: UniverseService,
    private readonly characterService: CharacterService,
    private readonly locationService: LocationService,
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

  uploadCharacterImage = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    if (!req.file) throw new ValidationError('No file uploaded');
    const stored = await this.storage.write({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      ownerId: user.id,
    });
    const character = await this.characterService.setImageUrl(
      universe.id,
      req.params.id as string,
      stored.url,
    );
    jsonOk(res, { character, file: stored });
  };

  uploadLocationImage = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const universe = requireUniverse(req);
    if (!req.file) throw new ValidationError('No file uploaded');
    const stored = await this.storage.write({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      ownerId: user.id,
    });
    const location = await this.locationService.setImageUrl(
      universe.id,
      req.params.id as string,
      stored.url,
    );
    jsonOk(res, { location, file: stored });
  };
}
