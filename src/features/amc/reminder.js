// honest message after "send reminder" (r = { email, whatsapp }: sent | skipped | failed)
export const reminderOk = (r) => r.email === 'sent' || r.whatsapp === 'sent';

export const reminderText = (r) => {
  const via = [r.email === 'sent' && 'email', r.whatsapp === 'sent' && 'WhatsApp'].filter(Boolean);
  return via.length ? `Reminder sent by ${via.join(' and ')}.`
    : `Nothing was sent (email: ${r.email}, WhatsApp: ${r.whatsapp}). Check that the customer has an email / phone and that email / WhatsApp is set up on the server.`;
};
