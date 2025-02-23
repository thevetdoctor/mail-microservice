export const mailTemplates = (topic: string, clientIp: string) => {
  switch (topic) {
    case 'user.signup':
      return {
        subject: 'User Signup',
        text: `Your account has been created successfully! \n Location: ${clientIp}`,
      };

    case 'user.login':
      return {
        subject: 'User Login',
        text: `Your account has been logged into successfully! \n Location: ${clientIp}`,
      };

    case 'order.created':
      return {
        subject: 'Order Confirmation',
        text: `Your order has been placed successfully! \n Location: ${clientIp}`,
      };

    default:
      return {
        subject: 'Notification',
        text: `You have received a new notification. \n Location: ${clientIp}`,
      };
  }
};

