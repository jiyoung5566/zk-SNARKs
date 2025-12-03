# 🗳️ ZKP 투표 시스템

> 제로지식증명(ZKP) + 블록체인 기반 익명 투표

**핵심**: 신원/선택은 숨기고, 유효성(1인1표)만 증명

---

## 🚀 빠른 시작

```bash
npm install
cp env.example .env.local
npm run dev
```

http://localhost:3000

---

## 📂 코드베이스 구조

### 🔐 핵심 로직 (src/lib/)

**contract.ts** ⭐ 가장 중요

```typescript
// 1. RPC 자동 폴백 (Alchemy → Infura → 공용)
getRpcProvider()

// 2. 가스 자동 추정 + 20% 버퍼
submitVote(proposalId, { proofBytes, pubSignals })

// 3. Sepolia 네트워크 전환
switchToSepolia()
```

**zkp.ts** - ZKP 증명

```typescript
// 3~5초 걸림 (snarkjs)
generateVoteProof(vote: 0 | 1)
```

**voter.ts** - 투표자 등록

```typescript
// 백엔드에서 identity 받아서 캐싱
ensureRegistered(address)
```

### 🎨 컴포넌트 (src/components/)

- **NetworkGuard** - Sepolia(11155111) 자동 전환
- **StatusBadge** - 9단계 상태 표시
- **RelayerToggle** - 가스 대납 ON/OFF

### 📄 페이지 (src/app/)

- `/` - 투표 목록
- `/vote/create` - 투표 생성
- `/vote/[id]` - 투표 (ZKP + 제출)
- `/qr/[id]` - QR 코드

---

## 💡 동작 원리

### 투표 플로우

```
1. 지갑 연결 (WalletContext)
2. Sepolia 확인 (NetworkGuard)
3. 후보 선택
4. ZKP 증명 생성 (3~5초, WebWorker)
5. 제출 (Relayer 가스 대납)
6. 완료 (Etherscan 링크)
```

### RPC 폴백

```
contract.ts에서 자동으로:
Alchemy 시도 → 실패
Infura 시도 → 실패
공용 RPC → 성공!
```

### 가스 추정

```
1. estimateGas() → 100,000
2. +20% 버퍼 → 120,000
3. 전송 → 실제 사용 110,000
```

---

## 🐛 주요 오류 해결법

### 빌드 오류 (TypeScript)

**증상**: `Type error: any ... unknown ...`

**해결**:

```typescript
// ❌ 잘못
catch (error: any) { ... }

// ✅ 올바름
catch (error: unknown) {
  const err = error as { message?: string }
}
```

### NetworkGuard 타입 오류

**증상**: `Conversion of type ... may be a mistake`

**해결**:

```typescript
// ✅ unknown으로 받아서 캐스팅
const handleChainChanged = (data: unknown) => {
  const chainId = String(data)
  console.log('CHAIN_ID =', parseInt(chainId, 16))
}
```

### MetaMask 연결 안 됨

```
1. MetaMask 설치
2. 브라우저 새로고침 (Ctrl+R)
3. F12 → Console 에러 확인
```

### RPC 연결 실패

```env
# .env.local 파일 생성
NEXT_PUBLIC_ALCHEMY_API_KEY=your-key
NEXT_PUBLIC_INFURA_API_KEY=your-key
```

### ZKP 파일 없음

```
public/zkp/build/v1.2/ 폴더에:
- vote.wasm
- vote_final.zkey
```

---

## 🔧 Tech Stack

- **Next.js 15** (App Router)
- **ethers.js v6** (Web3)
- **snarkjs** (ZKP)
- **Sepolia** 테스트넷

---

## 📊 프론트B(Web3) 완료 내역

### 5주차 - Web3 기본

- contract.ts (537줄)
- NetworkGuard, WalletContext

### 6주차 - 성능

- RPC 폴백 (3단계)
- 가스 추정 + 20% 버퍼

### 7주차 - UX

- StatusBadge (9단계)
- RelayerToggle
- QR 페이지

### 8주차 - 문서

- WSL 가이드
- 환경 변수 통합

---

## 📚 추가 문서

**[docs/GUIDE.md](docs/GUIDE.md)** - 주차별 완료, WSL, 빌드 해결
