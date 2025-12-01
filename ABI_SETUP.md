# ABI 파일 설정 가이드

## 현재 상태

- 컨트랙트 주소는 `src/lib/contract.ts`에 설정되어 있습니다.
- ABI는 기본 구조만 포함되어 있으며, 실제 ABI 파일로 교체가 필요합니다.

## ABI 파일 설정 방법

### 방법 1: public 폴더에 ABI 파일 배치 (권장)

1. `public/abi/` 폴더를 생성합니다.
2. 블록체인 팀에서 받은 ABI 파일을 다음 이름으로 저장:

   - `Voting.abi` → `public/abi/Voting.json`
   - `Counter.abi` → `public/abi/Counter.json`

3. `src/lib/contract.ts` 파일을 수정:

```typescript
import { loadABIFromPublic } from './abiLoader'

// ABI를 동적으로 로드
let VOTING_ABI: any[] = []
let COUNTER_ABI: any[] = []

// 초기화 함수
export async function initABIs() {
  VOTING_ABI = await loadABIFromPublic('Voting.json')
  COUNTER_ABI = await loadABIFromPublic('Counter.json')
}
```

### 방법 2: src/lib/abis 폴더에 직접 import

1. `src/lib/abis/` 폴더를 생성합니다.
2. ABI 파일을 JSON 형식으로 저장:

   - `src/lib/abis/Voting.json`
   - `src/lib/abis/Counter.json`

3. `src/lib/contract.ts` 파일을 수정:

```typescript
import VotingABI from './abis/Voting.json'
import CounterABI from './abis/Counter.json'

export const VOTING_ABI = VotingABI as any[]
export const COUNTER_ABI = CounterABI as any[]
```

## 컨트랙트 주소 확인

현재 설정된 주소:

- **Voting**: `0xcB6d6d49D4c9eC6635c4D294DbFE0875D7F5fAd8`
- **Counter**: `0xD74364bB94669E2A2810B0fe108880Ab1FcC712b`

주소가 변경되면 `src/lib/contract.ts`의 `CONTRACT_ADDRESSES` 객체를 수정하세요.

## ABI 해시 확인

받은 해시값:

- `Voting.abi`: `abaa9aa01911c19170c71e1e14ed6fa27f34832ee0d475ea19e89d88a8551ce3`
- `Counter.abi`: `6a4c6cc382c28f4afb673c709134e7bcc6b0d0e93bd7c296580eeba7d1697dd2`

ABI 파일의 해시를 확인하려면:

```bash
# Windows (PowerShell)
Get-FileHash Voting.abi -Algorithm SHA256

# Mac/Linux
shasum -a 256 Voting.abi
```

## 다음 단계

1. ✅ 컨트랙트 주소 설정 완료
2. ⏳ ABI 파일 추가 필요
3. ✅ Sepolia 네트워크 전환 기능 구현 완료
4. ✅ 트랜잭션 전송 기능 구현 완료

ABI 파일을 추가한 후 테스트해보세요!
