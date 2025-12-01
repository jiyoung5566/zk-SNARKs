'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getVotes, type Vote } from '@/lib/voteStorage'

export default function Home() {
  const [votes, setVotes] = useState<Vote[]>([])

  useEffect(() => {
    // 컴포넌트 마운트 시 투표 목록 로드
    setVotes(getVotes())
  }, [])

  // 다른 탭에서 투표가 추가되었을 수 있으므로 포커스 시 다시 로드
  useEffect(() => {
    const handleFocus = () => {
      setVotes(getVotes())
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6">
      <h1 className="text-3xl font-bold mb-6">투표 목록</h1>

      {votes.length === 0 ? (
        <p className="text-gray-500 mb-6">등록된 투표가 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {votes.map((vote) => (
            <li key={vote.id}>
              <Link
                href={`/vote/${vote.id}`}
                className="block p-4 border rounded-xl shadow hover:bg-gray-50 transition"
              >
                <h3 className="font-semibold text-lg mb-1">{vote.title}</h3>
                {vote.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {vote.description}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link
          href="/vote/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          새 투표 만들기
        </Link>
      </div>
    </div>
  )
}
