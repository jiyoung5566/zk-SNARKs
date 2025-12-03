'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

interface WalletContextType {
  account: string | null
  address: string | null
  connectWallet: () => Promise<void>
  isConnected: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)

  useEffect(() => {
    // 페이지 로드 시 이미 연결된 지갑 확인
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((result: unknown) => {
          const accounts = result as string[]
          if (accounts.length > 0) {
            setAccount(accounts[0])
          }
        })
        .catch(console.error)

      // 지갑 계정 변경 감지
      const handleAccountsChanged = (data: unknown) => {
        const accounts = data as string[]
        setAccount(accounts.length > 0 ? accounts[0] : null)
      }
      
      window.ethereum.on('accountsChanged', handleAccountsChanged)
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Metamask가 필요합니다!')
      return
    }

    try {
      const result = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      const accounts = result as string[]
      setAccount(accounts[0])
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        account,
        address: account,
        connectWallet,
        isConnected: !!account,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
