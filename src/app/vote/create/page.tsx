'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateVotePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)

  const handleAddOption = () => {
    setOptions([...options, ''])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('제목을 입력해주세요!')
      return
    }

    const validOptions = options.filter((opt) => opt.trim())
    if (validOptions.length < 2) {
      alert('최소 2개 이상의 선택지를 입력해주세요!')
      return
    }

    setLoading(true)

    try {
      // localStorage에 투표 저장
      const { addVote } = await import('@/lib/voteStorage')
      const newVote = addVote({
        title: title.trim(),
        description: description.trim(),
        options: validOptions,
      })

      alert('투표가 생성되었습니다!')
      router.push('/')
    } catch (error) {
      console.error('투표 생성 실패:', error)
      alert('투표 생성 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6">
      <h1 className="text-3xl font-bold mb-6">새 투표 만들기</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            제목 *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="투표 제목을 입력하세요"
            required
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="투표에 대한 설명을 입력하세요 (선택사항)"
            rows={4}
          />
        </div>

        {/* 선택지 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            선택지 * (최소 2개)
          </label>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`선택지 ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddOption}
            className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
          >
            + 선택지 추가
          </button>
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '생성 중...' : '투표 생성하기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
