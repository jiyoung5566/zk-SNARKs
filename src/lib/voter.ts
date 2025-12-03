/**
 * 👤 투표자 등록 및 신원 관리
 * 
 * 역할:
 * - 백엔드에서 투표자 신원(identity) 받기
 * - localStorage에 캐싱 (재사용)
 * - ZKP 증명 생성 시 필요한 secret 제공
 * 
 * 주요 함수:
 * - ensureRegistered() - 신원 등록/조회
 * - getStoredIdentity() - 로컬 캐시 조회
 */

export type IdentityPayload = {
  identityNullifier: string  // ZKP nullifier 생성용
  identityTrapdoor: string   // ZKP commitment 생성용
  [k: string]: unknown       // 백엔드 추가 필드
}

const CACHE_KEY_PREFIX = 'voter_identity_'

/**
 * 백엔드 API URL 가져오기 (환경 변수 우선)
 */
const getRegisterUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://my-anon-voting-platfrom2.onrender.com'
  return `${apiUrl}/api/voter/register`
}

/**
 * 로컬 캐시에서 identity 불러오기
 */
export function getStoredIdentity(address: string): IdentityPayload | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${address}`)
    if (!raw) return null
    return JSON.parse(raw) as IdentityPayload
  } catch (e) {
    console.warn('Stored identity parse failed', e)
    return null
  }
}

/**
 * identity 저장 (localStorage)
 */
export function storeIdentity(address: string, identity: IdentityPayload) {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      `${CACHE_KEY_PREFIX}${address}`,
      JSON.stringify(identity)
    )
  } catch (e) {
    console.warn('Failed to store identity', e)
  }
}

/**
 * 투표자 등록 보장 (캐시 우선)
 * 
 * 동작 방식:
 * 1. localStorage 확인 → 있으면 즉시 반환
 * 2. 없으면 백엔드 POST /voter/register 호출
 * 3. 응답 받은 identity를 localStorage에 저장
 * 
 * @param address 지갑 주소
 * @param forceRefresh 강제 갱신 여부
 * @returns { identityNullifier, identityTrapdoor }
 */
export async function ensureRegistered(
  address: string,
  forceRefresh = false
): Promise<IdentityPayload> {
  if (!address) throw new Error('address is required')

  // 이미 있으면 재사용
  const cached = !forceRefresh ? getStoredIdentity(address) : null
  if (cached) return cached

  // 새로 백엔드에 등록 요청
  let res: Response
  try {
    res = await fetch(getRegisterUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    })
  } catch (err: unknown) {
    const error = err as { message?: string }
    throw new Error(`Network error: ${error.message || 'Unknown error'}`)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`voter/register failed: ${text}`)
  }

  const json = (await res.json()) as IdentityPayload

  // 백엔드 응답 검증
  if (!json.identityNullifier || !json.identityTrapdoor) {
    console.warn('⚠ Unexpected voter/register response:', json)
  }

  // 저장
  storeIdentity(address, json)

  return json
}
