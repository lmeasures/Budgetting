import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { validateBody, ValidatedRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { settingsUpdateSchema } from '../utils/validation';
import { settingsService } from '../services/settingsService';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /settings
 * Get user settings
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;

    const settings = await settingsService.getSettings(userId);

    res.status(200).json({ data: settings });
  })
);

/**
 * PUT /settings
 * Update user settings
 */
router.put(
  '/',
  validateBody(settingsUpdateSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const data = req.validatedBody as Record<string, unknown>;

    const settings = await settingsService.updateSettings(userId, {
      payCycle: data.payCycle as any,
      estimatedPay: data.estimatedPay as number,
      expectedPayDate: data.expectedPayDate as number,
      darkModeEnabled: data.darkModeEnabled as boolean,
      hideValues: data.hideValues as boolean,
      currency: data.currency as string,
    } as any);

    res.status(200).json({ data: settings });
  })
);

export default router;
