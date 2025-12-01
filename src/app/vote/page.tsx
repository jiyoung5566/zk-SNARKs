'use client'

import Link from 'next/link'

export default function VoteListPage() {
  // 임시 더미 데이터
  const votes = [
    { id: '1', title: '제로지식증명 기반 투표 시스템 테스트' },
    { id: '2', title: '블록체인 투표 UI 개선안' },
  ]

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6">
      <h1 className="text-3xl font-bold mb-6">투표 목록</h1>

      <ul className="space-y-4">
        {votes.map((vote) => (
          <li key={vote.id}>
            <Link
              href={`/vote/${vote.id}`}
              className="block p-4 border rounded-xl shadow hover:bg-gray-50 transition"
            >
              {vote.title}
            </Link>
          </li>
        ))}
      </ul>

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
