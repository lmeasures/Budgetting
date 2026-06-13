import { errorHandler, AppError, asyncHandler } from '../errorHandler';
import { Request, Response, NextFunction } from 'express';

describe('ErrorHandler Middleware', () => {
  describe('AppError', () => {
    it('should create an error with code, status, and message', () => {
      const error = new AppError('TEST_ERROR', 400, 'Test message');

      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test message');
    });

    it('should include details if provided', () => {
      const details = { field: 'value' };
      const error = new AppError('TEST_ERROR', 400, 'Test message', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('errorHandler middleware', () => {
    let req: Request;
    let res: Response;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
      req = {} as Request;
      res = {} as Response;
      jsonSpy = jest.fn().mockReturnValue(res);
      statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
      res.status = statusSpy;
    });

    it('should handle AppError correctly', () => {
      const error = new AppError('TEST_ERROR', 400, 'Test error message');

      errorHandler(error, req, res, (() => {}) as NextFunction);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
          statusCode: 400,
          details: undefined,
        },
      });
    });

    it('should handle ValidationError from mongoose', () => {
      const error = new Error('ValidationError');
      (error as any).name = 'ValidationError';

      errorHandler(error, req, res, (() => {}) as NextFunction);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          }),
        })
      );
    });

    it('should handle generic errors', () => {
      const error = new Error('Some error');

      errorHandler(error, req, res, (() => {}) as NextFunction);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'INTERNAL_SERVER_ERROR',
            statusCode: 500,
          }),
        })
      );
    });
  });

  describe('asyncHandler wrapper', () => {
    it('should handle async errors and pass to next()', (done) => {
      const error = new Error('Async error');
      const nextSpy = jest.fn();

      const asyncFn = asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
        throw error;
      });

      asyncFn({} as Request, {} as Response, nextSpy);

      setTimeout(() => {
        expect(nextSpy).toHaveBeenCalledWith(error);
        done();
      }, 0);
    });

    it('should execute handler successfully', (done) => {
      const nextSpy = jest.fn();
      const resSpy = { json: jest.fn() };

      const asyncFn = asyncHandler(async (_req: Request, res: Response) => {
        (res as any).json({ success: true });
      });

      asyncFn({} as Request, resSpy as any, nextSpy);

      setTimeout(() => {
        expect((resSpy as any).json).toHaveBeenCalledWith({ success: true });
        done();
      }, 0);
    });
  });
});
