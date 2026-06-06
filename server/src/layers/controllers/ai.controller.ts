import type { Request, Response } from 'express';
import type { AIService } from '../services/ai.service';
import { jsonOk, requireUser } from './controller-helpers';

export class AIController {
  constructor(private readonly service: AIService) {}

  generateText = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await this.service.generateText(user.id, req.body);
    jsonOk(res, result);
  };

  generateImage = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await this.service.generateImage(user.id, req.body);
    jsonOk(res, result);
  };

  analyzeConsistency = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await this.service.analyzeConsistency(user.id, req.body);
    jsonOk(res, result);
  };

  assistCreation = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const result = await this.service.assistCreation(user.id, req.body);
    jsonOk(res, result);
  };

  usage = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const usage = await this.service.getUsage(user.id);
    jsonOk(res, usage);
  };
}
