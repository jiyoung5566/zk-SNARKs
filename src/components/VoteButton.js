'use client'
import { useState } from 'react'
import { generateVoteProof } from '@/lib/zkp'

export default function VoteButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    try {
      setLoading(true)
      const { a, b, c, inputSignals } = await generateVoteProof(1) // 1로 테스트
      console.log('✅ proof to call:', { a, b, c, inputSignals })
      alert('ZKP 생성 성공! 콘솔 확인')
    } catch (e) {
      console.error(e)
      alert('❌ 증명 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{ padding: '10px 20px', marginTop: '20px' }}
    >
      {loading ? '생성 중...' : '투표(ZKP 생성)'}
    </button>
  )
}
