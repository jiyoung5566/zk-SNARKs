/**
 * 📱 QR 코드 전용 페이지
 *
 * 역할:
 * - 투표 링크를 QR 코드로 변환
 * - 현장 참여자에게 QR 스캔으로 참여 유도
 * - 시연/공유용 전용 화면
 *
 * QR 코드: Google Charts API 사용 (무료, 라이브러리 불필요)
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getVoteById, type Vote } from '@/lib/voteStorage'

export default function QRPage() {
  const params = useParams<{ id: string }>()
  const pollId = params.id
  const [vote, setVote] = useState<Vote | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    const v = getVoteById(pollId)
    setVote(v)

    // 투표 URL 생성
    const voteUrl = `${window.location.origin}/vote/${pollId}`
    setQrCodeUrl(voteUrl)
  }, [pollId])

  if (!vote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">투표를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">{vote.title}</h1>
        <p className="text-lg text-gray-600 mb-8">{vote.description}</p>

        {/* QR 코드 표시 (Google Charts API 사용) */}
        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 inline-block">
            {qrCodeUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                  qrCodeUrl
                )}`}
                alt="QR Code"
                className="w-[300px] h-[300px]"
              />
            )}
          </div>
          <p className="mt-6 text-sm text-gray-700 font-mono bg-white/50 rounded-lg p-3 break-all">
            {qrCodeUrl}
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-base text-gray-700">
            📱 <strong>참여 방법:</strong> QR 코드를 스캔하거나 아래 링크로
            접속하세요
          </p>
          <a
            href={`/vote/${pollId}`}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
          >
            직접 투표하기 →
          </a>
        </div>
      </div>
    </div>
  )
}
