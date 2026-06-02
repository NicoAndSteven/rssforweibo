export const config = {
  authCode: process.env.AUTH_CODE || '',
  weiboCookie: process.env.WEIBO_COOKIE || '',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '8000', 10),
  maxItems: parseInt(process.env.MAX_ITEMS || '20', 10),
  userAgent: process.env.USER_AGENT || 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
};

export function validateAuth(authHeader: string | undefined): boolean {
  if (!config.authCode) {
    return true;
  }
  
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === config.authCode;
}

export function createAuthError() {
  return {
    error: 'Unauthorized',
    message: 'Missing or invalid authentication. Provide AUTH_CODE via Authorization header or query parameter.',
    hint: 'Authorization: Bearer <your_auth_code> or ?code=<your_auth_code>',
  };
}
