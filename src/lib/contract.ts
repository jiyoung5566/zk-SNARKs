/**
 * 🌐 Web3 & 스마트 컨트랙트 연동 핵심 로직
 *
 * 역할:
 * - Sepolia 테스트넷 연동
 * - RPC 폴백 (Alchemy → Infura → 공용)
 * - 가스 자동 추정 + 20% 버퍼
 * - 투표 트랜잭션 전송
 *
 * 주요 함수:
 * - getRpcProvider() - RPC 자동 폴백
 * - getVotingContract() - 쓰기 가능 컨트랙트
 * - submitVote() - 투표 제출 (가스 추정 포함)
 * - switchToSepolia() - 네트워크 전환
 */

import { ethers } from 'ethers'

// Sepolia 네트워크 체인 ID
export const SEPOLIA_CHAIN_ID = 11155111

/**
 * RPC 엔드포인트 목록 생성
 *
 * 폴백 전략:
 * 1순위: Alchemy (API 키 있으면)
 * 2순위: Infura (API 키 있으면)
 * 3순위: 공용 RPC (무료, 제한 있음)
 *
 * → 하나씩 시도해서 작동하는 것 사용
 */
const getRpcEndpoints = (): string[] => {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY

  const endpoints: string[] = []

  // 1. Alchemy (우선순위 1)
  if (alchemyKey) {
    endpoints.push(`https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}`)
  } else {
    // API 키가 없어도 공용 엔드포인트 시도 (제한적일 수 있음)
    endpoints.push('https://eth-sepolia.g.alchemy.com/v2/demo')
  }

  // 2. Infura (우선순위 2)
  if (infuraKey) {
    endpoints.push(`https://sepolia.infura.io/v3/${infuraKey}`)
  } else {
    endpoints.push('https://sepolia.infura.io/v3/')
  }

  // 3. 공용 RPC (우선순위 3)
  endpoints.push('https://rpc.sepolia.org')
  endpoints.push('https://sepolia.gateway.tenderly.co')
  endpoints.push('https://ethereum-sepolia-rpc.publicnode.com')

  return endpoints
}

// RPC 엔드포인트 목록
const RPC_ENDPOINTS = getRpcEndpoints()

/**
 * RPC 엔드포인트 테스트
 *
 * 체크 항목:
 * 1. 블록 번호 조회 가능한지
 * 2. 체인 ID가 Sepolia(11155111)인지
 *
 * @returns true면 사용 가능, false면 다음 RPC 시도
 */
async function testRpcEndpoint(url: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(url)
    const blockNumber = await provider.getBlockNumber()
    const network = await provider.getNetwork()
    const chainId = Number(network.chainId)

    // Sepolia 체인 ID 확인
    if (chainId !== SEPOLIA_CHAIN_ID) {
      console.warn(`RPC ${url}: 잘못된 체인 ID (${chainId})`)
      return false
    }

    console.log(`✅ RPC 작동 확인: ${url} (블록: ${blockNumber})`)
    return true
  } catch (error) {
    console.warn(`❌ RPC 실패: ${url}`, error)
    return false
  }
}

/**
 * 작동하는 RPC Provider 찾기 (폴백 + 캐싱)
 *
 * 동작 방식:
 * 1. 캐시된 Provider가 있으면 재사용
 * 2. 없거나 죽었으면 순차적으로 테스트
 * 3. 첫 번째 작동하는 RPC를 캐시
 *
 * @throws 모든 RPC 실패 시 에러
 */
let cachedProvider: ethers.JsonRpcProvider | null = null
let cachedProviderUrl: string | null = null

