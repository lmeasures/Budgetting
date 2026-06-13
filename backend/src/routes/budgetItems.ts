import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { validateBody, validateQuery, ValidatedRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import {
  budgetItemCreateSchema,
  budgetItemUpdateSchema,
  budgetItemDeleteSchema,
  budgetItemMarkPaidSchema,
  paginationSchema,
} from '../utils/validation';
import { budgetItemService } from '../services/budgetItemService';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /budget-items
 * List budget items for authenticated user
 */
router.get(
  '/',
  validateQuery(paginationSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const query = req.validatedQuery as Record<string, unknown>;

    const result = await budgetItemService.getBudgetItems(userId, {
      limit: query.limit as number,
      offset: query.offset as number,
      sortBy: query.sortBy as string,
      sortOrder: query.sortOrder as 'asc' | 'desc',
      active: query.active as boolean,
      cycleType: query.cycleType as string,
    });

    res.status(200).json({
      data: result.items,
      pagination: {
        total: result.total,
        limit: (query.limit as number) || 50,
        offset: (query.offset as number) || 0,
        hasMore: (result.total - ((query.offset as number) || 0) - ((query.limit as number) || 50)) > 0,
      },
    });
  })
);

/**
 * GET /budget-items/:id
 * Get single budget item
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;

    const item = await budgetItemService.getBudgetItem(userId, itemId);

    res.status(200).json({ data: item });
  })
);

/**
 * POST /budget-items
 * Create budget item
 */
router.post(
  '/',
  validateBody(budgetItemCreateSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const data = req.validatedBody as Record<string, unknown>;

    const item = await budgetItemService.createBudgetItem(userId, {
      name: data.name as string,
      description: data.description as string,
      value: data.value as number,
      cycleType: data.cycleType as any,
      startDate: new Date(data.startDate as string),
      endDate: data.endDate ? new Date(data.endDate as string) : undefined,
    });

    res.status(201).json({ data: item });
  })
);

/**
 * PUT /budget-items/:id
 * Update budget item
 */
router.put(
  '/:id',
  validateBody(budgetItemUpdateSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    const data = req.validatedBody as Record<string, unknown>;

    const item = await budgetItemService.updateBudgetItem(userId, itemId, {
      name: data.name as string,
      description: data.description as string,
      value: data.value as number,
      cycleType: data.cycleType as any,
      startDate: data.startDate ? new Date(data.startDate as string) : undefined,
      endDate: data.endDate ? new Date(data.endDate as string) : undefined,
    });

    res.status(200).json({ data: item });
  })
);

/**
 * DELETE /budget-items/:id
 * Soft delete budget item
 */
router.delete(
  '/:id',
  validateBody(budgetItemDeleteSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    const data = req.validatedBody as Record<string, unknown>;

    await budgetItemService.deleteBudgetItem(userId, itemId, new Date(data.endDate as string));

    res.status(200).json({
      data: {
        id: itemId,
        isActive: false,
        endDate: data.endDate,
      },
    });
  })
);

/**
 * POST /budget-items/:id/mark-paid
 * Mark budget item as paid
 */
router.post(
  '/:id/mark-paid',
  validateBody(budgetItemMarkPaidSchema),
  asyncHandler(async (req: ValidatedRequest & AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const itemId = req.params.id;
    const data = req.validatedBody as Record<string, unknown>;

    const item = await budgetItemService.markAsPaid(
      userId,
      itemId,
      data.paidDate ? new Date(data.paidDate as string) : undefined
    );

    res.status(200).json({ data: item });
  })
);

/**
 * GET /budget-items/period/:periodStart/:periodEnd
 * Get budget items for period
 */
router.get(
  '/period/:periodStart/:periodEnd',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const periodStart = new Date(req.params.periodStart);
    const periodEnd = new Date(req.params.periodEnd);

    const result = await budgetItemService.getBudgetItemsForPeriod(userId, periodStart, periodEnd);

    res.status(200).json({
      data: {
        period: {
          start: periodStart,
          end: periodEnd,
        },
        items: result.items,
        totalExpected: result.totalExpected,
        totalPaid: result.totalPaid,
        remaining: result.remaining,
      },
    });
  })
);

export default router;
