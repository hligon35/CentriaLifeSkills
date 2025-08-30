import 'server-only'

type OIDCConfig = {
  AUTH_URL: string
  TOKEN_URL: string
  USERINFO_URL: string
  CLIENT_ID: string
  CLIENT_SECRET: string
  REDIRECT_URI: string
  SCOPES: string
}

export function getOIDCConfig(): OIDCConfig {
  const {
    OIDC_AUTH_URL,
    OIDC_TOKEN_URL,
    OIDC_USERINFO_URL,
    OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET,
    OIDC_REDIRECT_URI,
    OIDC_SCOPES
  } = process.env as Record<string, string | undefined>

  if (!OIDC_AUTH_URL || !OIDC_TOKEN_URL || !OIDC_USERINFO_URL || !OIDC_CLIENT_ID || !OIDC_CLIENT_SECRET || !OIDC_REDIRECT_URI) {
    throw new Error('Missing OIDC env configuration. See .env.example for required variables.')
  }
  return {
    AUTH_URL: OIDC_AUTH_URL,
    TOKEN_URL: OIDC_TOKEN_URL,
    USERINFO_URL: OIDC_USERINFO_URL,
    CLIENT_ID: OIDC_CLIENT_ID,
    CLIENT_SECRET: OIDC_CLIENT_SECRET,
    REDIRECT_URI: OIDC_REDIRECT_URI,
    SCOPES: OIDC_SCOPES || 'openid email profile'
  }
}

export function buildAuthorizeUrl(state: string) {
  const cfg = getOIDCConfig()
  const url = new URL(cfg.AUTH_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', cfg.CLIENT_ID)
  url.searchParams.set('redirect_uri', cfg.REDIRECT_URI)
  url.searchParams.set('scope', cfg.SCOPES)
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeCodeForTokens(code: string) {
  const cfg = getOIDCConfig()
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: cfg.REDIRECT_URI,
    client_id: cfg.CLIENT_ID,
    client_secret: cfg.CLIENT_SECRET
  })
  const res = await fetch(cfg.TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) throw new Error('OIDC token exchange failed')
  return res.json() as Promise<{ access_token: string; id_token?: string; token_type: string }>
}

export async function fetchUserInfo(accessToken: string) {
  const cfg = getOIDCConfig()
  const res = await fetch(cfg.USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error('OIDC userinfo failed')
  return res.json() as Promise<{ sub: string; email?: string; name?: string }>
}
