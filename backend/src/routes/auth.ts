import { Router } from 'express';
import { validateBody } from '../middleware/validation';
import { ValidatedRequest } from '../middleware/validation';
import { loginRateLimiter } from '../middleware/rateLimit';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLoginSchema } from '../utils/validation';
import { authService } from '../services/authService';
import { generateToken } from '../middleware/authMiddleware';
import logger from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login or create a new user with passphrase
 *     description: Authenticates a user with a passphrase. If X-Client-ID header is provided and user exists, verifies the passphrase. Otherwise creates a new user.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passphrase
 *             properties:
 *               passphrase:
 *                 type: string
 *                 minLength: 4
 *                 description: User passphrase for authentication
 *     parameters:
 *       - in: header
 *         name: X-Client-ID
 *         schema:
 *           type: string
 *         description: Optional client ID for existing users
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiry in seconds
 *                     userId:
 *                       type: string
 *                       description: User ID
 *       400:
 *         description: Invalid passphrase
 *       429:
 *         description: Too many login attempts
 */
router.post(
  '/login',
  loginRateLimiter,
  validateBody(authLoginSchema),
  asyncHandler(async (req: ValidatedRequest, res) => {
    const { passphrase } = req.validatedBody as { passphrase: string };

    // In a real app, the client would send a userId or phone to identify themselves
    // For MVP, we'll create a new user or get from request
    const clientId = req.headers['x-client-id'] as string;

    let userId: string;

    if (clientId) {
      const exists = await authService.userExists(clientId);
      if (exists) {
        userId = clientId;
        // Verify passphrase
        const isValid = await authService.authenticate(userId, passphrase);
        if (!isValid) {
          logger.warn('Login failed: invalid passphrase', { userId });
          throw new AppError('INVALID_TOKEN', 401, 'Invalid passphrase');
        }
      } else {
        // Create new user
        userId = await authService.createUser();
        await authService.setPassphrase(userId, passphrase);
      }
    } else {
      // Create new user
      userId = await authService.createUser();
      await authService.setPassphrase(userId, passphrase);
    }

    const token = generateToken(userId, clientId);

    res.status(200).json({
      data: {
        token,
        expiresIn: 86400,
        userId,
      },
    });
  })
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout endpoint (no-op on server, token invalidation handled client-side)
 *     tags:
 *       - Authentication
 *     responses:
 *       204:
 *         description: Logout successful
 */
router.post('/logout', (_req, res) => {
  res.status(204).send();
});

export default router;
