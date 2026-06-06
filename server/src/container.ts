import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './config/database';
import { isTest } from './config/env';
import { AuthController } from './layers/controllers/auth.controller';
import { CharacterController } from './layers/controllers/character.controller';
import { CharacterRelationController } from './layers/controllers/character-relation.controller';
import { ImmutableLawController } from './layers/controllers/immutable-law.controller';
import { LocationController } from './layers/controllers/location.controller';
import { LoreEntryController } from './layers/controllers/lore-entry.controller';
import { TimelineEventController } from './layers/controllers/timeline-event.controller';
import { UniverseController } from './layers/controllers/universe.controller';
import { UniverseTagController } from './layers/controllers/universe-tag.controller';
import { UploadController } from './layers/controllers/upload.controller';
import { UserController } from './layers/controllers/user.controller';
import { WorldSystemController } from './layers/controllers/world-system.controller';
import { WritingController } from './layers/controllers/writing.controller';
import { CharacterRepository } from './layers/repositories/character.repository';
import { CharacterRelationRepository } from './layers/repositories/character-relation.repository';
import { ImmutableLawRepository } from './layers/repositories/immutable-law.repository';
import { LocationRepository } from './layers/repositories/location.repository';
import { LoreEntryRepository } from './layers/repositories/lore-entry.repository';
import { SessionRepository } from './layers/repositories/session.repository';
import { TimelineEventRepository } from './layers/repositories/timeline-event.repository';
import { UniverseRepository } from './layers/repositories/universe.repository';
import { UniverseTagRepository } from './layers/repositories/universe-tag.repository';
import { UserRepository } from './layers/repositories/user.repository';
import { WorldSystemRepository } from './layers/repositories/world-system.repository';
import { WritingRepository } from './layers/repositories/writing.repository';
import { WritingVersionRepository } from './layers/repositories/writing-version.repository';
import { AuthService } from './layers/services/auth.service';
import { CharacterService } from './layers/services/character.service';
import { CharacterRelationService } from './layers/services/character-relation.service';
import { ImmutableLawService } from './layers/services/immutable-law.service';
import { LocationService } from './layers/services/location.service';
import { LoreEntryService } from './layers/services/lore-entry.service';
import { TimelineEventService } from './layers/services/timeline-event.service';
import { TokenService } from './layers/services/token.service';
import { UniverseService } from './layers/services/universe.service';
import { UniverseTagService } from './layers/services/universe-tag.service';
import { UserService } from './layers/services/user.service';
import { WorldSystemService } from './layers/services/world-system.service';
import { WritingService } from './layers/services/writing.service';
import { AbacusAIProvider } from './providers/ai/abacus-ai.provider';
import { MockAIProvider } from './providers/ai/mock-ai.provider';
import type { IAIProvider } from './providers/ai/types';
import { LocalStorageProvider } from './providers/storage/local-storage.provider';
import type { IStorageProvider } from './providers/storage/types';

export interface Container {
  prisma: PrismaClient;

  // Repositories
  userRepo: UserRepository;
  sessionRepo: SessionRepository;
  universeRepo: UniverseRepository;
  characterRepo: CharacterRepository;
  characterRelationRepo: CharacterRelationRepository;
  locationRepo: LocationRepository;
  worldSystemRepo: WorldSystemRepository;
  loreEntryRepo: LoreEntryRepository;
  immutableLawRepo: ImmutableLawRepository;
  timelineEventRepo: TimelineEventRepository;
  universeTagRepo: UniverseTagRepository;
  writingRepo: WritingRepository;
  writingVersionRepo: WritingVersionRepository;

  // Services
  tokenService: TokenService;
  authService: AuthService;
  userService: UserService;
  universeService: UniverseService;
  characterService: CharacterService;
  characterRelationService: CharacterRelationService;
  locationService: LocationService;
  worldSystemService: WorldSystemService;
  loreEntryService: LoreEntryService;
  immutableLawService: ImmutableLawService;
  timelineEventService: TimelineEventService;
  universeTagService: UniverseTagService;
  writingService: WritingService;

