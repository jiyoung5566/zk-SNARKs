# 📘 개발 가이드 (올인원)

---

## 🚀 빠른 시작

```bash
npm install
cp env.example .env.local
npm run dev
```

---

## 🔧 주차별 완료

- **5주차**: Web3 연동 ✅
- **6주차**: RPC 폴백, 가스 추정 ✅
- **7주차**: Relayer, StatusBadge ✅
- **8주차**: WSL 가이드, 문서화 ✅

---

## 🐛 빌드 오류 해결

```bash
npm run build  # 오류 확인
```

**주요 수정**:

- `any` → `unknown` (타입 안전)
- NetworkGuard 타입 단순화
- img → eslint-disable 추가

---

## 🐧 WSL 환경 (간단)

```bash
wsl --install -d Ubuntu-22.04
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 검증자 노드
pm2 start src/index.js --name zkp-verifier

# Relayer
pm2 start src/relayer.js --name zkp-relayer
```

---

## 📊 요약

- 코드: 1650줄 (13개 파일)
- 작업: ~34시간
- 완료율: 100% ✅

---

**프론트B(Web3) - 안지영**
