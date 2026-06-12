import { handler } from '../../src/handlers/eventProcessor';
import { MailEventType } from '../../src/types/events';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-msg-id' }),
  })),
}));

// Mock DynamoDB service
jest.mock('../../src/services/dynamodb', () => ({
  dynamoDBService: {
    getMailConfigByEmail: jest.fn(),
  },
}));

// Mock EventBridge service
jest.mock('../../src/services/eventbridge', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

// Mock encryption
jest.mock('../../src/utils/encryption', () => ({
  decrypt: jest.fn(),
}));

// Mock error tracker
jest.mock('../../src/services/errorTracker', () => ({
  errorTracker: {
    trackLoginError: jest.fn(),
  },
}));

import * as nodemailer from 'nodemailer';
import { dynamoDBService } from '../../src/services/dynamodb';
import { publishEvent } from '../../src/services/eventbridge';
import { decrypt } from '../../src/utils/encryption';
import { errorTracker } from '../../src/services/errorTracker';

const mockedDynamoDB = dynamoDBService as jest.Mocked<typeof dynamoDBService>;
const mockedDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;
const mockedCreateTransport = nodemailer.createTransport as jest.MockedFunction<
  typeof nodemailer.createTransport
>;
const mockedErrorTracker = errorTracker as jest.Mocked<typeof errorTracker>;
const mockedPublishEvent = publishEvent as jest.MockedFunction<typeof publishEvent>;

function createEventBridgeEvent(eventType: MailEventType | string, payload: Record<string, any> = {}) {
  return {
    'detail-type': eventType,
    detail: {
      eventType: eventType as MailEventType,
      payload,
      correlationId: 'test-correlation-id',
      timestamp: '2024-01-01T00:00:00.000Z',
    },
    source: 'mail-service',
  } as any;
}

const mockMailConfig = {
  id: 'config-1',
  email: 'admin@example.com',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'smtp-user@example.com',
  smtpPass: 'encrypted-password',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('EventProcessor Handler', () => {
  let mockSendMail: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-msg-id' });
    (mockedCreateTransport as jest.Mock).mockReturnValue({ sendMail: mockSendMail });
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ENCRYPTION_KEY = 'test-encryption-key';
  });

  afterEach(() => {
    delete process.env.ADMIN_EMAIL;
    delete process.env.ENCRYPTION_KEY;
  });

  describe('Email events (user.login)', () => {
    it('should retrieve SMTP config and send email for user.login event', async () => {
      mockedDynamoDB.getMailConfigByEmail.mockResolvedValue(mockMailConfig);
      mockedDecrypt.mockReturnValue('decrypted-password');

      const event = createEventBridgeEvent('user.login', {
        email: 'user@example.com',
        clientIp: '192.168.1.1',
        deviceInfo: 'Chrome/120',
      });

      await handler(event);

      expect(mockedDynamoDB.getMailConfigByEmail).toHaveBeenCalled();
      expect(mockedDecrypt).toHaveBeenCalledWith('encrypted-password', expect.any(String));
      expect(mockedCreateTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          auth: {
            user: 'smtp-user@example.com',
            pass: 'decrypted-password',
          },
        }),
      );
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'smtp-user@example.com',
          subject: 'New Login to Your Account',
        }),
      );
    });
  });

  describe('Email events (submit.feedback)', () => {
    it('should retrieve SMTP config and send email for submit.feedback event', async () => {
      mockedDynamoDB.getMailConfigByEmail.mockResolvedValue(mockMailConfig);
      mockedDecrypt.mockReturnValue('decrypted-password');

      const event = createEventBridgeEvent('submit.feedback', {
        name: 'John',
        email: 'john@example.com',
        message: 'Feedback content',
      });

      await handler(event);

      expect(mockedDynamoDB.getMailConfigByEmail).toHaveBeenCalled();
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'smtp-user@example.com',
          subject: 'New Feedback Received',
        }),
      );
    });
  });

  describe('user.login.error event', () => {
    it('should delegate to errorTracker for user.login.error event', async () => {
      mockedErrorTracker.trackLoginError.mockResolvedValue({ alertTriggered: false });

      const event = createEventBridgeEvent('user.login.error', {
        email: 'hacker@example.com',
        clientIp: '10.0.0.1',
      });

      await handler(event);

      expect(mockedErrorTracker.trackLoginError).toHaveBeenCalledWith({
        email: 'hacker@example.com',
        clientIp: '10.0.0.1',
      });
      // Should not attempt to send email via nodemailer for this event type
      expect(mockedDynamoDB.getMailConfigByEmail).not.toHaveBeenCalled();
    });
  });

  describe('Missing SMTP config', () => {
    it('should log warning and skip delivery when SMTP config is not found', async () => {
      mockedDynamoDB.getMailConfigByEmail.mockResolvedValue(null);

      const event = createEventBridgeEvent('user.login', {
        email: 'user@example.com',
      });

      await handler(event);

      expect(mockedDynamoDB.getMailConfigByEmail).toHaveBeenCalled();
      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('SMTP delivery failure', () => {
    it('should log error when SMTP delivery fails', async () => {
      mockedDynamoDB.getMailConfigByEmail.mockResolvedValue(mockMailConfig);
      mockedDecrypt.mockReturnValue('decrypted-password');
      mockSendMail.mockRejectedValue(new Error('SMTP connection refused'));

      const event = createEventBridgeEvent('user.login', {
        email: 'user@example.com',
      });

      // Should not throw
      await expect(handler(event)).resolves.toBeUndefined();

      expect(mockSendMail).toHaveBeenCalled();
      // Verify no mail.sent event was published
      expect(mockedPublishEvent).not.toHaveBeenCalled();
    });
  });

  describe('Encryption failure', () => {
    it('should log error and skip delivery when decryption fails', async () => {
      mockedDynamoDB.getMailConfigByEmail.mockResolvedValue(mockMailConfig);
      mockedDecrypt.mockImplementation(() => {
        throw new Error('Decryption failed: invalid key');
      });

      const event = createEventBridgeEvent('user.login', {
        email: 'user@example.com',
      });

      await expect(handler(event)).resolves.toBeUndefined();

      expect(mockedDecrypt).toHaveBeenCalled();
      expect(mockedCreateTransport).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe('Unknown event type', () => {
    it('should log warning and skip when event type is unknown', async () => {
      const event = createEventBridgeEvent('unknown.event.type' as any, {});

      await expect(handler(event)).resolves.toBeUndefined();

      expect(mockedDynamoDB.getMailConfigByEmail).not.toHaveBeenCalled();
      expect(mockedErrorTracker.trackLoginError).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });
});
