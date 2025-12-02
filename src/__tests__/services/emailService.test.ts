import {
  generateEmailContent,
  sendEmail,
  testEmailSetup,
  sendReportEmail,
  defaultTemplates,
} from '../../services/triggerEmailService';
import { Report, Branch } from '../../types';

// Mock the report data
const mockReport: Report = {
  id: 'test-report-1',
  createdBy: 'user-1',
  createdByName: 'John Inspector',
  branchId: 'branch-1',
  inspectionDate: '2024-01-15',
  customerName: 'Jane Customer',
  customerAddress: '123 Main St, Stockholm',
  customerPhone: '+46 70 123 4567',
  customerEmail: 'jane@example.com',
  roofType: 'tile',
  roofAge: 15,
  conditionNotes: 'Roof is in good condition with minor wear',
  issuesFound: [
    {
      id: 'issue-1',
      type: 'leak',
      severity: 'medium',
      description: 'Small leak near chimney',
      location: 'North side',
    },
  ],
  recommendedActions: [
    {
      id: 'action-1',
      priority: 'medium',
      description: 'Repair leak near chimney',
      urgency: 'short_term',
      estimatedCost: 5000,
    },
  ],
  status: 'completed',
  createdAt: '2024-01-15T10:00:00Z',
  lastEdited: '2024-01-15T10:00:00Z',
  isShared: false,
};

const mockBranch: Branch = {
  id: 'branch-1',
  name: 'Stockholm Branch',
  address: 'Stockholm, Sweden',
  phone: '+46 8 123 4567',
  email: 'stockholm@taklaget.app',
  logoUrl: 'https://example.com/logo.png',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('EmailService', () => {
  describe('generateEmailContent', () => {
    it('should generate email content with report data', () => {
      const template = defaultTemplates[0];
      const reportLink = 'https://app.taklaget.se/report/test-report-1';

      const result = generateEmailContent(mockReport, template, mockBranch, reportLink);

      expect(result.subject).toContain('Jane Customer');
      expect(result.body).toContain('Jane Customer');
      expect(result.body).toContain('John Inspector');
      expect(result.body).toContain('Stockholm Branch');
      expect(result.body).toContain('test-report-1');
    });

    it('should replace template variables correctly', () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        subject: 'Report for {{customerName}}',
        body: 'Hello {{customerName}}, your report is ready.',
      };

      const result = generateEmailContent(mockReport, template, mockBranch, 'test-link');

      expect(result.subject).toBe('Report for Jane Customer');
      expect(result.body).toBe('Hello Jane Customer, your report is ready.');
    });
  });

  describe('sendEmail', () => {
    it('should simulate email sending successfully', async () => {
      const result = await sendEmail(
        'test@example.com',
        'Test Subject',
        'Test Body',
        'test-report-1',
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(result.messageId).toMatch(/^sim_/);
    });

    it('should handle email sending errors', async () => {
      // Mock console.log to avoid noise in tests
      const originalLog = console.log;
      console.log = jest.fn();

      const result = await sendEmail('', '', '', '', '');

      expect(result.success).toBe(true); // Should still succeed in simulation mode

      console.log = originalLog;
    });
  });

  describe('testEmailSetup', () => {
    it('should return success for email setup test', async () => {
      const result = await testEmailSetup();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email system is working correctly!');
    });
  });

  describe('sendReportEmail', () => {
    it('should send report email successfully', async () => {
      const result = await sendReportEmail(
        mockReport,
        'customer@example.com',
        'template-1',
        mockBranch,
        'https://app.taklaget.se/report/test-report-1',
        'test-user'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
    });

    it('should handle missing template', async () => {
      const result = await sendReportEmail(
        mockReport,
        'customer@example.com',
        'non-existent-template',
        mockBranch,
        'https://app.taklaget.se/report/test-report-1',
        'test-user'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email template not found');
    });
  });

  describe('defaultTemplates', () => {
    it('should have at least one template', () => {
      expect(defaultTemplates.length).toBeGreaterThan(0);
    });

    it('should have required template properties', () => {
      const template = defaultTemplates[0];

      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('subject');
      expect(template).toHaveProperty('body');
    });

    it('should have valid template IDs', () => {
      defaultTemplates.forEach(template => {
        expect(template.id).toBeTruthy();
        expect(typeof template.id).toBe('string');
      });
    });
  });
});
