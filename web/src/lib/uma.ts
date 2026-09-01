import type {
  UmaArticleCard,
  UmaArticleInput,
  UmaArticleView,
  UmaDeskView,
  UmaHomeView,
  UmaIssueInput,
  UmaIssueView,
  UmaReactInput,
  UmaStatusInput,
} from '@pujosamiti/shared'
import { useQuery } from '@tanstack/react-query'

import { api, API_URL } from '@/lib/api'
import { useMemberState } from '@/lib/member'

/**
 * One brand tone per Sudoku digit — shared by the board itself and the card
 * that advertises it on the issue page, so 3 is the same green in both.
 */
export const DIGIT_TONES = ['jaba', 'genda', 'durba', 'sharat', 'jarul', 'padma'] as const

/**
 * Two kinds of image live in these rows, both stored origin-relative so the
 * same row works on local and prod: uploads served by the Worker out of R2
 * ("/api/public/uma/media/…"), and art shipped with the site itself
 * ("/uma-media/…" in web/public — cheaper, CDN-cached, in git).
 */
export const mediaUrl = (path: string | null | undefined): string | undefined =>
  path ? (path.startsWith('/api/') ? `${API_URL}${path}` : path) : undefined

// ── public ──────────────────────────────────────────────────────────────────

export function useUmaHome() {
  return useQuery({ queryKey: ['uma', 'home'], queryFn: () => api<UmaHomeView>('/api/public/uma/home') })
}

export function useUmaIssue(number: number | null) {
  return useQuery({
    queryKey: ['uma', 'issue', number],
    queryFn: () => api<UmaIssueView>(`/api/public/uma/issues/${number}`),
    enabled: number != null && Number.isFinite(number),
  })
}

export function useUmaArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ['uma', 'article', slug],
    queryFn: () => api<UmaArticleView>(`/api/public/uma/articles/${slug}`),
    enabled: !!slug,
  })
}

export function useUmaSection(section: string | undefined) {
  return useQuery({
    queryKey: ['uma', 'section', section],
    queryFn: () => api<UmaArticleCard[]>(`/api/public/uma/articles?section=${section}`),
    enabled: !!section,
  })
}

// ── reactions (anonymous; the per-reader cap lives in this browser) ─────────

export interface MyReactions {
  hearts: 0 | 1
  claps: number
}

const REACT_KEY = 'uma.reactions'

export function readMyReactions(slug: string): MyReactions {
  try {
    const all = JSON.parse(localStorage.getItem(REACT_KEY) ?? '{}') as Record<string, MyReactions>
    const r = all[slug]
    return { hearts: r?.hearts === 1 ? 1 : 0, claps: Math.max(0, Number(r?.claps) || 0) }
  } catch {
    return { hearts: 0, claps: 0 }
  }
}

export function writeMyReactions(slug: string, r: MyReactions) {
  try {
    const all = JSON.parse(localStorage.getItem(REACT_KEY) ?? '{}') as Record<string, MyReactions>
    all[slug] = r
    localStorage.setItem(REACT_KEY, JSON.stringify(all))
  } catch {
    // private windows etc. — reactions still send, they just aren't remembered
  }
}

export const sendReaction = (input: UmaReactInput) =>
  api<{ hearts: number; claps: number }>('/api/public/uma/react', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

// ── editorial desk ──────────────────────────────────────────────────────────

const post = (path: string, body: unknown) =>
  api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
const put = (path: string, body: unknown) =>
  api(path, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

export function useUmaDesk(enabled: boolean) {
  const { memberState } = useMemberState()
  return useQuery({
    queryKey: ['uma', 'desk'],
    queryFn: () => api<UmaDeskView>('/api/members/uma/desk'),
    enabled: memberState?.status === 'member' && enabled,
  })
}

export const createUmaArticle = (input: UmaArticleInput) =>
  post('/api/members/uma/articles', input) as Promise<{ id: string; slug: string }>
export const updateUmaArticle = (id: string, input: UmaArticleInput) =>
  put(`/api/members/uma/articles/${id}`, input) as Promise<{ id: string; slug: string }>
export const setUmaStatus = (id: string, input: UmaStatusInput) => post(`/api/members/uma/articles/${id}/status`, input)
export const deleteUmaArticle = (id: string) =>
  api(`/api/members/uma/articles/${id}`, { method: 'DELETE' })
export const createUmaIssue = (input: UmaIssueInput) =>
  post('/api/members/uma/issues', input) as Promise<{ id: string }>
export const updateUmaIssue = (id: string, input: UmaIssueInput) => put(`/api/members/uma/issues/${id}`, input)
export const orderUmaIssue = (id: string, articleIds: string[]) =>
  put(`/api/members/uma/issues/${id}/order`, { articleIds })
export const publishUmaIssue = (id: string) =>
  post(`/api/members/uma/issues/${id}/publish`, {}) as Promise<{ published: number; rebuildTriggered: boolean }>
export const deleteUmaIssue = (id: string) => api(`/api/members/uma/issues/${id}`, { method: 'DELETE' })
export const setUmaChief = (personId: string | null) => put('/api/members/uma/roles', { personId })
export const setUmaSectionEditor = (section: string, personId: string | null) =>
  put('/api/members/uma/sections', { section, personId })

export const uploadUmaMedia = (file: File) =>
  api<{ url: string }>(`/api/members/uma/media?name=${encodeURIComponent(file.name)}`, {
    method: 'POST',
    body: file,
  })