export async function getRpcProvider(): Promise<ethers.JsonRpcProvider> {
  // 캐시된 provider가 있고 여전히 작동하는지 확인
  if (cachedProvider && cachedProviderUrl) {
    try {
      await cachedProvider.getBlockNumber()
      return cachedProvider
    } catch {
      // 캐시된 provider가 작동하지 않으면 재시도
      cachedProvider = null
      cachedProviderUrl = null
    }
  }

  // 각 RPC 엔드포인트를 순차적으로 시도
  for (const endpoint of RPC_ENDPOINTS) {
    const isWorking = await testRpcEndpoint(endpoint)
    if (isWorking) {
      cachedProvider = new ethers.JsonRpcProvider(endpoint)
      cachedProviderUrl = endpoint
      console.log(`✅ RPC Provider 선택: ${endpoint}`)
      return cachedProvider
    }
  }

  // 모든 RPC가 실패한 경우
  throw new Error(
    '모든 RPC 엔드포인트에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.'
  )
}

// 컨트랙트 주소
export const CONTRACT_ADDRESSES = {
  Voting: '0xcB6d6d49D4c9eC6635c4D294DbFE0875D7F5fAd8',
  Counter: '0xD74364bB94669E2A2810B0fe108880Ab1FcC712b',
} as const

// Voting 컨트랙트 ABI (블록체인팀 제공 사양 반영)
export const VOTING_ABI = [
  {
    inputs: [
      { internalType: 'string[]', name: 'proposalNames', type: 'string[]' },
      { internalType: 'address', name: 'verifierAddress', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'nullifierHash',
        type: 'bytes32',
      },
    ],
    name: 'AlreadyVoted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
    ],
    name: 'ProofVerified',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'voter',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'nullifierHash',
        type: 'bytes32',
      },
    ],
    name: 'Voted',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'getProposal',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'voteCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '_hash', type: 'bytes32' }],
    name: 'isUsed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'nullifierUsed',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'proposals',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'uint256', name: 'voteCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'verifier',
    outputs: [{ internalType: 'contract Verifier', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'bytes', name: 'proof', type: 'bytes' },
      { internalType: 'uint256[]', name: 'pubSignals', type: 'uint256[]' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// Counter 컨트랙트 ABI (기본 구조 - 실제 ABI 파일로 교체 필요)
// TODO: 블록체인 팀에서 받은 실제 Counter.abi 파일 내용으로 교체
export const COUNTER_ABI = [
  'function increment() public',
  'function getCount() public view returns (uint256)',
] as const

/**
 * Sepolia 네트워크로 전환 요청
 */
export async function switchToSepolia(): Promise<boolean> {
  if (!window.ethereum) {
    alert('Metamask를 설치해주세요!')
    return false
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
    })
    return true
  } catch (switchError: unknown) {
    const error = switchError as { code?: number; message?: string }
    // 네트워크가 추가되지 않은 경우
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
              chainName: 'Sepolia',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        })
        return true
      } catch (addError) {
        console.error('네트워크 추가 실패:', addError)
        return false
      }
    }
    console.error('네트워크 전환 실패:', switchError)
    return false
  }
}

/**
 * 현재 네트워크가 Sepolia인지 확인
 */
export async function isSepoliaNetwork(): Promise<boolean> {
  if (!window.ethereum) return false

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    })
    return parseInt(chainId as string, 16) === SEPOLIA_CHAIN_ID
  } catch (error) {
    console.error('체인 ID 확인 실패:', error)
    return false
  }
}

/**
 * Voting 컨트랙트 인스턴스 가져오기 (쓰기 가능 - Signer 포함)
 */
export async function getVotingContract() {
  if (!window.ethereum) {
    throw new Error('Metamask를 설치해주세요!')
  }

  // Sepolia 네트워크 확인 및 전환
  const isSepolia = await isSepoliaNetwork()
  if (!isSepolia) {
    const switched = await switchToSepolia()
    if (!switched) {
      throw new Error('Sepolia 네트워크로 전환할 수 없습니다.')
    }
  }

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.Voting,
    VOTING_ABI,
    signer
  )

  return contract
}

/**
 * Voting 컨트랙트 인스턴스 가져오기 (읽기 전용 - RPC Provider 사용)
 */
