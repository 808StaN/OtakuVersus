import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { categoriesController, difficultiesController, titlesController } from './anime-scenes.controller';
import { emptySchema } from './anime-scenes.schemas';

const animeScenesRouter = Router();

animeScenesRouter.get('/categories', validate(emptySchema), asyncHandler(categoriesController));
animeScenesRouter.get('/difficulties', validate(emptySchema), asyncHandler(difficultiesController));
animeScenesRouter.get('/titles', validate(emptySchema), asyncHandler(titlesController));

export { animeScenesRouter };
