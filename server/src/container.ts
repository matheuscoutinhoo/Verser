import type { PrismaClient } from '@prisma/client';
import { env, isTest } from './config/env';
import { prisma as defaultPrisma } from './config/database';
import { logger } from './config/logger';
import { AIController } from './layers/controllers/ai.controller';
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
import { AIUsageLogRepository } from './layers/repositories/ai-usage-log.repository';
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
import { AIService } from './layers/services/ai.service';
import { ContextBuilderService } from './layers/services/context-builder.service';
import { PromptBuilderService } from './layers/services/prompt-builder.service';
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
import { UserStatsService } from './layers/services/user-stats.service';
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
  aiUsageLogRepo: AIUsageLogRepository;

  // Services
  tokenService: TokenService;
  authService: AuthService;
  userService: UserService;
  userStatsService: UserStatsService;
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
  contextBuilder: ContextBuilderService;
  promptBuilder: PromptBuilderService;
  aiService: AIService;

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
  aiController: AIController;

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
  const aiUsageLogRepo = new AIUsageLogRepository(prisma);

  // Services
  const tokenService = new TokenService();
  const authService = new AuthService(userRepo, sessionRepo, tokenService);
  const userService = new UserService(userRepo, sessionRepo);
  const userStatsService = new UserStatsService(prisma);
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
  const contextBuilder = new ContextBuilderService({
    universeRepo,
    characterRepo,
    locationRepo,
    systemRepo: worldSystemRepo,
    loreRepo: loreEntryRepo,
    lawRepo: immutableLawRepo,
  });
  const promptBuilder = new PromptBuilderService();

  // Providers
  // Auto-fall back to MockAIProvider whenever ABACUS_AI_API_KEY is missing so the
  // app stays runnable in dev/CI without credentials.
  const aiProvider: IAIProvider =
    overrides.aiProvider ??
    (isTest || !env.ABACUS_AI_API_KEY ? new MockAIProvider() : new AbacusAIProvider());
  if (!isTest && !env.ABACUS_AI_API_KEY) {
    logger.warn('ABACUS_AI_API_KEY not set — falling back to MockAIProvider for AI calls');
  }
  const storageProvider: IStorageProvider =
    overrides.storageProvider ?? new LocalStorageProvider();

  const aiService = new AIService({
    provider: aiProvider,
    usageLogRepo: aiUsageLogRepo,
    universeRepo,
    contextBuilder,
    promptBuilder,
  });

  // Controllers
  const authController = new AuthController(authService);
  const userController = new UserController(userService, userStatsService);
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
  const aiController = new AIController(aiService);

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
    aiUsageLogRepo,
    tokenService,
    authService,
    userService,
    userStatsService,
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
    contextBuilder,
    promptBuilder,
    aiService,
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
    aiController,
    aiProvider,
    storageProvider,
  };
}
