# Calendar Suite Project

## 📌 프로젝트 개요
Calendar Suite는 Web / Mobile 환경에서 동일한 일정 데이터를 관리할 수 있는 서비스입니다.  
Firebase Authentication을 통한 로그인과 Firestore를 사용하여 실시간으로 데이터를 동기화합니다.

## 🧱 전체 아키텍처
- **Web App**: React (Vite) - `apps/web`
- **Mobile App**: React Native (Expo) - `apps/mobile`
- **Backend / DB**: Firebase (Authentication + Firestore)

## 📁 Repository 구조
```
repo-root/
├─ apps/
│ ├─ web/    # React Web App (Vite)
│ └─ mobile/ # React Native App (Expo)
└─ README.md
```

## ▶️ 실행 방법

### 1. Web App 실행
```bash
cd apps/web
npm install
npm run dev
```
브라우저에서 `http://localhost:5173` 접속

### 2. Mobile App 실행
```bash
cd apps/mobile
npm install
npx expo start
```
- `a`를 눌러 Android 에뮬레이터에서 실행하거나,
- Expo Go 앱으로 QR 코드를 스캔하여 실행

## 📊 주요 기능
- **일정 관리**: 월간/일간 뷰, 일정 생성/수정/삭제 (CRUD)
- **할일 관리**: 할일(Task) 생성 및 완료 체크, D-Day 표시
- **데이터 연동**: Web과 Mobile에서 동일한 계정으로 로그인 시 데이터 실시간 동기화
- **사용자 편의**: 다크 모드(Web), 검색 기능, 일정 색상 지정, 완료 축하 효과(Confetti)

## 🔐 인증 정보
- **Web**: Google 소셜 로그인 지원
- **Mobile**: Email/Password 로그인 지원 (테스트 용이성)

## ☁️ JCloud 배포 (Docker)
Web App은 Docker를 사용하여 JCloud에 배포할 수 있습니다. `apps/web` 디렉토리에 `Dockerfile`이 포함되어 있습니다.

1. **Docker 이미지 빌드**
   ```bash
   cd apps/web
   docker build -t calendar-web .
   ```

2. **Docker 컨테이너 실행**
   ```bash
   docker run -d -p 80:80 calendar-web
   ```