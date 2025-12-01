import { ethers } from 'ethers'

let provider
let contract

export async function connectContract() {
  if (!window.ethereum) {
    alert('Metamask를 설치해주세요!')
    return null
  }

  provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()

  // ⚠️ 이 부분은 나중에 ZKP & 스마트컨트랙트 팀이 주는 값으로 바꾸기
  const contractAddress = '0x0000000000000000000000000000000000000000'
  const abi = [
    'function verifyProof(string memory proof) public pure returns (bool)',
  ]

  contract = new ethers.Contract(contractAddress, abi, signer)
  return contract
}

export async function verifyProof(proofData) {
  if (!contract) await connectContract()
  try {
    const result = await contract.verifyProof(proofData)
    return result
  } catch (error) {
    console.error('검증 중 오류:', error)
    return false
  }
}
