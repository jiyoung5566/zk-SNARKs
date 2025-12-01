// import * as snarkjs from 'snarkjs'

// /** 프론트에서 증명 생성 (공개신호 없음) */
// export async function generateVoteProof(vote: 0 | 1) {
//   const wasmPath = '/zkp/example.wasm' // public/zkp/ 경로
//   const zkeyPath = '/zkp/example_final.zkey' // public/zkp/ 경로

//   const input = { vote } // 0 또는 1만 허용 (회로 제약)

//   const { proof, publicSignals } = await snarkjs.groth16.fullProve(
//     input,
//     wasmPath,
//     zkeyPath
//   )

//   console.log('publicSignals:', publicSignals) // 항상 []

//   // Solidity용 호출 데이터 변환
//   const calldata = await snarkjs.groth16.exportSolidityCallData(
//     proof,
//     publicSignals
//   )
//   const [A, B, C, Input] = JSON.parse(`[${calldata}]`)

//   const a: [string, string] = [A[0], A[1]]
//   const b: [[string, string], [string, string]] = [
//     [B[0][0], B[0][1]],
//     [B[1][0], B[1][1]],
//   ]
//   const c: [string, string] = [C[0], C[1]]
//   const inputSignals: string[] = Input // 현재 회로는 []

//   return { a, b, c, inputSignals, proof }
// }

// src/lib/zkp.ts
import * as snarkjs from 'snarkjs'

/**
 * 사용자의 투표 입력값(0 또는 1)에 대해 ZKP 증명 생성
 */
export async function generateVoteProof(vote: 0 | 1) {
  console.log('🔹 증명 생성 시작:', { vote })

  // ✅ public/zkp 폴더 내 파일 경로
  const wasmPath = '/zkp/example.wasm'
  const zkeyPath = '/zkp/example_final.zkey'

  const input = { vote }

  // snarkjs로 증명 생성
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  )

  console.log('publicSignals:', publicSignals) // 항상 []

  // Solidity verifier에 보낼 calldata 변환
  const calldata = await snarkjs.groth16.exportSolidityCallData(
    proof,
    publicSignals
  )
  const [A, B, C, Input] = JSON.parse(`[${calldata}]`)

  // 타입 명시 (TS 경고 방지)
  const a: [string, string] = [A[0], A[1]]
  const b: [[string, string], [string, string]] = [
    [B[0][0], B[0][1]],
    [B[1][0], B[1][1]],
  ]
  const c: [string, string] = [C[0], C[1]]
  const inputSignals: string[] = Input

  return { a, b, c, inputSignals, proof }
}
