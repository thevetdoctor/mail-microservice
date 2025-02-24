import { MAX_ERRORS, redirectUrl } from './util.constant';

export const mailTemplates = (
  topic: string,
  clientIp: string,
  deviceInfo: string,
  currentTime: string,
) => {
  switch (topic) {
    case 'user.signup':
      return {
        subject: 'User Signup',
        text: `Your account has been created successfully! \n Location: ${clientIp}`,
        html: htmlTemplate(clientIp, redirectUrl, deviceInfo, currentTime),
      };

    case 'user.login':
      return {
        subject: 'User Login',
        text: `Your account has been logged into successfully! \n Location: ${clientIp}`,
        html: htmlLoginTemplate(clientIp, deviceInfo, currentTime),
      };

    case 'user.login.error.alert':
      return {
        subject: '🚨 High Login Error Alert!',
        text: `More than ${MAX_ERRORS} failed login attempts detected within a short time.\n Location: ${clientIp} \n Device: ${deviceInfo}`,
        html: htmlAlertTemplate(clientIp, deviceInfo, currentTime),
      };

    default:
      return {
        subject: 'Notification',
        text: `You have received a new notification. \n Location: ${clientIp}. \n Location: ${deviceInfo}. \n Location: ${currentTime}`,
      };
  }
};

const htmlTemplate = (
  clientIp: string,
  verifyLink: string,
  deviceInfo: string,
  currentTime: string,
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
    <p><strong>Time:</strong> ${currentTime}</p>
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

const htmlLoginTemplate = (
  clientIp: string,
  deviceInfo: string,
  currentTime: string,
) => `
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
    <p><strong>Time:</strong> ${currentTime}</p>
    <p><strong>Device:</strong> ${deviceInfo}</p>
    <p>If this wasn't you, please <a href=${redirectUrl}>reset your password</a> immediately.</p>
    <div class="footer">
      &copy; 2025 Your Company. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

const htmlAlertTemplate = (
  clientIp: string,
  deviceInfo: string,
  currentTime: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🚨 High Login Error Alert!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      margin: auto;
    }
    .header {
      background-color: #d9534f;
      color: #fff;
      text-align: center;
      padding: 15px;
      font-size: 20px;
      font-weight: bold;
      border-radius: 8px 8px 0 0;
    }
    .content {
      padding: 20px;
      font-size: 16px;
      color: #333;
    }
    .footer {
      font-size: 14px;
      text-align: center;
      margin-top: 20px;
      color: #777;
    }
    .alert {
      font-size: 18px;
      font-weight: bold;
      color: #d9534f;
    }
    .details {
      background: #f8d7da;
      padding: 10px;
      border-radius: 5px;
      margin-top: 10px;
    }
    .button {
      display: inline-block;
      padding: 10px 15px;
      background: #d9534f;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">🚨 High Login Error Alert!</div>
    <div class="content">
      <p class="alert">Security Alert: Multiple Failed Login Attempts</p>
      <p>We have detected <strong>more than ${MAX_ERRORS} failed login attempts</strong> on your account within a short period.</p>
      <div class="details">
        <p><strong>Location:</strong> ${clientIp}</p>
        <p><strong>Device:</strong> ${deviceInfo}</p>
        <p><strong>Time:</strong> ${currentTime}</p>
      </div>
      <p>If this wasn't you, we recommend securing your account immediately.</p>
      <a href=${redirectUrl} class="button">Reset Password</a>
    </div>
    <div class="footer">If you did not attempt to log in, please ignore this email.</div>
  </div>
</body>
</html>
`;