  // Controllers
  authController: AuthController;
  userController: UserController;
  universeController: UniverseController;
  characterController: CharacterController;
  characterRelationController: CharacterRelationController;
  locationController: LocationController;
  worldSystemController: WorldSystemController;
  loreEntryController: LoreEntryController;
  immutableLawController: ImmutableLawController;
  timelineEventController: TimelineEventController;
  universeTagController: UniverseTagController;
  uploadController: UploadController;
  writingController: WritingController;

  // Providers
  aiProvider: IAIProvider;
  storageProvider: IStorageProvider;
}

export interface ContainerOverrides {
  prisma?: PrismaClient;
  aiProvider?: IAIProvider;
  storageProvider?: IStorageProvider;
}

export function createContainer(overrides: ContainerOverrides = {}): Container {
  const prisma = overrides.prisma ?? defaultPrisma;

  // Repositories
  const userRepo = new UserRepository(prisma);
  const sessionRepo = new SessionRepository(prisma);
  const universeRepo = new UniverseRepository(prisma);
  const characterRepo = new CharacterRepository(prisma);
  const characterRelationRepo = new CharacterRelationRepository(prisma);
  const locationRepo = new LocationRepository(prisma);
  const worldSystemRepo = new WorldSystemRepository(prisma);
  const loreEntryRepo = new LoreEntryRepository(prisma);
  const immutableLawRepo = new ImmutableLawRepository(prisma);
  const timelineEventRepo = new TimelineEventRepository(prisma);
  const universeTagRepo = new UniverseTagRepository(prisma);
  const writingRepo = new WritingRepository(prisma);
  const writingVersionRepo = new WritingVersionRepository(prisma);

  // Services
  const tokenService = new TokenService();
  const authService = new AuthService(userRepo, sessionRepo, tokenService);
  const userService = new UserService(userRepo, sessionRepo);
  const universeService = new UniverseService(universeRepo);
  const characterService = new CharacterService(characterRepo);
  const characterRelationService = new CharacterRelationService(
    characterRelationRepo,
    characterRepo,
  );
  const locationService = new LocationService(locationRepo);
  const worldSystemService = new WorldSystemService(worldSystemRepo);
  const loreEntryService = new LoreEntryService(loreEntryRepo);
  const immutableLawService = new ImmutableLawService(immutableLawRepo);
  const timelineEventService = new TimelineEventService(timelineEventRepo);
  const universeTagService = new UniverseTagService(universeTagRepo);
  const writingService = new WritingService({ writingRepo, versionRepo: writingVersionRepo });

  // Providers
  const aiProvider: IAIProvider =
    overrides.aiProvider ?? (isTest ? new MockAIProvider() : new AbacusAIProvider());
  const storageProvider: IStorageProvider =
    overrides.storageProvider ?? new LocalStorageProvider();

  // Controllers
  const authController = new AuthController(authService);
  const userController = new UserController(userService);
  const universeController = new UniverseController(universeService);
  const characterController = new CharacterController(characterService);
  const characterRelationController = new CharacterRelationController(characterRelationService);
  const locationController = new LocationController(locationService);
  const worldSystemController = new WorldSystemController(worldSystemService);
  const loreEntryController = new LoreEntryController(loreEntryService);
  const immutableLawController = new ImmutableLawController(immutableLawService);
  const timelineEventController = new TimelineEventController(timelineEventService);
  const universeTagController = new UniverseTagController(universeTagService);
  const uploadController = new UploadController(
    storageProvider,
    universeService,
    characterService,
    locationService,
  );
  const writingController = new WritingController(writingService);

  return {
    prisma,
    userRepo,
    sessionRepo,
    universeRepo,
    characterRepo,
    characterRelationRepo,
    locationRepo,
    worldSystemRepo,
    loreEntryRepo,
    immutableLawRepo,
    timelineEventRepo,
    universeTagRepo,
    writingRepo,
    writingVersionRepo,
    tokenService,
    authService,
    userService,
    universeService,
    characterService,
    characterRelationService,
    locationService,
    worldSystemService,
    loreEntryService,
    immutableLawService,
    timelineEventService,
    universeTagService,
    writingService,
    authController,
    userController,
    universeController,
    characterController,
    characterRelationController,
    locationController,
    worldSystemController,
    loreEntryController,
    immutableLawController,
    timelineEventController,
    universeTagController,
    uploadController,
    writingController,
    aiProvider,
    storageProvider,
  };
}
