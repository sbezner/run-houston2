import { NetworkValidator } from '../networkValidator';

// Mock fetch globally
global.fetch = jest.fn();

describe('NetworkValidator', () => {
  let networkValidator: NetworkValidator;

  beforeEach(() => {
    // Reset fetch mock
    (fetch as jest.Mock).mockClear();
    networkValidator = NetworkValidator.getInstance();
  });

  afterEach(() => {
    networkValidator.cleanup();
  });

  describe('isNetworkAvailable', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });
      
      expect(networkValidator.isNetworkAvailable()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
      
      expect(networkValidator.isNetworkAvailable()).toBe(false);
    });
  });

  describe('validateNetworkForAdmin', () => {
    it('should return true when both local and internet connectivity are available', async () => {
      // Mock successful local connectivity test
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Local connectivity test
        .mockResolvedValueOnce({ ok: true }); // Internet connectivity test

      const result = await networkValidator.validateNetworkForAdmin();
      expect(result).toBe(true);
    });

    it('should return false when local connectivity fails', async () => {
      // Mock failed local connectivity test
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Local connection failed'));

      const result = await networkValidator.validateNetworkForAdmin();
      expect(result).toBe(false);
    });

    it('should return false when internet connectivity fails', async () => {
      // Mock successful local connectivity but failed internet connectivity
      (fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true }) // Local connectivity test
        .mockRejectedValueOnce(new Error('Internet connection failed'));

      const result = await networkValidator.validateNetworkForAdmin();
      expect(result).toBe(false);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = NetworkValidator.getInstance();
      const instance2 = NetworkValidator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
