import { MAX_ERRORS } from './util.constant';

export const mailTemplates = (
  topic: string,
  clientIp: string,
  deviceInfo: string,
) => {
  switch (topic) {
    case 'user.signup':
      return {
        subject: 'User Signup',
        text: `Your account has been created successfully! \n Location: ${clientIp}`,
        html: htmlTemplate(clientIp, 'https://softafrik.com', deviceInfo),
      };

    case 'user.login':
      return {
        subject: 'User Login',
        text: `Your account has been logged into successfully! \n Location: ${clientIp}`,
        html: htmlLoginTemplate(clientIp, deviceInfo),
      };

    case 'user.login.error.alert':
      return {
        subject: '🚨 High Login Error Alert!',
        text: `More than ${MAX_ERRORS} failed login attempts detected within a short time.\n Location: ${clientIp} \n Device: ${deviceInfo}`,
        // html: htmlLoginTemplate(clientIp, deviceInfo),
      };

    default:
      return {
        subject: 'Notification',
        text: `You have received a new notification. \n Location: ${clientIp}`,
      };
  }
};

const htmlTemplate = (
  clientIp: string,
  verifyLink: string,
  deviceInfo: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>User Signup</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    h2 {
      color: #333;
    }
    p {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 12px 20px;
      margin: 20px 0;
      font-size: 16px;
      color: #ffffff;
      background-color: #007bff;
      border-radius: 5px;
      text-decoration: none;
    }
    .button:hover {
      background-color: #0056b3;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #888;
      text-align: center;
    }
    a {
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Our Platform!</h2>
    <p>Your account has been created successfully.</p>
    <p><strong>Location:</strong> ${clientIp}</p>
    <p><strong>Time:</strong> ${loginTime}</p>
    <p><strong>Device:</strong> ${deviceInfo}</p>
    <p>To get started, please verify your email by clicking the button below:</p>
    <a href="${verifyLink}" class="button">Verify Email</a>
    <p>If this wasn't you, please contact our support team immediately.</p>
    <div class="footer">
      &copy; 2025 Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

const loginTime = new Date().toLocaleString();

const htmlLoginTemplate = (clientIp: string, deviceInfo: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>User Login Notification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }
    h2 {
      color: #333;
    }
    p {
      font-size: 16px;
      color: #555;
      line-height: 1.6;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Login Detected</h2>
    <p>Your account has been logged into successfully.</p>
    <p><strong>Location:</strong> ${clientIp}</p>
    <p><strong>Time:</strong> ${loginTime}</p>
    <p><strong>Device:</strong> ${deviceInfo}</p>
    <p>If this wasn't you, please <a href="https://softafrik.com">reset your password</a> immediately.</p>
    <div class="footer">
      &copy; 2025 Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
