/**
 * 🎨 투표 상태 배지 컴포넌트
 *
 * 9가지 상태를 아이콘 + 색상으로 표시:
 * idle → connecting → registering → generating-proof
 * → submitting → confirming → confirmed (or error/duplicate)
 *
 * 사용:
 * <StatusBadge status="generating-proof" message="3~5초" txHash="0x..." />
 */

'use client'

type StatusType =
  | 'idle' // ⏸️ 대기 중
  | 'connecting' // 🔗 지갑 연결 중
  | 'registering' // 📝 등록 중
  | 'generating-proof' // 🔐 증명 생성 중
  | 'submitting' // ⬆️ 제출 중
  | 'confirming' // ⏳ 검증 중
  | 'confirmed' // ✅ 완료
  | 'error' // ❌ 오류
  | 'duplicate' // ⚠️ 중복

interface StatusBadgeProps {
  status: StatusType
  message?: string
  txHash?: string | null
}

export default function StatusBadge({
  status,
  message,
  txHash,
}: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'idle':
        return {
          label: '대기 중',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: '⏸️',
        }
      case 'connecting':
        return {
          label: '지갑 연결 중',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: '🔗',
        }
      case 'registering':
        return {
          label: '투표자 등록 중',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          icon: '📝',
        }
      case 'generating-proof':
        return {
          label: '증명 생성 중',
          color: 'bg-purple-100 text-purple-700 border-purple-300',
          icon: '🔐',
        }
      case 'submitting':
        return {
          label: '제출 중',
          color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
          icon: '⬆️',
        }
      case 'confirming':
        return {
          label: '검증 중',
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          icon: '⏳',
        }
      case 'confirmed':
        return {
          label: '완료',
          color: 'bg-green-100 text-green-700 border-green-300',
          icon: '✅',
        }
      case 'error':
        return {
          label: '오류',
          color: 'bg-red-100 text-red-700 border-red-300',
          icon: '❌',
        }
      case 'duplicate':
        return {
          label: '중복 투표',
          color: 'bg-red-100 text-red-700 border-red-300',
          icon: '⚠️',
        }
      default:
        return {
          label: '알 수 없음',
          color: 'bg-gray-100 text-gray-700 border-gray-300',
          icon: '❓',
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${config.color} font-semibold text-sm transition-all`}
    >
      <span className="text-lg">{config.icon}</span>
      <span>{config.label}</span>
      {message && <span className="text-xs opacity-75">({message})</span>}
      {txHash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-xs underline hover:opacity-75"
        >
          Etherscan ↗
        </a>
      )}
    </div>
  )
}
