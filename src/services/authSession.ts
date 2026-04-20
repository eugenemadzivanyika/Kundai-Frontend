export const getActiveAuthToken = (): string | null => {
  try {
    return localStorage.getItem('token');
  } catch {
    return null;
  }
};

export default getActiveAuthToken;