export async function getVotingContractReadOnly() {
  const provider = await getRpcProvider()
  const contract = new ethers.Contract(
    CONTRACT_ADDRESSES.Voting,
    VOTING_ABI,
    provider
  )
  return contract
}

/**
 * 투표 트랜잭션 전송 (가스 추정 + 재시도)
 *
 * 흐름:
 * 1. 가스 추정 (estimateGas)
 * 2. 20% 버퍼 추가
 * 3. 트랜잭션 전송
 * 4. 확인 대기 (최대 5분)
 *
 * @param proposalId 제안 ID
 * @param payload { proofBytes, pubSignals }
 * @returns { txHash, receipt }
 */
export async function submitVote(
  proposalId: number,
  payload: {
    // 컨트랙트는 bytes proof + uint256[] pubSignals를 요구
    proofBytes: `0x${string}`
    pubSignals: (bigint | string | number)[]
  }
): Promise<{ txHash: string; receipt: ethers.ContractTransactionReceipt }> {
  const contract = await getVotingContract()

  try {
    // 1. 가스 추정
    let estimatedGas: bigint
    try {
      estimatedGas = await contract.vote.estimateGas(
        proposalId,
        payload.proofBytes,
        payload.pubSignals
      )
      console.log('추정된 가스:', estimatedGas.toString())
    } catch (estimateError: unknown) {
      const error = estimateError as { message?: string; reason?: string }
      console.error('가스 추정 실패:', error)

      // 가스 추정 실패 원인 분석
      if (error.message?.includes('insufficient funds')) {
        throw new Error(
          '가스비가 부족합니다. 지갑에 Sepolia ETH를 충전해주세요.'
        )
      } else if (error.message?.includes('revert') || error.reason) {
        throw new Error(
          `트랜잭션 실행 불가: ${
            error.reason || '컨트랙트 실행 실패 (이미 투표했거나 잘못된 입력)'
          }`
        )
      } else {
        throw new Error(
          '가스 추정에 실패했습니다. 네트워크 상태를 확인해주세요.'
        )
      }
    }

    // 2. 20% 버퍼 추가 (추정값 * 1.2)
    const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
    console.log('버퍼 포함 가스:', gasWithBuffer.toString())

    // 3. 트랜잭션 전송 (ABI에 맞춘 시그니처)
    let tx: ethers.ContractTransactionResponse
    try {
      tx = await contract.vote(
        proposalId,
        payload.proofBytes,
        payload.pubSignals,
        {
          gasLimit: gasWithBuffer,
        }
      )
    } catch (sendError: unknown) {
      const error = sendError as { code?: string; message?: string }
      console.error('트랜잭션 전송 실패:', error)

      if (error.code === 'ACTION_REJECTED') {
        throw new Error('트랜잭션이 거부되었습니다.')
      } else if (error.message?.includes('insufficient funds')) {
        throw new Error(
          '가스비가 부족합니다. 지갑에 Sepolia ETH를 충전해주세요.'
        )
      } else {
        throw new Error(
          `트랜잭션 전송 실패: ${error.message || '알 수 없는 오류'}`
        )
      }
    }

    console.log('트랜잭션 전송됨:', tx.hash)
    console.log('사용된 가스:', {
      추정값: estimatedGas.toString(),
      버퍼포함: gasWithBuffer.toString(),
      실제사용: '대기중...',
    })

    // 4. 트랜잭션 완료 대기 (타임아웃 5분)
    let receipt: ethers.ContractTransactionReceipt | null
    try {
      // 타임아웃 설정 (5분 = 300초)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              '트랜잭션 확인 시간이 초과되었습니다. 네트워크가 혼잡할 수 있습니다. 트랜잭션 해시를 확인해주세요.'
            )
          )
        }, 300000) // 5분
      })

      receipt = await Promise.race([tx.wait(), timeoutPromise])
    } catch (waitError: unknown) {
      const error = waitError as { message?: string }
      console.error('트랜잭션 대기 실패:', error)

      // 타임아웃인 경우 트랜잭션 해시는 있으므로 반환
      if (error.message?.includes('시간이 초과')) {
        throw new Error(
          `${error.message}\n트랜잭션 해시: ${tx.hash}\nEtherscan에서 확인: https://sepolia.etherscan.io/tx/${tx.hash}`
        )
      } else if (
        error.message?.includes('replacement transaction underpriced')
      ) {
        throw new Error('네트워크가 혼잡합니다. 잠시 후 다시 시도해주세요.')
      } else {
        throw new Error(
          `트랜잭션 확인 실패: ${
            error.message || '네트워크 오류가 발생했습니다.'
          }`
        )
      }
    }

    console.log('트랜잭션 확인됨:', receipt)
    if (receipt) {
      console.log('실제 사용된 가스:', {
        추정값: estimatedGas.toString(),
        버퍼포함: gasWithBuffer.toString(),
        실제사용: receipt.gasUsed.toString(),
        절약량: (gasWithBuffer - receipt.gasUsed).toString(),
      })

      // 가스 사용량이 버퍼를 초과한 경우 경고
      if (receipt.gasUsed > gasWithBuffer) {
        console.warn('⚠️ 실제 가스 사용량이 버퍼를 초과했습니다!')
      }
    }

    return {
      txHash: tx.hash,
      receipt: receipt!,
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; reason?: string }
    console.error('투표 트랜잭션 실패:', err)

    // 이미 처리된 에러는 그대로 throw
    if (err.message && !err.message.includes('트랜잭션 실패')) {
      throw error
    }

    // 사용자 친화적인 에러 메시지
    if (err.code === 'ACTION_REJECTED') {
      throw new Error('트랜잭션이 거부되었습니다.')
    } else if (err.reason) {
      throw new Error(`트랜잭션 실패: ${err.reason}`)
    } else if (err.message) {
      throw error // 이미 처리된 에러 메시지
    } else {
      throw new Error(`트랜잭션 실패: ${err.message || '알 수 없는 오류'}`)
    }
  }
}

