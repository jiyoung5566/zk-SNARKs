// lib/generateProof.js
import * as snarkjs from 'snarkjs'

/**
 * 사용자의 입력을 받아 ZKP 증명(proof)과 공개 신호(publicSignals)를 생성
 * @param {object} circuitInputs - 회로에 전달될 입력 값
 * @returns {Promise<{proof: object, publicSignals: Array<string>}>}
 */
export async function generateProof(circuitInputs) {
  console.log('🔹 증명 생성 시작:', circuitInputs)

  const wasmPath = '/example.wasm'
  const zkeyPath = '/example_0000.zkey'

  // snarkjs에서 groth16 모듈을 명시적으로 호출
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInputs,
    wasmPath,
    zkeyPath
  )

  console.log('✅ 생성된 Proof:', proof)
  return { proof, publicSignals }
}
