# 🚀 Vault Vercel 배포 가이드

## 📋 배포 단계

### **1단계: GitHub에 코드 업로드**

1. **GitHub 저장소 생성**
   ```bash
   # 현재 프로젝트를 Git 저장소로 초기화
   git init
   git add .
   git commit -m "Initial commit: Vault playlist service"
   
   # GitHub에서 새 저장소 생성 후
   git remote add origin https://github.com/yourusername/vault.git
   git push -u origin main
   ```

### **2단계: Vercel 계정 생성**

1. [Vercel](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### **3단계: 프로젝트 배포**

1. **GitHub 저장소 선택**
   - 생성한 `vault` 저장소 선택

2. **프로젝트 설정**
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (기본값)
   - **Build Command**: `npm run vercel-build` (또는 `cd client && npm install && npm run build`)
   - **Output Directory**: `client/build`

3. **Environment Variables 설정**
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-here
   ```

4. **Deploy 클릭**

### **4단계: 배포 확인**

배포가 완료되면 다음과 같은 URL이 생성됩니다:
```
https://vault-yourusername.vercel.app
```

---

## 🔧 배포 전 확인사항

### **✅ 완료된 설정:**

1. **Vercel 설정 파일** (`vercel.json`)
   - 서버리스 함수 설정
   - 라우팅 규칙 설정
   - 빌드 설정

2. **서버 코드 수정** (`server/vercel.js`)
   - Vercel 서버리스 환경에 맞게 수정
   - 파일 업로드 처리 변경
   - 메모리 기반 스토리지 사용

3. **클라이언트 코드 수정**
   - 이미지 URL 처리 변경
   - API 호출 경로 확인

### **⚠️ 주의사항:**

1. **파일 업로드 제한**
   - Vercel에서는 파일 시스템이 읽기 전용
   - 이미지 업로드는 placeholder URL로 대체
   - 실제 서비스에서는 Cloudinary, AWS S3 등 사용 권장

2. **데이터베이스 제한**
   - 현재 메모리 기반 데이터베이스 사용
   - 서버 재시작 시 데이터 초기화
   - 실제 서비스에서는 MongoDB Atlas, PostgreSQL 등 사용 권장

3. **서버리스 함수 제한**
   - 실행 시간 제한 (10초)
   - 메모리 사용량 제한
   - 동시 요청 수 제한

---

## 🚀 배포 후 설정

### **1. 커스텀 도메인 설정 (선택사항)**

1. Vercel 대시보드 → 프로젝트 설정
2. "Domains" 탭
3. 도메인 추가 및 DNS 설정

### **2. 환경 변수 추가 설정**

```bash
# 추가 환경 변수 (필요시)
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
HOTJAR_ID=1234567
MIXPANEL_TOKEN=your-mixpanel-token
```

### **3. 분석 도구 설정**

1. **Google Analytics**
   - 추적 코드를 `client/public/index.html`에 추가
   - 환경 변수에 GA ID 설정

2. **Hotjar**
   - 스크립트를 `client/public/index.html`에 추가
   - 환경 변수에 Hotjar ID 설정

---

## 📊 배포 후 확인사항

### **✅ 기능 테스트:**

1. **회원가입/로그인**
   - 새 계정 생성
   - 로그인 기능

2. **플레이리스트 관리**
   - 플레이리스트 생성
   - 이미지 업로드 (placeholder 확인)
   - 편집/삭제 기능

3. **분석 대시보드**
   - `/analytics` 페이지 접근
   - 통계 데이터 확인

### **🔍 문제 해결:**

1. **빌드 오류 (Command "cd client && npm run build" exited with 1)**
   
   **해결 방법:**
   
   a) **Vercel 설정에서 Build Command 변경:**
   ```
   npm run vercel-build
   ```
   
   b) **또는 더 상세한 빌드 명령어:**
   ```
   cd client && npm install && npm run build
   ```
   
   c) **로컬에서 빌드 테스트:**
   ```bash
   cd client
   npm run build
   ```
   
   d) **의존성 문제인 경우:**
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **API 오류**
   - Vercel 함수 로그 확인
   - 환경 변수 설정 확인

3. **이미지 업로드 오류**
   - placeholder 이미지로 대체됨
   - 실제 서비스에서는 클라우드 스토리지 사용

---

## 🎯 다음 단계

### **프로덕션 환경 개선:**

1. **데이터베이스 마이그레이션**
   - MongoDB Atlas 설정
   - 데이터 스키마 정의

2. **파일 스토리지 설정**
   - Cloudinary 또는 AWS S3 설정
   - 이미지 업로드 기능 완성

3. **모니터링 도구 설정**
   - Google Analytics
   - Hotjar
   - 에러 추적 도구

4. **보안 강화**
   - HTTPS 설정
   - CORS 설정
   - Rate limiting

---

## 📞 지원

### **문제 발생 시:**

1. **Vercel 로그 확인**
   - Vercel 대시보드 → Functions 탭
   - 실시간 로그 확인

2. **GitHub Issues**
   - 문제를 GitHub Issues에 등록
   - 상세한 오류 정보 포함

3. **Vercel 지원**
   - [Vercel Documentation](https://vercel.com/docs)
   - [Vercel Community](https://github.com/vercel/vercel/discussions)

---

**🎉 Vercel 배포가 완료되면 전 세계 어디서나 Vault에 접근할 수 있습니다!**
