# Vault 🎵

플레이리스트를 저장하고 편집하는 웹 서비스입니다. YouTube와 Spotify 링크를 통해 플레이리스트를 관리하고, 인스타그램 스토리로 공유할 수 있습니다.

**Last Updated: 2025-08-30 15:00 - Mobile & Desktop Access Fixed**

## 주요 기능

- 🔐 **사용자 인증**: 회원가입 및 로그인
- 🎵 **플레이리스트 관리**: YouTube, Spotify 링크 지원
- ✏️ **편집 기능**: 제목, 썸네일, vibe, kick music 편집
- 🗑️ **삭제 기능**: 플레이리스트 삭제
- 📱 **인스타그램 공유**: 스토리 이미지 자동 생성
- 🎨 **모던 UI**: 반응형 디자인과 애니메이션

## 기술 스택

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT 인증
- bcryptjs (비밀번호 해시화)

### Frontend
- React.js
- Styled Components
- Framer Motion (애니메이션)
- React Router
- Axios

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd playlist-vault
```

### 2. 의존성 설치
```bash
npm run install-all
```

### 3. 환경 변수 설정
`.env` 파일을 서버 디렉토리에 생성하고 다음 내용을 추가하세요:

```env
MONGODB_URI=mongodb://localhost:27017/vault
JWT_SECRET=your-secret-key-here
PORT=5000
```

### 4. MongoDB 실행
MongoDB가 로컬에서 실행 중인지 확인하세요. 또는 MongoDB Atlas를 사용할 수 있습니다.

### 5. 개발 서버 실행
```bash
npm run dev
```

이 명령어는 백엔드 서버(포트 5000)와 프론트엔드 개발 서버(포트 3000)를 동시에 실행합니다.

## 사용 방법

1. **회원가입/로그인**: 이메일과 비밀번호로 계정을 만드세요
2. **플레이리스트 추가**: YouTube 또는 Spotify 링크를 입력하세요
3. **정보 편집**: 제목, vibe, kick music 등을 원하는 대로 수정하세요
4. **공유**: 인스타그램 스토리 버튼을 클릭하여 이미지를 다운로드하세요

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인

### 플레이리스트
- `GET /api/playlists` - 플레이리스트 목록 조회
- `POST /api/playlists` - 플레이리스트 생성
- `PUT /api/playlists/:id` - 플레이리스트 수정
- `DELETE /api/playlists/:id` - 플레이리스트 삭제

### 기타
- `POST /api/extract-info` - 링크에서 정보 추출
- `POST /api/generate-story` - 인스타그램 스토리 이미지 생성

## 프로젝트 구조

```
playlist-vault/
├── server/                 # 백엔드 서버
│   ├── index.js           # 메인 서버 파일
│   └── package.json       # 서버 의존성
├── client/                # 프론트엔드 React 앱
│   ├── public/            # 정적 파일
│   ├── src/               # 소스 코드
│   │   ├── components/    # React 컴포넌트
│   │   ├── App.js         # 메인 앱 컴포넌트
│   │   └── index.js       # 앱 진입점
│   └── package.json       # 클라이언트 의존성
├── package.json           # 루트 의존성
└── README.md              # 프로젝트 설명
```

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의사항

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

# Vercel auto-deploy trigger
# Force Vercel deployment trigger - Sat Aug 30 14:09:28 KST 2025
# Remove vercel.json for auto-detection - Sat Aug 30 14:17:03 KST 2025
# Force Vercel deployment - 2025-08-30 14:25:27
# Remove vercel.json for auto-detection - 2025-08-30 14:31:29
