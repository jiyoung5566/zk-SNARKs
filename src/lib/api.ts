// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL

// 공통 fetch wrapper
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  const text = await res.text()
  let json: any

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    // JSON 파싱 실패 시 - 문자열 응답
    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`)
    }
    return text
  }

  // 백엔드 응답에 success 필드가 있는 경우
  if (typeof json === 'object' && json !== null && 'success' in json) {
    if (!json.success) {
      throw new Error(json.message || 'Unknown error')
    }
    return json
  }

  // 표준 HTTP 상태 코드 확인
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`)
  }

  return json
}

/* -------------------------
  1) Relayer Send
------------------------- */
export function sendRelayer(data: any) {
  return apiFetch(`/api/relayer/send`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/* -------------------------
  2) Voter Register
------------------------- */
export function registerVoter(data: any) {
  return apiFetch(`/api/user/register`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/* -------------------------
  투표 시스템 API
------------------------- */

// 1) 투표 생성
export function createPoll(data: any) {
  return apiFetch(`/api/polls`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// 2) 투표 목록 조회
export function getPolls() {
  return apiFetch(`/api/polls`, {
    method: 'GET',
  }).then((res) => {
    if (res.data) return res.data
    return res
  })
}

// 3) 투표 공개 정보 조회
export function getPublicPollInfo(pollId: string) {
  return apiFetch(`/api/polls/${pollId}/public`).then((res) => {
    // 백엔드 응답 형식에 따라 data 필드 추출
    if (res.data) return res.data
    return res
  })
}

// 4) 투표 제출
export function submitVote(data: any) {
  return apiFetch(`/api/vote`, {
    method: 'POST',
    body: JSON.stringify(data),
  }).then((res) => {
    if (res.data) return res.data
    return res
  })
}

// 5) 투표 결과 조회
export function getPollResults(pollId: string) {
  return apiFetch(`/api/polls/${pollId}/results`).then((res) => {
    if (res.data) return res.data
    return res
  })
}
