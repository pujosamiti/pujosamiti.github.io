import type { Env } from '../env'

/**
 * Minimal Google service-account client for Workers.
 *
 * The googleapis npm package needs Node and does not run on Workers, so we mint
 * the OAuth token ourselves: sign a JWT with the service account's key via
 * WebCrypto, exchange it for an access token, then hit the Sheets/Drive REST
 * APIs with plain fetch. Share the sheet and Drive folders with the service
 * account's email and nothing else needs to be public.
 */

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ')

let cached: { token: string; expiresAt: number } | null = null

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importKey(pem: string): Promise<CryptoKey> {
  const body = pem
    .replace(/\\n/g, '\n')
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

export async function getAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.expiresAt > now + 60) return cached.token

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: SCOPES,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  )
  const key = await importKey(env.GOOGLE_SERVICE_ACCOUNT_KEY)
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${claims}`),
  )
  const jwt = `${header}.${claims}.${base64url(new Uint8Array(signature))}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cached = { token: data.access_token, expiresAt: now + data.expires_in }
  return cached.token
}

async function googleGet<T>(env: Env, url: string): Promise<T> {
  const token = await getAccessToken(env)
  const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Google API ${res.status}: ${url}`)
  return res.json() as Promise<T>
}

/** Read a range from the accounts spreadsheet, e.g. "Collections!A2:E". */
export async function readSheetRange(env: Env, range: string): Promise<string[][]> {
  const data = await googleGet<{ values?: string[][] }>(
    env,
    `https://sheets.googleapis.com/v4/spreadsheets/${env.ACCOUNTS_SHEET_ID}/values/${encodeURIComponent(range)}`,
  )
  return data.values ?? []
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
}

/** List the markdown drop-zone: committee members add .md files, the site shows them. */
export async function listDriveFolder(env: Env, folderId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`)
  const data = await googleGet<{ files: DriveFile[] }>(
    env,
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime)&orderBy=modifiedTime desc&pageSize=100`,
  )
  return data.files
}

export async function readDriveFile(env: Env, fileId: string): Promise<string> {
  const token = await getAccessToken(env)
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive download ${res.status}: ${fileId}`)
  return res.text()
}
