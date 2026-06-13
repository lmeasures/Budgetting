import { authService } from '../services/authService';
import { User } from '../models/User';
import { Setting } from '../models/Setting';
import * as encryption from '../utils/encryption';
import { AppError } from '../middleware/errorHandler';

jest.mock('../models/User');
jest.mock('../models/Setting');
jest.mock('../utils/encryption');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with default settings', async () => {
      const mockUser = {
        save: jest.fn().mockResolvedValue(true),
      };

      (User as any).mockImplementation(() => mockUser);
      (Setting as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));

      const userId = await authService.createUser();

      expect(userId).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
      expect(Setting).toHaveBeenCalled();
    });
  });

  describe('setPassphrase', () => {
    it('should hash and save passphrase', async () => {
      const userId = 'test-user-id';
      const passphrase = 'test-passphrase';

      const mockUser = {
        save: jest.fn().mockResolvedValue(true),
        passphraseHash: '',
      };

      (User.findById as any) = jest.fn().mockResolvedValue(mockUser);
      (encryption.hashPassphrase as any) = jest.fn().mockResolvedValue('hashed-password');

      await authService.setPassphrase(userId, passphrase);

      expect(encryption.hashPassphrase).toHaveBeenCalledWith(passphrase);
      expect(mockUser.passphraseHash).toBe('hashed-password');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw NOT_FOUND if user does not exist', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue(null);

      await expect(authService.setPassphrase('non-existent', 'passphrase')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('authenticate', () => {
    it('should return true for valid passphrase', async () => {
      const userId = 'test-user-id';
      const passphrase = 'test-passphrase';

      const mockUser = {
        passphraseHash: 'hashed-password',
      };

      (User.findById as any) = jest.fn().mockResolvedValue(mockUser);
      (encryption.verifyPassphrase as any) = jest.fn().mockResolvedValue(true);

      const result = await authService.authenticate(userId, passphrase);

      expect(result).toBe(true);
      expect(encryption.verifyPassphrase).toHaveBeenCalledWith(passphrase, 'hashed-password');
    });

    it('should return false for invalid passphrase', async () => {
      const mockUser = {
        passphraseHash: 'hashed-password',
      };

      (User.findById as any) = jest.fn().mockResolvedValue(mockUser);
      (encryption.verifyPassphrase as any) = jest.fn().mockResolvedValue(false);

      const result = await authService.authenticate('user-id', 'wrong-passphrase');

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue(null);

      const result = await authService.authenticate('non-existent', 'passphrase');

      expect(result).toBe(false);
    });
  });

  describe('userExists', () => {
    it('should return true if user exists', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue({ _id: 'user-id' });

      const result = await authService.userExists('user-id');

      expect(result).toBe(true);
    });

    it('should return false if user does not exist', async () => {
      (User.findById as any) = jest.fn().mockResolvedValue(null);

      const result = await authService.userExists('non-existent');

      expect(result).toBe(false);
    });
  });
});
