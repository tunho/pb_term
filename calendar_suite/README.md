# Calendar Suite (Term Project)

Web과 Mobile 환경에서 일정을 통합 관리할 수 있는 캘린더 서비스입니다.
Firebase를 통해 실시간으로 데이터가 동기화됩니다.

## 📱 주요 기능
- **일정 관리 (Event)**: 날짜 및 시간(Time Picker) 설정 가능, 색상 지정
- **할일 관리 (Task)**: 체크박스로 완료 여부 관리
- **메모 관리 (Memo)**: 간단한 텍스트 메모 작성 (달력에 노란색 점 표시)
- **실시간 동기화**: Web에서 작성한 내용이 Mobile에 즉시 반영 (반대도 동일)
- **인증**: Google 소셜 로그인, Email/Password 로그인 지원

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

## 🚀 실행 가이드 (요약)

### 1. 설치 및 실행
**Web App**:
```bash
cd apps/web
cp .env.example .env  # 환경 변수 설정 (기본값 포함됨)
npm install
npm run dev
```
브라우저에서 `http://localhost:5173` 접속

**Mobile App**:
```bash
cd apps/mobile
npm install
npx expo start
```
Expo Go 앱으로 QR 코드 스캔

### 2. 테스트용 계정
바로 로그인하여 기능을 테스트해볼 수 있는 계정입니다.
- **Email**: `demo@test.com`
- **Password**: `123456`
*(Web과 Mobile 모두 동일한 계정으로 로그인하면 데이터가 연동됩니다.)*