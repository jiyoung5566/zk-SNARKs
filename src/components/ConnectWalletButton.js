'use client'
import { useWallet } from '@/contexts/WalletContext'

export default function ConnectWalletButton() {
  const { account, connectWallet } = useWallet()

  return (
    <div>
      {account ? (
        <p className="text-green-600 font-semibold">
          연결된 지갑: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Metamask 연결하기
        </button>
      )}
    </div>
  )
}
