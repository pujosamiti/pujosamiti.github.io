export interface Env {
  DB: D1Database
  /**
   * R2 bucket for media uploaded through the app (Uma article images).
   * OPTIONAL: R2 must be enabled on the Cloudflare account and the bucket
   * created before the binding can be added to wrangler.jsonc. Until then the
   * upload routes answer 503 and articles use images shipped in web/public.
   */
  FILES?: R2Bucket

  /**
   * Per-IP cap on the public headcount link endpoints (wrangler.jsonc
   * "ratelimits"). Optional so a Worker without the binding still serves.
   */
  HEADCOUNT_LIMITER?: RateLimit

  WEB_ORIGIN: string

  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  FACEBOOK_CLIENT_ID: string
  FACEBOOK_CLIENT_SECRET: string

  GOOGLE_SERVICE_ACCOUNT_EMAIL: string
  GOOGLE_SERVICE_ACCOUNT_KEY: string
  ACCOUNTS_SHEET_ID: string
  CONTENT_DRIVE_FOLDER_ID: string
}
