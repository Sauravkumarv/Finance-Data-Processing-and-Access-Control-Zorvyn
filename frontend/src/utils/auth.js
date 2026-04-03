import jwtDecode from './jwtDecodeFallback';

export const getProfileFromToken = (token) => {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch (e) {
    return null;
  }
};