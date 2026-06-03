export interface Config {
  authCode: string;
  weiboCookie: string;
  requestTimeout: number;
  maxItems: number;
  userAgent: string;
}

export function createConfig(env?: Record<string, string | undefined | unknown>): Config {
  const get = (key: string): string => {
    const val = env?.[key];
    return typeof val === 'string' ? val : '';
  };

  return {
    authCode: get('AUTH_CODE'),
    weiboCookie: get('WEIBO_COOKIE'),
    requestTimeout: parseInt(get('REQUEST_TIMEOUT') || '8000', 10),
    maxItems: parseInt(get('MAX_ITEMS') || '20', 10),
    userAgent: get('USER_AGENT') || 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  };
}

export function validateAuth(authHeader: string | undefined, cfg: Config): boolean {
  if (!cfg.authCode) {
    return true;
  }

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === cfg.authCode;
}

export function createAuthError() {
  return {
    error: 'Unauthorized',
    message: 'Missing or invalid authentication. Provide AUTH_CODE via Authorization header or query parameter.',
    hint: 'Authorization: Bearer <your_auth_code> or ?code=<your_auth_code>',
  };
}

export const config = createConfig();