/**
 * 특정 제안(proposal) 정보 조회 (읽기 전용 - RPC 폴백 사용)
 */
export async function getProposal(
  proposalId: number
): Promise<{ name: string; voteCount: bigint }> {
  try {
    const contract = await getVotingContractReadOnly()
    return await contract.getProposal(proposalId)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('제안 조회 실패:', err)
    throw new Error(`제안 조회 실패: ${err.message || '알 수 없는 오류'}`)
  }
}

/**
 * nullifier 해시가 사용되었는지 확인 (읽기 전용 - RPC 폴백 사용)
 */
export async function isNullifierUsed(nullifierHash: string): Promise<boolean> {
  try {
    const contract = await getVotingContractReadOnly()
    return await contract.isUsed(nullifierHash)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('nullifier 확인 실패:', err)
    throw new Error(`nullifier 확인 실패: ${err.message || '알 수 없는 오류'}`)
  }
}

/**
 * 사용자가 이미 투표했는지 확인 (읽기 전용 - RPC 폴백 사용)
 * 주의: 컨트랙트에 hasVoted 함수가 없으면 nullifier 해시로 확인해야 함
 */
export async function hasVoted(address: string): Promise<boolean> {
  try {
    const contract = await getVotingContractReadOnly()
    // 컨트랙트에 hasVoted 함수가 있는 경우
    if (contract.hasVoted) {
      return await contract.hasVoted(address)
    }
    // 없으면 false 반환 (nullifier 해시로 확인해야 함)
    return false
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('투표 여부 확인 실패:', err)
    // 에러가 나도 false 반환 (에러를 숨기지 않음)
    throw new Error(`투표 여부 확인 실패: ${err.message || '알 수 없는 오류'}`)
  }
}
