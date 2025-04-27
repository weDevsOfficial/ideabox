export const formatDate = (date: Date) => {
  const d = new Date(date);
  const month = d.toLocaleString('default', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();

  return `${month} ${day}, ${year}`;
};

export const generateRandomPassword = (length = 20) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
