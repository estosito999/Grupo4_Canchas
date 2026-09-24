import { jest } from '@jest/globals';

// Unit tests replace email delivery; do not load the SMTP adapter or open connections.
jest.unstable_mockModule('@nestjs-modules/mailer', () => ({
  MailerService: class MailerService {},
}));
