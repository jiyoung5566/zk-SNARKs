/**
 * ABI 파일을 동적으로 로드하는 유틸리티
 *
 * 사용 방법:
 * 1. public/abi/ 폴더에 Voting.abi, Counter.abi 파일을 넣어주세요
 * 2. 또는 src/lib/abis/ 폴더에 넣고 import해서 사용하세요
 */

/**
 * public 폴더에서 ABI 파일 로드
 */
export async function loadABIFromPublic(filename: string): Promise<any[]> {
  try {
    const response = await fetch(`/abi/${filename}`)
    if (!response.ok) {
      throw new Error(`ABI 파일을 찾을 수 없습니다: ${filename}`)
    }
    const abi = await response.json()
    return abi
  } catch (error) {
    console.error(`ABI 로드 실패 (${filename}):`, error)
    throw error
  }
}

/**
 * ABI 파일을 직접 import해서 사용 (권장)
 *
 * 예시:
 * import VotingABI from '@/abis/Voting.json'
 * import CounterABI from '@/abis/Counter.json'
 */
export type ABI = any[]
