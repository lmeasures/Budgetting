import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import logger from '../utils/logger';
import { AppError } from './errorHandler';

export interface ValidatedRequest extends Request {
  validatedBody?: Record<string, unknown>;
  validatedQuery?: Record<string, unknown>;
  validatedParams?: Record<string, unknown>;
}

export const validateBody =
  (schema: Schema) =>
    (req: ValidatedRequest, _res: Response, next: NextFunction): void => {
      try {
        const { value, error } = schema.validate(req.body, {
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }));

          logger.warn('Body validation failed', { details });
          throw new AppError('VALIDATION_ERROR', 400, 'Request validation failed', { details });
        }

        req.validatedBody = value;
        next();
      } catch (err) {
        next(err);
      }
    };

export const validateQuery =
  (schema: Schema) =>
    (req: ValidatedRequest, _res: Response, next: NextFunction): void => {
      try {
        const { value, error } = schema.validate(req.query, {
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }));

          logger.warn('Query validation failed', { details });
          throw new AppError('VALIDATION_ERROR', 400, 'Request validation failed', { details });
        }

        req.validatedQuery = value;
        next();
      } catch (err) {
        next(err);
      }
    };

export const validateParams =
  (schema: Schema) =>
    (req: ValidatedRequest, _res: Response, next: NextFunction): void => {
      try {
        const { value, error } = schema.validate(req.params, {
          stripUnknown: true,
          convert: true,
        });

        if (error) {
          const details = error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value,
          }));

          logger.warn('Params validation failed', { details });
          throw new AppError('VALIDATION_ERROR', 400, 'Request validation failed', { details });
        }

        req.validatedParams = value;
        next();
      } catch (err) {
        next(err);
      }
    };
