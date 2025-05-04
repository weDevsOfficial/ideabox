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

// Create a clean excerpt from the post body for meta description
export const getExcerpt = (text: string, maxLength = 160) => {
  // Remove HTML tags and HTML entities
  const cleanText = text.replace(/<[^>]*>?/g, '').replace(/&[^;]+;/g, '');

  // Normalize whitespace (remove extra spaces, newlines, etc.)
  const normalizedText = cleanText.replace(/\s+/g, ' ').trim();

  if (normalizedText.length <= maxLength) return normalizedText;

  // Find the last space before maxLength to avoid cutting words
  const lastSpace = normalizedText.lastIndexOf(' ', maxLength);
  const breakPoint = lastSpace > maxLength / 2 ? lastSpace : maxLength;

  return normalizedText.substring(0, breakPoint).trim() + '...';
};
