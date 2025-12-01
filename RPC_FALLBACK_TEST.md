# RPC 폴백 테스트 가이드

## 구현 내용

RPC 폴백 시스템이 구현되었습니다:
1. **우선순위**: Alchemy → Infura → 공용 RPC
2. **자동 폴백**: 각 RPC를 순차적으로 시도
3. **캐싱**: 작동하는 RPC를 캐시하여 재사용
4. **읽기 전용 작업**: RPC 폴백 사용 (가스비 없음)
5. **트랜잭션 전송**: MetaMask 사용 (서명 필요)

## RPC 엔드포인트 목록

### 1. Alchemy (우선순위 1)
- API 키 필요: `NEXT_PUBLIC_ALCHEMY_API_KEY`
- 엔드포인트: `https://eth-sepolia.g.alchemy.com/v2/{API_KEY}`
- API 키 없으면: `https://eth-sepolia.g.alchemy.com/v2/demo` (제한적)

### 2. Infura (우선순위 2)
- API 키 필요: `NEXT_PUBLIC_INFURA_API_KEY`
- 엔드포인트: `https://sepolia.infura.io/v3/{API_KEY}`
- API 키 없으면: `https://sepolia.infura.io/v3/` (제한적)

### 3. 공용 RPC (우선순위 3-5)
- `https://rpc.sepolia.org`
- `https://sepolia.gateway.tenderly.co`
- `https://ethereum-sepolia-rpc.publicnode.com`

## 환경 변수 설정

`.env.local` 파일 생성:

```bash
# Alchemy API 키 (선택사항, 있으면 우선 사용)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# Infura API 키 (선택사항, 있으면 우선 사용)
NEXT_PUBLIC_INFURA_API_KEY=your_infura_api_key
```

## 테스트 방법

### 1. 기본 테스트 (RPC 폴백 확인)

#### 준비사항
- 브라우저 개발자 도구 열기 (F12)
- Console 탭 선택

#### 테스트 절차

1. **페이지 로드 시 RPC 테스트**
   - 페이지를 새로고침하면 콘솔에 RPC 테스트 로그가 출력됩니다
   - 예상 출력:
     ```
     ✅ RPC 작동 확인: https://eth-sepolia.g.alchemy.com/v2/demo (블록: 12345678)
     ✅ RPC Provider 선택: https://eth-sepolia.g.alchemy.com/v2/demo
     ```

2. **RPC 실패 시 폴백 확인**
   - 네트워크 탭에서 특정 RPC를 차단
   - 예상 출력:
     ```
     ❌ RPC 실패: https://eth-sepolia.g.alchemy.com/v2/demo
     ✅ RPC 작동 확인: https://sepolia.infura.io/v3/ (블록: 12345678)
     ✅ RPC Provider 선택: https://sepolia.infura.io/v3/
     ```

### 2. 읽기 전용 함수 테스트

#### 테스트할 함수들
- `getProposal(proposalId)`: 제안 정보 조회
- `isNullifierUsed(nullifierHash)`: nullifier 사용 여부 확인
- `hasVoted(address)`: 투표 여부 확인

#### 테스트 코드 (브라우저 콘솔)

```javascript
// contract.ts의 함수들을 import해서 사용
import { getProposal, isNullifierUsed } from '@/lib/contract'

// 제안 정보 조회
const proposal = await getProposal(0)
console.log('제안:', proposal)

// nullifier 확인
const isUsed = await isNullifierUsed('0x...')
console.log('사용됨:', isUsed)
```

### 3. RPC 폴백 시뮬레이션

#### 방법 1: 네트워크 탭에서 차단
1. 개발자 도구 → Network 탭
2. 특정 RPC 도메인 필터링
3. 해당 RPC 요청 차단
4. 페이지 새로고침
5. 다음 RPC로 폴백되는지 확인

#### 방법 2: 코드로 테스트
```javascript
// 임시로 RPC 목록을 변경하여 테스트
// src/lib/contract.ts에서 RPC_ENDPOINTS 수정
```

### 4. 캐싱 동작 확인

#### 테스트 절차
1. 첫 번째 호출: RPC 선택 및 캐싱
2. 두 번째 호출: 캐시된 RPC 사용
3. 캐시된 RPC 실패: 자동으로 새 RPC 찾기

#### 예상 동작
```
첫 호출:
✅ RPC 작동 확인: https://rpc.sepolia.org (블록: 12345678)
✅ RPC Provider 선택: https://rpc.sepolia.org

두 번째 호출:
(캐시된 RPC 사용, 테스트 없음)

캐시된 RPC 실패 시:
❌ RPC 실패: https://rpc.sepolia.org
✅ RPC 작동 확인: https://sepolia.gateway.tenderly.co (블록: 12345679)
✅ RPC Provider 선택: https://sepolia.gateway.tenderly.co
```

### 5. 모든 RPC 실패 시나리오

#### 시뮬레이션
- 모든 RPC 엔드포인트를 차단하거나 오프라인 상태

#### 예상 동작
```
❌ RPC 실패: https://eth-sepolia.g.alchemy.com/v2/demo
❌ RPC 실패: https://sepolia.infura.io/v3/
❌ RPC 실패: https://rpc.sepolia.org
❌ RPC 실패: https://sepolia.gateway.tenderly.co
❌ RPC 실패: https://ethereum-sepolia-rpc.publicnode.com
Error: 모든 RPC 엔드포인트에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.
```

## 검증 체크리스트

- [ ] Alchemy RPC가 작동하면 우선 사용되는가?
- [ ] Alchemy 실패 시 Infura로 폴백되는가?
- [ ] Infura 실패 시 공용 RPC로 폴백되는가?
- [ ] 작동하는 RPC가 캐시되는가?
- [ ] 캐시된 RPC 실패 시 자동으로 새 RPC를 찾는가?
- [ ] 모든 RPC 실패 시 명확한 에러 메시지가 표시되는가?
- [ ] 읽기 전용 함수들이 RPC 폴백을 사용하는가?
- [ ] 트랜잭션 전송은 여전히 MetaMask를 사용하는가?

## 성능 고려사항

1. **RPC 테스트 시간**: 각 RPC 테스트는 약 1-2초 소요
2. **캐싱**: 첫 호출 후 캐시된 RPC 사용으로 빠른 응답
3. **병렬 테스트**: 필요시 여러 RPC를 동시에 테스트하여 더 빠른 폴백 가능 (향후 개선)

## 문제 해결

### RPC 연결 실패
- 네트워크 연결 확인
- 방화벽 설정 확인
- API 키 유효성 확인 (Alchemy/Infura)

### 느린 응답
- API 키 추가 (Alchemy/Infura는 더 빠름)
- 공용 RPC는 느릴 수 있음

### 캐시 문제
- 브라우저 새로고침
- 개발자 도구에서 캐시 비우기

## 향후 개선 사항

1. **병렬 테스트**: 여러 RPC를 동시에 테스트하여 가장 빠른 것 선택
2. **헬스 체크**: 주기적으로 RPC 상태 확인
3. **로드 밸런싱**: 여러 RPC 간 부하 분산
4. **메트릭 수집**: 각 RPC의 성능 및 가용성 추적





