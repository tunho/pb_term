# 🚀 Calendar Suite 실행 가이드

본 문서는 Calendar Suite 프로젝트의 설치 및 실행 방법을 안내합니다.

## 1. 사전 준비 (Prerequisites)
- **Node.js**: v18 이상 권장
- **npm** 또는 **yarn**
- **Expo Go** 앱 (모바일 테스트용)

---

## 2. Web App 실행 방법

### 2.1 설치
프로젝트 루트에서 다음 명령어를 실행하여 의존성을 설치합니다.
```bash
cd apps/web
npm install
```

### 2.2 환경 변수 설정
`apps/web` 디렉토리에 `.env` 파일을 생성해야 합니다. 제공된 예시 파일을 복사하여 사용하세요.
```bash
cp .env.example .env
```
*(기본적으로 테스트 가능한 설정이 포함되어 있습니다.)*

### 2.3 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`으로 접속합니다.

---

## 3. Mobile App 실행 방법

### 3.1 설치
```bash
cd apps/mobile
npm install
```

### 3.2 실행
```bash
npx expo start
```
터미널에 나타나는 **QR 코드**를 스마트폰의 **Expo Go** 앱으로 스캔합니다.
*(같은 Wi-Fi 네트워크에 접속되어 있어야 합니다.)*

---

## 4. 테스트용 계정 (Demo Account)
Web App과 Mobile App의 데이터 연동을 즉시 확인하실 수 있도록 테스트 계정을 제공합니다.

| 구분 | 정보 |
|---|---|
| **Email** | `demo@test.com` |
| **Password** | `123456` |

> **Note**: Web과 Mobile에서 동일한 계정으로 로그인하면, 일정/할일/메모 데이터가 실시간으로 동기화됩니다.
