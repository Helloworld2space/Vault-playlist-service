# 🚀 Vault 배포 및 분석 가이드

## 📋 목차
1. [배포 플랫폼 선택](#배포-플랫폼-선택)
2. [Google Analytics 설정](#google-analytics-설정)
3. [커스텀 분석 시스템](#커스텀-분석-시스템)
4. [추가 분석 도구](#추가-분석-도구)
5. [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
6. [환경 변수 설정](#환경-변수-설정)

---

## 🎯 배포 플랫폼 선택

### **추천 플랫폼:**

#### **1. Vercel (추천)**
- **장점**: React 앱 배포에 최적화, 무료 플랜 제공, 자동 배포
- **가격**: 무료 (개인용), $20/월 (팀용)
- **적합도**: ⭐⭐⭐⭐⭐

#### **2. Netlify**
- **장점**: 간편한 배포, 폼 처리 기능, CDN 제공
- **가격**: 무료 (개인용), $19/월 (팀용)
- **적합도**: ⭐⭐⭐⭐⭐

#### **3. Railway**
- **장점**: 풀스택 앱 배포, 데이터베이스 포함
- **가격**: $5/월 (기본 플랜)
- **적합도**: ⭐⭐⭐⭐

---

## 📊 Google Analytics 설정

### **1. Google Analytics 계정 생성**
1. [Google Analytics](https://analytics.google.com/) 접속
2. 계정 생성 및 속성 설정
3. 측정 ID 복사 (예: `G-XXXXXXXXXX`)

### **2. 추적 코드 추가**
```html
<!-- client/public/index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### **3. 이벤트 추적 추가**
```javascript
// 클라이언트에서 사용자 행동 추적
const trackEvent = (action, category, label) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, {
      event_category: category,
      event_label: label
    });
  }
};

// 사용 예시
trackEvent('playlist_created', 'engagement', 'new_playlist');
trackEvent('story_shared', 'social', 'instagram');
```

---

## 🔍 커스텀 분석 시스템

### **현재 구현된 기능:**
- ✅ **페이지 뷰 추적**: `/api/analytics/pageview`
- ✅ **사용자 행동 추적**: `/api/analytics/action`
- ✅ **통계 대시보드**: `/api/analytics/dashboard`
- ✅ **실시간 통계**: 회원가입, 로그인, 플레이리스트 생성, 공유

### **추적 가능한 지표:**
- 👥 **사용자 수**: 총 회원가입, 활성 사용자
- 📈 **참여도**: 로그인 횟수, 플레이리스트 생성 수
- 🔗 **공유율**: 스토리 공유 횟수
- 📊 **페이지별 통계**: 각 페이지 방문자 수
- ⏱️ **사용자 행동**: 실시간 사용자 활동 로그

---

## 📈 추가 분석 도구

### **1. Hotjar (사용자 행동 분석)**
- **기능**: 히트맵, 세션 녹화, 사용자 피드백
- **가격**: 무료 (2,000 페이지뷰/월)
- **설정**: 
```html
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

### **2. Mixpanel (이벤트 분석)**
- **기능**: 상세한 이벤트 추적, 퍼널 분석
- **가격**: 무료 (1,000 이벤트/월)
- **설정**:
```javascript
import mixpanel from 'mixpanel-browser';
mixpanel.init('YOUR_MIXPANEL_TOKEN');

// 이벤트 추적
mixpanel.track('Playlist Created', {
  platform: 'youtube',
  hasThumbnail: true
});
```

### **3. Google Search Console**
- **기능**: 검색 성능, 인덱싱 상태
- **가격**: 무료
- **설정**: Google Analytics와 연동

---

## 🗄️ 데이터베이스 마이그레이션

### **현재 상태: 메모리 기반 (개발용)**
```javascript
// server/index.js
const users = [];
const playlists = [];
const analytics = { /* ... */ };
```

### **프로덕션용 데이터베이스 옵션:**

#### **1. MongoDB Atlas (추천)**
```javascript
// server/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
  }
};
```

#### **2. PostgreSQL (Railway)**
```javascript
// server/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

---

## 🔧 환경 변수 설정

### **필요한 환경 변수:**
```bash
# .env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vault
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
HOTJAR_ID=1234567
MIXPANEL_TOKEN=your-mixpanel-token
```

### **배포 플랫폼별 설정:**

#### **Vercel:**
1. 프로젝트 설정 → Environment Variables
2. 각 변수 추가

#### **Netlify:**
1. Site settings → Environment variables
2. 각 변수 추가

#### **Railway:**
1. 프로젝트 → Variables
2. 각 변수 추가

---

## 📊 분석 대시보드 접근

### **관리자 대시보드 URL:**
```
https://your-domain.com/analytics
```

### **분석 데이터 API:**
```javascript
// 전체 통계 조회
GET /api/analytics/dashboard

// 페이지 뷰 추적
POST /api/analytics/pageview
{
  "page": "/dashboard",
  "userId": "user123"
}

// 사용자 행동 추적
POST /api/analytics/action
{
  "action": "playlist_created",
  "details": { "platform": "youtube" },
  "userId": "user123"
}
```

---

## 🎯 KPI 추적 가이드

### **핵심 지표 (KPI):**

#### **1. 사용자 획득**
- 📈 **회원가입 수**: 일별/주별/월별 추이
- 🎯 **전환율**: 방문자 → 회원가입 비율
- 📊 **유입 경로**: 어떤 채널에서 오는지

#### **2. 사용자 참여**
- 🎵 **플레이리스트 생성 수**: 사용자당 평균
- ⏱️ **세션 시간**: 평균 체류 시간
- 🔄 **재방문율**: 일주일 내 재방문 비율

#### **3. 사용자 만족도**
- 🔗 **공유율**: 플레이리스트 공유 비율
- 📱 **스토리 공유**: 인스타그램 스토리 공유 수
- ⭐ **사용자 피드백**: 별점, 리뷰

#### **4. 기술적 지표**
- 🚀 **페이지 로딩 속도**: 평균 로딩 시간
- 📱 **모바일 사용률**: 모바일 vs 데스크톱 비율
- 🐛 **오류율**: 404, 500 에러 발생률

---

## 🔄 정기 분석 리포트

### **일일 리포트:**
- 새로운 회원가입 수
- 플레이리스트 생성 수
- 스토리 공유 수
- 주요 오류 발생 여부

### **주간 리포트:**
- 사용자 성장률
- 인기 플레이리스트 분석
- 사용자 행동 패턴
- 개선점 도출

### **월간 리포트:**
- 전체 서비스 성과
- 사용자 만족도 분석
- 기능별 사용률
- 다음 달 목표 설정

---

## 🚀 배포 체크리스트

### **배포 전 확인사항:**
- [ ] 환경 변수 설정 완료
- [ ] Google Analytics 추적 코드 추가
- [ ] 데이터베이스 연결 확인
- [ ] SSL 인증서 설정
- [ ] 도메인 연결
- [ ] 분석 대시보드 접근 권한 설정

### **배포 후 확인사항:**
- [ ] 웹사이트 정상 작동 확인
- [ ] 분석 데이터 수집 확인
- [ ] 이메일 알림 설정
- [ ] 백업 시스템 구축
- [ ] 모니터링 도구 설정

---

## 📞 지원 및 문의

### **문제 해결:**
1. **분석 데이터가 수집되지 않는 경우**
   - 브라우저 개발자 도구에서 네트워크 탭 확인
   - CORS 설정 확인
   - API 엔드포인트 응답 확인

2. **Google Analytics가 작동하지 않는 경우**
   - 추적 코드가 올바르게 추가되었는지 확인
   - 광고 차단기 비활성화
   - 개인정보 보호 설정 확인

3. **데이터베이스 연결 오류**
   - 환경 변수 설정 확인
   - 데이터베이스 접근 권한 확인
   - 네트워크 연결 상태 확인

---

**🎉 이제 Vault를 배포하고 사용자 반응을 분석할 준비가 완료되었습니다!**
