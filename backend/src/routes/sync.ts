import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { syncRateLimiter } from '../middleware/rateLimit';
import { validateBody, ValidatedRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { syncUploadSchema } from '../utils/validation';
import { syncService } from '../services/syncService';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /sync/status
 * Get current sync status
 */
router.get(
  '/status',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;

    const status = await syncService.getSyncStatus(userId);

    res.status(200).json({ data: status });
  })
);

/**
 * POST /sync/upload
 * Upload changes from client to server
 */
router.post(
  '/upload',
  syncRateLimiter,
  validateBody(syncUploadSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const data = req.validatedBody as { changes: any[] };

    const result = await syncService.uploadChanges(userId, data.changes);

    res.status(200).json({ data: result });
  })
);

/**
 * GET /sync/download
 * Download changes from server to client
 */
router.get(
  '/download',
  syncRateLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;

    const result = await syncService.downloadChanges(userId, since);

    res.status(200).json({ data: result });
  })
);

export default router;
