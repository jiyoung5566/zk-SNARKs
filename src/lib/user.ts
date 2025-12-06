/**
 * 👤 투표자 등록 및 신원 관리
 *
 * 역할:
 * - 백엔드에서 투표자 신원(identity) 받기
 * - localStorage에 캐싱 (재사용)
 * - ZKP 증명 생성 시 필요한 secret 제공
 */

export type IdentityPayload = {
  identityNullifier: string
  identityTrapdoor: string
  [k: string]: unknown
}

const CACHE_KEY_PREFIX = 'voter_identity_'

/** 백엔드 URL — 실제 라우트: /api/user/register */
const getRegisterUrl = () => {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://my-anon-voting-platfrom2.onrender.com'
  return `${apiUrl}/api/user/register`
}

/** 캐시 조회 */
export function getStoredIdentity(address: string): IdentityPayload | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${address}`)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** 캐시 저장 */
export function storeIdentity(address: string, identity: IdentityPayload) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${address}`,
      JSON.stringify(identity)
    )
  } catch {}
}

/**
 * 투표자 등록 보장
 */
export async function ensureRegistered(
  address: string,
  forceRefresh = false
): Promise<IdentityPayload> {
  if (!address) throw new Error('address is required')

  // 캐시 우선
  const cached = !forceRefresh ? getStoredIdentity(address) : null
  if (cached) return cached

  // 새로 등록 요청
  let res: Response
  try {
    res = await fetch(getRegisterUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: address }), // 백엔드 스키마에 맞춤
    })
  } catch (e: unknown) {
    const err = e as Error
    throw new Error(`Network error: ${err.message}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`user/register failed: ${text}`)
  }

  const json = (await res.json()) as IdentityPayload

  if (!json.identityNullifier || !json.identityTrapdoor) {
    console.warn('⚠ Unexpected register response:', json)
  }

  storeIdentity(address, json)

  return json
}
