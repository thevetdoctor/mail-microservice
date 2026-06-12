import { mailTemplates, getMailTemplate } from '../../src/utils/templates';

describe('mailTemplates', () => {
  const expectedEventTypes = ['user.login', 'user.signup', 'submit.feedback', 'mail.send'];

  it.each(expectedEventTypes)('should have a template entry for "%s" with non-empty subject', (eventType) => {
    const template = mailTemplates[eventType];
    expect(template).toBeDefined();
    expect(template.subject).toBeTruthy();
    expect(typeof template.subject).toBe('string');
  });

  it.each(expectedEventTypes)('should have a template entry for "%s" with html function returning non-empty string', (eventType) => {
    const template = mailTemplates[eventType];
    expect(typeof template.html).toBe('function');
    const result = template.html({});
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getMailTemplate', () => {
  it('should return the user.login template for "user.login"', () => {
    const template = getMailTemplate('user.login');
    expect(template).toBe(mailTemplates['user.login']);
  });

  it('should return the user.signup template for "user.signup"', () => {
    const template = getMailTemplate('user.signup');
    expect(template).toBe(mailTemplates['user.signup']);
  });

  it('should return the submit.feedback template for "submit.feedback"', () => {
    const template = getMailTemplate('submit.feedback');
    expect(template).toBe(mailTemplates['submit.feedback']);
  });

  it('should return the mail.send template for "mail.send"', () => {
    const template = getMailTemplate('mail.send');
    expect(template).toBe(mailTemplates['mail.send']);
  });

  it('should fall back to mail.send template for unknown event types', () => {
    const template = getMailTemplate('unknown.event');
    expect(template).toBe(mailTemplates['mail.send']);
  });
});

describe('template html output includes payload data', () => {
  it('user.login template includes clientIp in output', () => {
    const html = mailTemplates['user.login'].html({ clientIp: '192.168.1.1' });
    expect(html).toContain('192.168.1.1');
  });

  it('user.signup template includes clientIp in output', () => {
    const html = mailTemplates['user.signup'].html({ clientIp: '10.0.0.1' });
    expect(html).toContain('10.0.0.1');
  });

  it('submit.feedback template includes name, email, and message', () => {
    const html = mailTemplates['submit.feedback'].html({
      name: 'Alice',
      email: 'alice@example.com',
      message: 'Great service!',
    });
    expect(html).toContain('Alice');
    expect(html).toContain('alice@example.com');
    expect(html).toContain('Great service!');
  });

  it('mail.send template includes message in output', () => {
    const html = mailTemplates['mail.send'].html({ message: 'Hello World' });
    expect(html).toContain('Hello World');
  });
});
