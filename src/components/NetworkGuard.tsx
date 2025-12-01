'use client'

import { useEffect, useState } from 'react'
import {
  isSepoliaNetwork,
  switchToSepolia,
  SEPOLIA_CHAIN_ID,
} from '@/lib/contract'

export default function NetworkGuard() {
  const [isSepolia, setIsSepolia] = useState<boolean | null>(null)
  const [autoTried, setAutoTried] = useState(false)

  useEffect(() => {
    let canceled = false
    async function ensureSepolia() {
      if (!window.ethereum) {
        setIsSepolia(null)
        return
      }
      const onChainChanged = (id: string) => {
        const dec = parseInt(id, 16)
        console.log('CHAIN_ID =', dec)
        setIsSepolia(dec === SEPOLIA_CHAIN_ID)
      }
      // 타입 정의가 accountsChanged 시그니처로 되어 있어 캐스팅
      ;(window.ethereum as any).on?.('chainChanged', onChainChanged)

      try {
        // 현재 체인 읽고 로그 출력
        const chainHex = (await window.ethereum.request({
          method: 'eth_chainId',
        })) as string
        const chainDec = parseInt(chainHex, 16)
        console.log('CHAIN_ID =', chainDec)

        const ok = await isSepoliaNetwork()
        if (canceled) return
        if (!ok && !autoTried) {
          setAutoTried(true)
          const switched = await switchToSepolia()
          if (canceled) return
          if (switched) {
            setIsSepolia(true)
          } else {
            setIsSepolia(false)
          }
        } else {
          setIsSepolia(ok)
        }
      } catch {
        setIsSepolia(false)
      }

      return () => {
        ;(window.ethereum as any)?.removeListener?.(
          'chainChanged',
          onChainChanged
        )
      }
    }
    ensureSepolia()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sepolia인 경우에도 상단에 확인용 작은 배너를 잠깐 노출할 수도 있으나
  // 요청사항은 콘솔/배너에서 CHAIN_ID 확인이므로, 비-Sepolia일 때 배너 보여주며 CHAIN_ID도 표시
  if (isSepolia === null || isSepolia === true) return null

  return (
    <div className="w-full bg-yellow-50 text-yellow-900 border-b border-yellow-200 text-sm">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <span>
          현재 네트워크가 Sepolia가 아닙니다. Sepolia(11155111)로 전환해주세요.{' '}
          <strong>(CHAIN_ID 콘솔 로그 확인 가능)</strong>
        </span>
        <button
          onClick={async () => {
            const switched = await switchToSepolia()
            setIsSepolia(switched)
          }}
          className="px-3 py-1 rounded-md bg-yellow-200 hover:bg-yellow-300 transition"
        >
          Sepolia로 전환
        </button>
      </div>
    </div>
  )
}
