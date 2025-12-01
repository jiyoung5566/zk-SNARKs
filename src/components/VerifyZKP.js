'use client'
import { useState } from 'react'
import { verifyProof } from '@/lib/web3'

export default function VerifyZKP() {
  const [proof, setProof] = useState('')
  const [result, setResult] = useState(null)

  async function handleVerify() {
    const outcome = await verifyProof(proof)
    setResult(outcome ? '✅ 검증 성공' : '❌ 검증 실패')
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold mb-4">ZKP 검증</h2>
      <input
        type="text"
        placeholder="Proof 입력"
        value={proof}
        onChange={(e) => setProof(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      />
      <button
        onClick={handleVerify}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        검증 실행
      </button>
      {result && <p className="mt-4 font-semibold">{result}</p>}
    </div>
  )
}
