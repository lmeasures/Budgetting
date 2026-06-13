import Joi from 'joi';

export const budgetItemCreateSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().max(1000),
  value: Joi.number().required().positive().precision(2),
  cycleType: Joi.string().required().valid('daily', 'weekly', 'monthly'),
  startDate: Joi.date().required().iso(),
  endDate: Joi.date().optional().iso().min(Joi.ref('startDate')),
});

export const budgetItemUpdateSchema = Joi.object({
  name: Joi.string().optional().min(1).max(255),
  description: Joi.string().optional().max(1000),
  value: Joi.number().optional().positive().precision(2),
  cycleType: Joi.string().optional().valid('daily', 'weekly', 'monthly'),
  startDate: Joi.date().optional().iso(),
  endDate: Joi.date().optional().iso(),
}).min(1);

export const budgetItemDeleteSchema = Joi.object({
  endDate: Joi.date().required().iso(),
  hardDelete: Joi.boolean().optional().default(false),
});

export const budgetItemMarkPaidSchema = Joi.object({
  paidDate: Joi.date().optional().iso(),
});

export const settingsUpdateSchema = Joi.object({
  payCycle: Joi.string().optional().valid('weekly', 'biweekly', 'monthly'),
  estimatedPay: Joi.number().optional().positive(),
  expectedPayDate: Joi.number().optional().min(1).max(27),
  darkModeEnabled: Joi.boolean().optional(),
  hideValues: Joi.boolean().optional(),
  currency: Joi.string().optional().length(3),
}).min(1);

export const authLoginSchema = Joi.object({
  passphrase: Joi.string().required().min(8),
});

export const syncUploadSchema = Joi.object({
  changes: Joi.array().items(
    Joi.object({
      type: Joi.string().required().valid('budgetItem', 'setting', 'user'),
      operation: Joi.string().required().valid('create', 'update', 'delete'),
      id: Joi.string().required().uuid(),
      data: Joi.object().optional(),
      clientUpdatedAt: Joi.date().optional().iso(),
      clientId: Joi.string().optional(),
    })
  ).required().min(1).max(100),
});

export const paginationSchema = Joi.object({
  limit: Joi.number().optional().min(1).max(100).default(50),
  offset: Joi.number().optional().min(0).default(0),
  sortBy: Joi.string().optional().valid('name', 'startDate', 'value', 'frequency', 'createdAt').default('startDate'),
  sortOrder: Joi.string().optional().valid('asc', 'desc').default('desc'),
  active: Joi.boolean().optional().default(true),
  cycleType: Joi.string().optional().valid('daily', 'weekly', 'monthly'),
});
