'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateVoteProof } from '@/lib/zkp'
import { submitVote } from '@/lib/contract'
import { getVoteById, type Vote } from '@/lib/voteStorage'
import { useWallet } from '@/contexts/WalletContext'
import ConnectWalletButton from '@/components/ConnectWalletButton'

export default function VoteDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const { isConnected } = useWallet()

  const [vote, setVote] = useState<Vote | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [result, setResult] = useState<any>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  useEffect(() => {
    const voteData = getVoteById(id)
    if (!voteData) {
      alert('투표를 찾을 수 없습니다.')
      router.push('/')
      return
    }
    setVote(voteData)
  }, [id, router])

  const handleVoteClick = async () => {
    if (!isConnected) {
      alert('투표를 하려면 지갑을 연결해주세요!')
      return
    }

    if (!selectedOption) {
      alert('선택지를 선택해주세요!')
      return
    }

    try {
      setLoading(true)
      setLoadingMessage('ZKP 증명 생성 중...')
      setTxHash(null)

      // 선택한 옵션의 인덱스를 찾아서 ZKP 생성 (0 또는 1로 변환)
      const optionIndex =
        vote?.options.findIndex((opt) => opt === selectedOption) ?? 0
      const voteValue = optionIndex === 0 ? 0 : 1 // 첫 번째 옵션이면 0, 아니면 1

      // 1. ZKP Proof 생성
      setLoadingMessage('ZKP 증명 생성 중...')
      const { a, b, c, inputSignals } = await generateVoteProof(
        voteValue as 0 | 1
      )
      console.log('🎉 Proof 생성 완료:', { a, b, c, inputSignals })
      setResult({ a, b, c, inputSignals })

      // 2. Sepolia 컨트랙트에 트랜잭션 전송
      // NOTE: 현재 우리 증명 포맷은 (a,b,c,inputSignals)이고, 컨트랙트는 bytes proof를 요구합니다.
      // 블록체인팀의 proof 인코딩 규약을 받기 전까지는 dummy 바이트로 트랜잭션 테스트만 수행합니다.
      const dummyProofBytes = '0x' as const
      const pubSignals = inputSignals.map((v) => BigInt(v))

      setLoadingMessage('가스 추정 중...')
      const { txHash: hash } = await submitVote(optionIndex, {
        proofBytes: dummyProofBytes,
        pubSignals,
      })

      setTxHash(hash)
      setLoadingMessage('트랜잭션 확인 대기 중... (최대 5분)')

      alert(
        `"${selectedOption}" 투표가 완료되었습니다!\n트랜잭션 해시: ${hash}`
      )
    } catch (error: any) {
      console.error('❌ 투표 실패:', error)

      // 에러 메시지에 따라 다른 안내
      let errorMessage = error.message || '알 수 없는 오류'

      if (errorMessage.includes('가스비가 부족')) {
        errorMessage =
          '가스비가 부족합니다.\n지갑에 Sepolia ETH를 충전해주세요.\n\nSepolia 테스트넷 ETH 받기:\nhttps://sepoliafaucet.com/'
      } else if (errorMessage.includes('시간이 초과')) {
        errorMessage = `${errorMessage}\n\n트랜잭션이 전송되었을 수 있습니다.\nEtherscan에서 확인해주세요.`
      } else if (errorMessage.includes('네트워크가 혼잡')) {
        errorMessage = '네트워크가 혼잡합니다.\n잠시 후 다시 시도해주세요.'
      } else if (errorMessage.includes('이미 투표')) {
        errorMessage =
          '이미 투표하셨습니다.\n한 계정당 한 번만 투표할 수 있습니다.'
      }

      alert(`투표 실패\n\n${errorMessage}`)
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  if (!vote) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6">
      {/* 투표 목록으로 돌아가기 버튼 */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 transition"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          투표 목록으로 돌아가기
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-4">{vote.title}</h1>
      {vote.description && (
        <p className="text-gray-600 mb-6">{vote.description}</p>
      )}

      {/* 지갑 연결 상태 표시 */}
      <div className="mb-6">
        <ConnectWalletButton />
      </div>

      {/* 선택지 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">선택지</h2>
        <div className="space-y-3">
          {vote.options.map((option) => (
            <label
              key={option}
              className={`block p-4 border rounded-xl cursor-pointer transition ${
                selectedOption === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="voteOption"
                value={option}
                checked={selectedOption === option}
                onChange={() => setSelectedOption(option)}
                className="mr-3"
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      {/* 투표 버튼 - 지갑 연결된 경우에만 활성화 */}
      <div className="mb-6">
        <button
          onClick={handleVoteClick}
          disabled={loading || !isConnected || !selectedOption}
          className={`px-6 py-3 rounded-xl font-semibold transition ${
            isConnected && selectedOption
              ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {loading
            ? loadingMessage || '처리 중...'
            : !isConnected
            ? '지갑 연결 후 투표 가능'
            : !selectedOption
            ? '선택지를 선택해주세요'
            : '투표하기 (ZKP 생성)'}
        </button>

        {loading && loadingMessage && (
          <p className="mt-2 text-sm text-gray-600">
            {loadingMessage}
            {loadingMessage.includes('대기 중') && (
              <span className="block mt-1 text-xs text-gray-500">
                네트워크가 혼잡하면 시간이 더 걸릴 수 있습니다.
              </span>
            )}
          </p>
        )}
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">✅ Proof 생성 결과</h3>
          <pre className="text-sm overflow-auto mb-4">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {txHash && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <h3 className="text-lg font-semibold mb-2 text-green-800">
            ✅ 트랜잭션 전송 완료
          </h3>
          <p className="text-sm text-gray-700 mb-2">트랜잭션 해시:</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 break-all text-sm"
          >
            {txHash}
          </a>
          <p className="text-xs text-gray-500 mt-2">
            Etherscan에서 트랜잭션을 확인할 수 있습니다.
          </p>
        </div>
      )}

      {/* 하단에도 돌아가기 버튼 추가 */}
      <div className="mt-8 pt-6 border-t">
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
        >
          투표 목록으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
