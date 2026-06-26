export function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) {
      return false;
    }

    return Date.now() >= payload.exp * 1000 - skewSeconds * 1000;
  } catch {
    return true;
  }
}
