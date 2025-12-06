'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getVoteById, type Vote } from '@/lib/voteStorage'
import { useWallet } from '@/contexts/WalletContext'
import { ensureRegistered } from '@/lib/user'
import ConnectWalletButton from '@/components/ConnectWalletButton'
import StatusBadge from '@/components/StatusBadge'
import RelayerToggle from '@/components/RelayerToggle'

// WebWorker 로딩
const proofWorker =
  typeof window !== 'undefined'
    ? new Worker(new URL('@/lib/proof.worker.ts', import.meta.url))
    : null

type StatusType =
  | 'idle'
  | 'connecting'
  | 'registering'
  | 'generating-proof'
  | 'submitting'
  | 'confirming'
  | 'confirmed'
  | 'error'
  | 'duplicate'

export default function VoteDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const pollId = Number(params.id)

  const { isConnected, address } = useWallet()

  const [vote, setVote] = useState<Vote | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<StatusType>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [relayerEnabled, setRelayerEnabled] = useState(true)

  useEffect(() => {
    const v = getVoteById(String(pollId))
    if (!v) {
      alert('투표 정보를 찾을 수 없습니다.')
      router.push('/')
      return
    }
    setVote(v)
  }, [pollId, router])

  /** Proof 생성: WebWorker → 서버 fallback */
  const generateProof = async (input: unknown) => {
    if (proofWorker) {
      try {
        const proof = await new Promise<{
          ok: boolean
          proof: string
          publicSignals: any
          error?: string
        }>((resolve, reject) => {
          proofWorker.onmessage = (event) => {
            const data = event.data
            if (data.ok) return resolve(data)
            reject(new Error(data.error))
          }

          proofWorker.postMessage({
            input,
            wasmPath: '/build/v1.2/vote_js/vote.wasm',
            zkeyPath: '/build/v1.2/vote_final.zkey',
          })
        })
        console.log('[VoteDetail] WebWorker proof OK')
        return proof
      } catch (err) {
        console.warn(
          '[VoteDetail] WebWorker proof failed, fallback to server:',
          err
        )
      }
    }

    // 서버 fallback
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const res = await fetch(`${apiUrl}/api/proof/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`Server proof failed: ${res.status} ${text}`)
      }

      const json = await res.json()
      console.log('[VoteDetail] Server proof OK', json)
      return json
    } catch (err) {
      console.error('[VoteDetail] Proof generation failed:', err)
      throw new Error('ZKP 생성 실패')
    }
  }

  /** 투표 버튼 클릭 */
  const handleVoteClick = async () => {
    if (!isConnected || !address) {
      alert('지갑을 먼저 연결해주세요.')
      return
    }
    if (!selectedOption) {
      alert('선택지를 선택해주세요!')
      return
    }

    try {
      setLoading(true)
      setStatus('registering')
      setStatusMessage('투표자 등록 중...')

      // ① 투표자 등록
      const identity = await ensureRegistered(address)
      const { identityNullifier, identityTrapdoor } = identity

      // ② poll 공개 정보 가져오기
      setStatus('connecting')
      setStatusMessage('Merkle proof 불러오는 중...')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const pollUrl = `${apiUrl}/api/polls/${pollId}/public`

      console.log('[VoteDetail] poll fetch URL:', pollUrl)
      const pollRes = await fetch(pollUrl)
      if (!pollRes.ok) {
        const text = await pollRes.text().catch(() => '')
        throw new Error(
          `투표 정보를 불러오지 못했습니다. (status ${pollRes.status}) ${text}`
        )
      }

      const pollJson = await pollRes.json()
      const { root, merkleProof } = pollJson
      const { pathElements, pathIndices } = merkleProof

      // ③ 선택지 인덱스
      const optionIndex =
        vote?.options.findIndex((o) => o === selectedOption) ?? 0

      // ④ Worker input 구성 (v1.2 format)
      const input = {
        pollId,
        vote: optionIndex,
        identityNullifier,
        identityTrapdoor,
        merkleProof: {
          root,
          pathElements,
          pathIndices,
        },
      }

      // ⑤ ZKP 생성
      setStatus('generating-proof')
      setStatusMessage('ZKP 증명 생성 중... (WebWorker 혹은 서버)')
      const proof = await generateProof(input)
      const { proof: proofJsonStr, publicSignals } = proof

      // ⑥ publicSignals 순서 재정렬 (v1.2 docs 기준)
      const reorderedPublicSignals = [
        publicSignals.root,
        publicSignals.pollId,
        publicSignals.nullifier,
        publicSignals.voteCommitment,
      ]

      // ⑦ Relayer 전송
      setStatus('submitting')
      setStatusMessage('블록체인에 투표 전송 중...')

      if (!relayerEnabled) throw new Error('직접 전송 기능 미구현')

      const relayerUrl =
        process.env.NEXT_PUBLIC_RELAYER_URL || `${apiUrl}/api/relayer/send`
      const relayerRes = await fetch(relayerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId,
          proof: proofJsonStr,
          publicSignals: reorderedPublicSignals,
        }),
      })

      if (!relayerRes.ok) {
        const text = await relayerRes.text().catch(() => '')
        throw new Error(`Relayer 오류: ${relayerRes.status} ${text}`)
      }

      const relayerJson = await relayerRes.json()
      if (!relayerJson.ok) throw new Error(relayerJson.error || 'Relayer 오류')

      setTxHash(relayerJson.txHash)
      setStatus('confirming')
      setStatusMessage('트랜잭션 확인 중 (최대 2회)')

      setTimeout(() => {
        setStatus('confirmed')
        setStatusMessage(`"${selectedOption}" 투표 완료!`)
      }, 3000)
    } catch (err: unknown) {
      const error = err as { message?: string }
      console.error('[VoteDetail] handleVoteClick error:', error)
      setStatus('error')
      setStatusMessage(error.message || '알 수 없는 오류')
      alert(`투표 실패: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!vote) return <p>로딩...</p>

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6">
      <Link
        href="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
      >
        ← 투표 목록으로 돌아가기
      </Link>

      <h1 className="text-3xl font-bold mb-4">{vote.title}</h1>
      <p className="text-gray-600 mb-6">{vote.description}</p>

      <ConnectWalletButton />

      {status !== 'idle' && (
        <div className="mt-6">
          <StatusBadge
            status={status}
            message={statusMessage}
            txHash={txHash}
          />
        </div>
      )}

      <div className="mt-6">
        <RelayerToggle
          enabled={relayerEnabled}
          onToggle={setRelayerEnabled}
          disabled={loading}
        />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">선택지</h2>

        {vote.options.map((opt) => (
          <label
            key={opt}
            className={`block p-4 border rounded-xl mb-3 cursor-pointer ${
              selectedOption === opt
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              checked={selectedOption === opt}
              onChange={() => setSelectedOption(opt)}
              className="mr-3"
            />
            {opt}
          </label>
        ))}
      </div>

      <button
        onClick={handleVoteClick}
        disabled={!selectedOption || !isConnected || loading}
        className={`mt-4 px-6 py-3 rounded-xl font-semibold ${
          !selectedOption || !isConnected
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? statusMessage || '처리 중...' : '투표하기 (ZKP 생성)'}
      </button>

      {txHash && (
        <div className="mt-6 p-4 bg-green-50 rounded-xl">
          <p className="font-semibold text-green-800">투표 완료!</p>
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            className="text-blue-600 underline"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  )
}
