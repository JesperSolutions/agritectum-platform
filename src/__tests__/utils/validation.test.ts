import { validators, validateData, validateReport } from '../../utils/validation';
import { Report } from '../../types';

describe('Validation Utils', () => {
  describe('validators', () => {
    describe('required', () => {
      it('should return true for non-empty string', () => {
        expect(validators.required('hello')).toBe(true);
      });

      it('should return false for empty string', () => {
        expect(validators.required('')).toBe(false);
      });

      it('should return false for whitespace-only string', () => {
        expect(validators.required('   ')).toBe(false);
      });

      it('should return true for non-zero number', () => {
        expect(validators.required(42)).toBe(true);
      });

      it('should return false for zero', () => {
        expect(validators.required(0)).toBe(false);
      });

      it('should return true for non-empty array', () => {
        expect(validators.required([1, 2, 3])).toBe(true);
      });

      it('should return false for empty array', () => {
        expect(validators.required([])).toBe(false);
      });
    });

    describe('minLength', () => {
      it('should return true for string longer than minimum', () => {
        const minLength3 = validators.minLength(3);
        expect(minLength3('hello')).toBe(true);
      });

      it('should return false for string shorter than minimum', () => {
        const minLength3 = validators.minLength(3);
        expect(minLength3('hi')).toBe(false);
      });

      it('should return true for string equal to minimum', () => {
        const minLength3 = validators.minLength(3);
        expect(minLength3('hey')).toBe(true);
      });
    });

    describe('email', () => {
      it('should return true for valid email', () => {
        expect(validators.email('test@example.com')).toBe(true);
      });

      it('should return false for invalid email', () => {
        expect(validators.email('invalid-email')).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(validators.email('')).toBe(false);
      });
    });

    describe('phone', () => {
      it('should return true for valid phone number', () => {
        expect(validators.phone('+46 70 123 4567')).toBe(true);
      });

      it('should return true for phone without country code', () => {
        expect(validators.phone('070-123 4567')).toBe(true);
      });

      it('should return false for invalid phone number', () => {
        expect(validators.phone('123')).toBe(false);
      });
    });

    describe('positiveNumber', () => {
      it('should return true for positive number', () => {
        expect(validators.positiveNumber(42)).toBe(true);
      });

      it('should return false for zero', () => {
        expect(validators.positiveNumber(0)).toBe(false);
      });

      it('should return false for negative number', () => {
        expect(validators.positiveNumber(-5)).toBe(false);
      });
    });
  });

  describe('validateData', () => {
    it('should return valid result for valid data', () => {
      const rules = [
        { field: 'name', message: 'Name is required', validator: validators.required },
        { field: 'email', message: 'Email is required', validator: validators.required },
      ];

      const data = { name: 'John Doe', email: 'john@example.com' };
      const result = validateData(data, rules);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return invalid result for invalid data', () => {
      const rules = [
        { field: 'name', message: 'Name is required', validator: validators.required },
        { field: 'email', message: 'Email is required', validator: validators.required },
      ];

      const data = { name: '', email: '' };
      const result = validateData(data, rules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        name: 'Name is required',
        email: 'Email is required',
      });
    });
  });

  describe('validateReport', () => {
    it('should validate a complete report', () => {
      const report: Partial<Report> = {
        customerName: 'John Doe',
        customerAddress: '123 Main St',
        inspectionDate: '2024-01-15',
        roofType: 'tile',
        conditionNotes: 'Roof is in good condition',
        issuesFound: [
          {
            id: '1',
            type: 'leak',
            severity: 'medium',
            description: 'Small leak near chimney',
            location: 'North side',
          },
        ],
        recommendedActions: [
          {
            id: '1',
            priority: 'medium',
            description: 'Repair leak near chimney',
            urgency: 'short_term',
          },
        ],
      };

      const result = validateReport(report);
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for incomplete report', () => {
      const report: Partial<Report> = {
        customerName: '',
        customerAddress: '',
        inspectionDate: '',
        roofType: 'tile',
        conditionNotes: '',
        issuesFound: [],
        recommendedActions: [],
      };

      const result = validateReport(report);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('customerName');
      expect(result.errors).toHaveProperty('customerAddress');
      expect(result.errors).toHaveProperty('inspectionDate');
      expect(result.errors).toHaveProperty('conditionNotes');
      expect(result.errors).toHaveProperty('issuesFound');
      expect(result.errors).toHaveProperty('recommendedActions');
    });
  });
});
