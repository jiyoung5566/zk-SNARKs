// 투표 데이터 타입
export interface Vote {
  id: string
  title: string
  description: string
  options: string[]
  createdAt: number
}

const STORAGE_KEY = 'votes'

// 초기 더미 데이터
const initialVotes: Vote[] = [
  {
    id: '1',
    title: '제로지식증명 기반 투표 시스템 테스트',
    description: '이 투표는 블록체인 기반 투표 시스템의 UI 테스트용입니다.',
    options: ['찬성', '반대'],
    createdAt: Date.now() - 86400000, // 1일 전
  },
  {
    id: '2',
    title: '블록체인 투표 UI 개선안',
    description:
      '투표 시스템의 사용자 인터페이스 개선에 대한 의견을 수렴합니다.',
    options: ['개선 필요', '현재 상태 유지', '기타'],
    createdAt: Date.now() - 43200000, // 12시간 전
  },
]

// localStorage에서 투표 목록 가져오기
export function getVotes(): Vote[] {
  if (typeof window === 'undefined') return initialVotes

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
    // 저장된 데이터가 없으면 초기 데이터 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialVotes))
    return initialVotes
  } catch (error) {
    console.error('투표 데이터 로드 실패:', error)
    return initialVotes
  }
}

// 투표 추가
export function addVote(vote: Omit<Vote, 'id' | 'createdAt'>): Vote {
  const votes = getVotes()
  const newVote: Vote = {
    ...vote,
    id: Date.now().toString(),
    createdAt: Date.now(),
  }
  votes.push(newVote)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
  return newVote
}

// ID로 투표 가져오기
export function getVoteById(id: string): Vote | null {
  const votes = getVotes()
  return votes.find((vote) => vote.id === id) || null
}
