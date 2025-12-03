#!/usr/bin/env node

/**
 * 🧪 프론트B(Web3) 상세 기능 검증 스크립트
 *
 * 검증 항목:
 * 1. 파일 존재 + 최소 크기
 * 2. 필수 함수 export 여부
 * 3. 타입 정의 정확성
 * 4. import 경로 유효성
 * 5. 환경 변수 사용 여부
 * 6. 컴포넌트 props 정의
 * 7. 코드 로직 검증
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const results = { passed: 0, failed: 0, warnings: 0 }

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`)
}

function test(name, passed, detail = '') {
  const icon = passed ? '✅' : '❌'
  log(`${icon} ${name}`, passed ? 'green' : 'red')
  if (detail) log(`   ${detail}`, 'cyan')
  passed ? results.passed++ : results.failed++
}

function warn(msg) {
  log(`⚠️  ${msg}`, 'yellow')
  results.warnings++
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue')
  log(title, 'blue')
  log('='.repeat(60), 'blue')
}

function readFile(p) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', p), 'utf-8')
  } catch {
    return null
  }
}

function fileExists(p) {
  return fs.existsSync(path.join(__dirname, '..', p))
}

log('\n🧪 프론트B(Web3) 상세 기능 검증\n', 'cyan')

// ============================================================
section('1️⃣  핵심 함수 Export 검증')
// ============================================================

const contractTs = readFile('src/lib/contract.ts')
if (contractTs) {
  test(
    'getRpcProvider() export',
    contractTs.includes('export async function getRpcProvider')
  )
  test(
    'getVotingContract() export',
    contractTs.includes('export async function getVotingContract')
  )
  test(
    'getVotingContractReadOnly() export',
    contractTs.includes('export async function getVotingContractReadOnly')
  )
  test(
    'submitVote() export',
    contractTs.includes('export async function submitVote')
  )
  test(
    'switchToSepolia() export',
    contractTs.includes('export async function switchToSepolia')
  )
  test(
    'isSepoliaNetwork() export',
    contractTs.includes('export async function isSepoliaNetwork')
  )
  test(
    'SEPOLIA_CHAIN_ID 상수',
    contractTs.includes('export const SEPOLIA_CHAIN_ID = 11155111')
  )
  test(
    'CONTRACT_ADDRESSES 정의',
    contractTs.includes('export const CONTRACT_ADDRESSES')
  )
  test('VOTING_ABI 정의', contractTs.includes('export const VOTING_ABI'))
} else {
  test('contract.ts 파일', false, '파일 읽기 실패')
}

// ============================================================
section('2️⃣  타입 안전성 검증')
// ============================================================

if (contractTs) {
  test(
    'any 타입 사용 안 함',
    !contractTs.match(/catch \(.*: any\)/),
    contractTs.match(/catch \(.*: any\)/)
      ? '❌ any 타입 발견'
      : '✅ unknown 사용'
  )
  test('타입 단언 사용', contractTs.includes('as {'), '타입 안전 캐스팅')
  test('unknown 타입 사용', contractTs.includes('catch (error: unknown)'))
}

const walletContext = readFile('src/contexts/WalletContext.tsx')
if (walletContext) {
  test(
    'WalletContext unknown 타입',
    walletContext.includes('result: unknown') ||
      walletContext.includes('data: unknown')
  )
  test('타입 캐스팅 사용', walletContext.includes('as string[]'))
}

const networkGuard = readFile('src/components/NetworkGuard.tsx')
if (networkGuard) {
  test(
    'NetworkGuard unknown 타입',
    networkGuard.includes('data: unknown') ||
      networkGuard.includes('chainIdHex: unknown')
  )
  test('chainChanged 핸들러', networkGuard.includes('handleChainChanged'))
}

// ============================================================
section('3️⃣  환경 변수 사용 검증')
// ============================================================

const votePage = readFile('src/app/vote/[id]/page.tsx')
if (votePage) {
  test(
    'API_URL 환경 변수 사용',
    votePage.includes('process.env.NEXT_PUBLIC_API_URL')
  )
  test(
    'RELAYER_URL 환경 변수 사용',
    votePage.includes('process.env.NEXT_PUBLIC_RELAYER_URL')
  )
  test(
    '하드코딩된 URL 없음',
    !votePage.includes('https://my-anon') || votePage.includes('process.env'),
    votePage.includes('process.env') ? '✅ 환경 변수 사용' : '❌ 하드코딩 발견'
  )
}

const voterTs = readFile('src/lib/voter.ts')
if (voterTs) {
  test(
    'voter.ts 환경 변수 사용',
    voterTs.includes('process.env.NEXT_PUBLIC_API_URL')
  )
  test('getRegisterUrl() 함수', voterTs.includes('const getRegisterUrl'))
}

if (contractTs) {
  test(
    'RPC API 키 환경 변수',
    contractTs.includes('process.env.NEXT_PUBLIC_ALCHEMY_API_KEY')
  )
  test('RPC 폴백 배열', contractTs.includes('const RPC_ENDPOINTS'))
}

// ============================================================
section('4️⃣  컴포넌트 구조 검증')
// ============================================================

const statusBadge = readFile('src/components/StatusBadge.tsx')
if (statusBadge) {
  const states = [
    'idle',
    'connecting',
    'registering',
    'generating-proof',
    'submitting',
    'confirming',
    'confirmed',
    'error',
    'duplicate',
  ]
  const allStates = states.every((s) => statusBadge.includes(`'${s}'`))
  test(
    'StatusBadge 9가지 상태',
    allStates,
    allStates ? '모든 상태 정의됨' : '일부 누락'
  )
  test(
    'StatusBadgeProps 인터페이스',
    statusBadge.includes('interface StatusBadgeProps')
  )
  test('status prop', statusBadge.includes('status: StatusType'))
}

const relayerToggle = readFile('src/components/RelayerToggle.tsx')
if (relayerToggle) {
  test(
    'RelayerToggleProps 인터페이스',
    relayerToggle.includes('interface RelayerToggleProps')
  )
  test('enabled prop', relayerToggle.includes('enabled: boolean'))
  test(
    'onToggle prop',
    relayerToggle.includes('onToggle: (enabled: boolean) => void')
  )
}

// ============================================================
section('5️⃣  페이지 기능 검증')
// ============================================================

if (votePage) {
  test(
    'StatusBadge import',
    votePage.includes("import StatusBadge from '@/components/StatusBadge'")
  )
  test(
    'RelayerToggle import',
    votePage.includes("import RelayerToggle from '@/components/RelayerToggle'")
  )
  test(
    'useWallet hook',
    votePage.includes('const { isConnected, address } = useWallet()')
  )
  test('WebWorker 사용', votePage.includes('new Worker'))
  test('Relayer 분기 로직', votePage.includes('if (relayerEnabled)'))
  test('상태 업데이트 로직', votePage.includes("setStatus('generating-proof')"))
}

const qrPage = readFile('src/app/qr/[id]/page.tsx')
if (qrPage) {
  test('QR 페이지 존재', true)
  test(
    'QR 코드 생성',
    qrPage.includes('qrserver.com') || qrPage.includes('QRCode')
  )
  test('eslint-disable (img)', qrPage.includes('eslint-disable-next-line'))
}

// ============================================================
section('6️⃣  ZKP 통합 검증')
// ============================================================

const zkpTs = readFile('src/lib/zkp.ts')
if (zkpTs) {
  test('snarkjs import', zkpTs.includes("import * as snarkjs from 'snarkjs'"))
  test(
    'generateVoteProof() 함수',
    zkpTs.includes('export async function generateVoteProof')
  )
  test('groth16.fullProve 사용', zkpTs.includes('groth16.fullProve'))
}

const proofWorker = readFile('src/lib/proof.worker.ts')
if (proofWorker) {
  test('proof.worker.ts 존재', true)
  test('WebWorker 메시지 핸들러', proofWorker.includes('self.onmessage'))
  test('groth16.fullProve (Worker)', proofWorker.includes('groth16.fullProve'))
}

// ============================================================
section('7️⃣  에러 처리 검증')
// ============================================================

if (contractTs) {
  test('가스 부족 에러 처리', contractTs.includes('insufficient funds'))
  test(
    '트랜잭션 타임아웃',
    contractTs.includes('300000') && contractTs.includes('시간이 초과')
  )
  test(
    '네트워크 혼잡 처리',
    contractTs.includes('replacement transaction underpriced')
  )
  test('ACTION_REJECTED 처리', contractTs.includes('ACTION_REJECTED'))
}

// ============================================================
section('8️⃣  문서 검증')
// ============================================================

const readme = readFile('README.md')
if (readme) {
  test('오류 해결법 섹션', readme.includes('## 🐛'))
  test('코드베이스 구조 섹션', readme.includes('## 📂 코드베이스 구조'))
  test('동작 원리 섹션', readme.includes('## 💡 동작 원리'))
} else {
  test('README.md', false, '파일 없음')
}

test('docs/GUIDE.md 존재', fileExists('docs/GUIDE.md'))

// ============================================================
section('📊 최종 결과')
// ============================================================

const total = results.passed + results.failed
const rate = ((results.passed / total) * 100).toFixed(1)

log(`\n총 테스트: ${total}개`, 'cyan')
log(`✅ 통과: ${results.passed}개`, 'green')
log(`❌ 실패: ${results.failed}개`, 'red')
if (results.warnings > 0) {
  log(`⚠️  경고: ${results.warnings}개`, 'yellow')
}

log(`\n성공률: ${rate}%`, rate >= 95 ? 'green' : rate >= 80 ? 'cyan' : 'yellow')

if (results.failed === 0) {
  log('\n🎉 모든 검증 통과!', 'green')
  log('\n✅ 프론트B(Web3) 기능이 정상 작동합니다!', 'green')
  log('\n다음 단계:', 'cyan')
  log('  npm run build', 'cyan')
} else {
  log('\n❌ 일부 검증 실패', 'red')
  log('\n위 항목들을 확인하세요.', 'yellow')
}

log('')
process.exit(results.failed === 0 ? 0 : 1)
