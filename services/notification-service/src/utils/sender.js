// this module simulates sending email/sms by logging to the console.
// swap these out for real providers (nodemailer/sendgrid for email,
// twilio for sms) when you're ready to send for real.

const sendEmail = async (to, subject, message) => {
  // TODO: plug in real email provider here
  console.log('--- EMAIL ---');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  console.log('-------------');
  return true;
};

const sendSms = async (to, message) => {
  // TODO: plug in real sms provider here
  console.log('--- SMS ---');
  console.log(`To: ${to}`);
  console.log(`Message: ${message}`);
  console.log('-----------');
  return true;
};

// picks the right sender based on channel
export const send = async ({ channel, recipient, subject, message }) => {
  if (channel === 'sms') {
    return sendSms(recipient, message);
  }
  return sendEmail(recipient, subject, message);
};
