// Tiny JWT payload parser to avoid bringing a dependency
export default function jwtDecodeFallback(token) {
  const [, payload] = token.split('.');
  if (!payload) throw new Error('Invalid token');
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}