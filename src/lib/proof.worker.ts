/**
 * WebWorker를 사용한 브라우저 내 증명 생성
 *
 * 목적: 메인 스레드를 블로킹하지 않고 백그라운드에서 ZKP 증명 생성
 *
 * 사용법:
 *   const worker = new Worker('/web/workers/proof.worker.ts');
 *   worker.postMessage({
 *     input: {...},  // 투표 입력 데이터
 *     wasmPath: '/build/v1.2/vote_js/vote.wasm',
 *     zkeyPath: '/build/v1.2/vote_final.zkey'
 *   });
 *
 * 응답:
 *   { ok: true, ms: 3456, proof: "...", publicSignals: [...] }
 *   또는
 *   { ok: false, ms: 1234, error: "..." }
 */

/// <reference lib="WebWorker" />
import { groth16 } from 'snarkjs'

/**
 * Worker 요청 타입
 * - input: 투표 데이터 (vote, voteBit0-2, salt, nullifierSecret, pathElements, pathIndex, pollId)
 * - wasmPath: WASM 파일 URL (public 폴더 기준)
 * - zkeyPath: ZKEY 파일 URL (public 폴더 기준)
 */
type WorkerRequest = {
  input: Record<string, unknown>
  wasmPath: string
  zkeyPath: string
}

/**
 * Worker 응답 타입
 * - 성공: proof(JSON 문자열), publicSignals, 소요 시간(ms)
 * - 실패: 에러 메시지, 소요 시간(ms)
 */
type WorkerResponse =
  | { ok: true; ms: number; proof: string; publicSignals: unknown }
  | { ok: false; ms: number; error: string }

/**
 * 메인 메시지 핸들러
 * - 프론트엔드에서 postMessage()로 호출됨
 * - groth16.fullProve()로 증명 생성 (3~5초 소요)
 * - 결과를 postMessage()로 반환
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const started = performance.now()
  try {
    const { input, wasmPath, zkeyPath } = event.data

    // snarkjs의 groth16.fullProve는 파일 경로(URL)를 직접 받습니다
    // 브라우저에서는 public 폴더의 URL을 사용하거나 CDN URL을 사용합니다
    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    )

    // 성공 응답: proof는 JSON 문자열로 직렬화, publicSignals는 배열 그대로
    const payload: WorkerResponse = {
      ok: true,
      ms: performance.now() - started,
      proof: JSON.stringify(proof),
      publicSignals, // [root, pollId, nullifier, voteCommitment]
    }
    postMessage(payload)
  } catch (err) {
    // 실패 응답: 에러 메시지 포함
    const payload: WorkerResponse = {
      ok: false,
      ms: performance.now() - started,
      error: err instanceof Error ? err.message : String(err),
    }
    postMessage(payload)
  }
}

export {}
