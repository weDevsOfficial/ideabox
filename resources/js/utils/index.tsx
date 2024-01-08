export const formatDate = (date: Date) => {
  const d = new Date(date);
  const month = d.toLocaleString('default', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();

  return `${month} ${day}, ${year}`;
};
