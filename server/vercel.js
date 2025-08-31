const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const app = express();

// CORS 설정
app.use(cors());
app.use(express.json());

// 환경 변수
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 메모리 기반 데이터베이스 (개발용)
const users = [];
const playlists = [];

// 분석 데이터 저장소
const analytics = {
  pageViews: {},
  userActions: [],
  signups: 0,
  logins: 0,
  playlistsCreated: 0,
  playlistsShared: 0,
  startTime: new Date()
};

// ID 생성 함수
const generateId = () => Math.random().toString(36).substr(2, 9);

// Vercel에서는 파일 시스템이 읽기 전용이므로 메모리 스토리지 사용
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 제한
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// JWT 토큰 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '인증 토큰이 필요합니다' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
    }
    req.user = user;
    next();
  });
};

// 회원가입
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 중복 확인
    const existingUser = users.find(user => user.email === email || user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 사용자입니다' });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 생성
    const user = {
      id: generateId(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(user);
    
    // 회원가입 통계 증가
    analytics.signups++;

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 로그인
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 찾기
    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: '이메일 또는 비밀번호가 잘못되었습니다' });
    }

    // 로그인 통계 증가
    analytics.logins++;

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '로그인이 완료되었습니다',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: '서버 오류가 발생했습니다' });
  }
});

// 링크에서 정보 추출
app.post('/api/extract-info', authenticateToken, async (req, res) => {
  try {
    const { link } = req.body;
    
    let platform = '';
    let videoId = '';
    let playlistId = '';

    if (link.includes('youtube.com') || link.includes('youtu.be')) {
      platform = 'youtube';
      // YouTube 링크 파싱
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = link.match(youtubeRegex);
      if (match) {
        videoId = match[1];
      }
    } else if (link.includes('spotify.com')) {
      platform = 'spotify';
      // Spotify 링크 파싱
      const spotifyRegex = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
      const match = link.match(spotifyRegex);
      if (match) {
        playlistId = match[1];
      }
    }

    // 기본 정보 반환 (실제 구현에서는 API 호출 필요)
    // 썸네일은 실제 API에서 가져올 수 있을 때만 설정
    const info = {
      platform,
      title: '플레이리스트 제목',
      // 썸네일은 실제 API 구현 시에만 설정, 현재는 빈 값으로 설정
      thumbnail: '',
      vibe: '',
      kickMusic: ''
    };

    res.json(info);
  } catch (error) {
    res.status(500).json({ message: '정보 추출 중 오류가 발생했습니다' });
  }
});

// 썸네일 업로드 (Base64 인코딩으로 저장)
app.post('/api/upload-thumbnail', authenticateToken, upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    // 파일을 Base64로 인코딩
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const thumbnailUrl = `data:${mimeType};base64,${base64Image}`;
    
    res.json({
      message: '썸네일이 업로드되었습니다.',
      thumbnailUrl: thumbnailUrl
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ message: '썸네일 업로드 중 오류가 발생했습니다.' });
  }
});

// 플레이리스트 생성
app.post('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const { title, link, thumbnail, vibe, kickMusic, platform } = req.body;
    
    console.log('Creating playlist with data:', req.body);
    console.log('Thumbnail URL:', thumbnail);

    // 빈 썸네일 값 처리
    const playlistData = {
      id: generateId(),
      userId: req.user.userId,
      title,
      link,
      vibe,
      kickMusic,
      platform,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 썸네일이 유효한 값일 때만 추가
    if (thumbnail && thumbnail.trim() !== '') {
      playlistData.thumbnail = thumbnail;
    }

    console.log('Created playlist object:', playlistData);
    playlists.push(playlistData);
    
    // 플레이리스트 생성 통계 증가
    analytics.playlistsCreated++;

    res.status(201).json({
      message: '플레이리스트가 저장되었습니다',
      playlist: playlistData
    });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(500).json({ message: '플레이리스트 저장 중 오류가 발생했습니다' });
  }
});

// 플레이리스트 목록 조회
app.get('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const userPlaylists = playlists
      .filter(playlist => playlist.userId === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userPlaylists);
  } catch (error) {
    res.status(500).json({ message: '플레이리스트 조회 중 오류가 발생했습니다' });
  }
});

// 플레이리스트 수정
app.put('/api/playlists/:id', authenticateToken, async (req, res) => {
  try {
    const { title, link, thumbnail, vibe, kickMusic, platform } = req.body;
    
    const playlistIndex = playlists.findIndex(
      playlist => playlist.id === req.params.id && playlist.userId === req.user.userId
    );

    if (playlistIndex === -1) {
      return res.status(404).json({ message: '플레이리스트를 찾을 수 없습니다' });
    }

    // 기존 플레이리스트 데이터 복사
    const updatedPlaylist = {
      ...playlists[playlistIndex],
      title,
      link,
      vibe,
      kickMusic,
      platform,
      updatedAt: new Date()
    };

    // 썸네일이 유효한 값일 때만 업데이트
    if (thumbnail && thumbnail.trim() !== '') {
      updatedPlaylist.thumbnail = thumbnail;
    } else {
      // 빈 값이면 기존 썸네일 유지
      delete updatedPlaylist.thumbnail;
    }

    playlists[playlistIndex] = updatedPlaylist;

    res.json({
      message: '플레이리스트가 수정되었습니다',
      playlist: playlists[playlistIndex]
    });
  } catch (error) {
    res.status(500).json({ message: '플레이리스트 수정 중 오류가 발생했습니다' });
  }
});

// 플레이리스트 삭제
app.delete('/api/playlists/:id', authenticateToken, async (req, res) => {
  try {
    const playlistIndex = playlists.findIndex(
      playlist => playlist.id === req.params.id && playlist.userId === req.user.userId
    );

    if (playlistIndex === -1) {
      return res.status(404).json({ message: '플레이리스트를 찾을 수 없습니다' });
    }

    playlists.splice(playlistIndex, 1);

    res.json({ message: '플레이리스트가 삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ message: '플레이리스트 삭제 중 오류가 발생했습니다' });
  }
});

// 인스타그램 스토리 정보 생성
app.post('/api/generate-story', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.body;
    
    const playlist = playlists.find(
      playlist => playlist.id === playlistId && playlist.userId === req.user.userId
    );

    if (!playlist) {
      return res.status(404).json({ message: '플레이리스트를 찾을 수 없습니다' });
    }

    // 스토리 공유 통계 증가
    analytics.playlistsShared++;

    // 스토리 정보 반환 (실제 구현에서는 이미지 생성 필요)
    const storyInfo = {
      title: playlist.title,
      vibe: playlist.vibe,
      kickMusic: playlist.kickMusic,
      platform: playlist.platform,
      link: playlist.link,
      message: '인스타그램 스토리 이미지가 생성되었습니다. 실제 구현에서는 Canvas API를 사용하여 이미지를 생성합니다.'
    };

    res.json(storyInfo);
  } catch (error) {
    res.status(500).json({ message: '스토리 정보 생성 중 오류가 발생했습니다' });
  }
});

// 인스타그램 스토리 이미지 생성 (Vercel용) - SVG 기반
app.post('/api/generate-story-image', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.body;
    
    const playlist = playlists.find(
      playlist => playlist.id === playlistId && playlist.userId === req.user.userId
    );

    if (!playlist) {
      return res.status(404).json({ message: '플레이리스트를 찾을 수 없습니다' });
    }

    // SVG 기반 스토리 이미지 생성
    const svgContent = `
      <svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="background" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- 배경 -->
        <rect width="1080" height="1920" fill="url(#background)"/>
        
        <!-- 플랫폼 아이콘 -->
        <text x="540" y="200" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
          ${playlist.platform === 'youtube' ? '🎵' : '🎧'}
        </text>
        
        <!-- 제목 (줄바꿈 처리) -->
        ${generateTitleText(playlist.title, 540, 400)}
        
        <!-- Vibe 정보 -->
        ${playlist.vibe ? `
          <text x="540" y="600" font-family="Arial, sans-serif" font-size="36" 
                text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
            Vibe: ${playlist.vibe}
          </text>
        ` : ''}
        
        <!-- Kick Music 정보 -->
        ${playlist.kickMusic ? `
          <text x="540" y="700" font-family="Arial, sans-serif" font-size="36" 
                text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
            Kick: ${playlist.kickMusic}
          </text>
        ` : ''}
        
        <!-- 플랫폼 정보 -->
        <text x="540" y="900" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
              text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
          ${playlist.platform.toUpperCase()}
        </text>
        
        <!-- Vault 로고 -->
        <text x="540" y="1700" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
          VAULT
        </text>
        
        <!-- 링크 안내 텍스트 -->
        <text x="540" y="1800" font-family="Arial, sans-serif" font-size="24" font-weight="bold" 
              text-anchor="middle" dominant-baseline="middle" fill="#ffffff">
          💫 스토리에 링크 스티커를 추가하세요!
        </text>
      </svg>
    `;

    // SVG를 PNG로 변환 (Sharp 사용)
    const optimizedBuffer = await sharp(Buffer.from(svgContent))
      .png({ quality: 90 })
      .toBuffer();

    // 스토리 공유 통계 증가
    analytics.playlistsShared++;

    // 이미지 응답
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="vault-story-${playlist.id}.png"`);
    res.send(optimizedBuffer);

  } catch (error) {
    console.error('스토리 이미지 생성 오류:', error);
    res.status(500).json({ message: '스토리 이미지 생성 중 오류가 발생했습니다' });
  }
});

// SVG 제목 텍스트 생성 헬퍼 함수
function generateTitleText(title, x, y) {
  const maxWidth = 1000;
  const fontSize = 64;
  const lineHeight = fontSize * 1.2;
  
  // 간단한 줄바꿈 로직 (공백 기준)
  const words = title.split(' ');
  let lines = [];
  let currentLine = '';
  
  for (let word of words) {
    if (currentLine.length + word.length <= 15) { // 대략적인 문자 수 제한
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // SVG 텍스트 요소 생성
  return lines.map((line, index) => `
    <text x="${x}" y="${y + (index * lineHeight)}" font-family="Arial, sans-serif" 
          font-size="${fontSize}" font-weight="bold" text-anchor="middle" 
          dominant-baseline="middle" fill="#ffffff">
      ${line}
    </text>
  `).join('');
}

// 페이지 뷰 추적
app.post('/api/analytics/pageview', (req, res) => {
  try {
    const { page, userId } = req.body;
    const today = new Date().toDateString();
    
    if (!analytics.pageViews[today]) {
      analytics.pageViews[today] = {};
    }
    if (!analytics.pageViews[today][page]) {
      analytics.pageViews[today][page] = 0;
    }
    
    analytics.pageViews[today][page]++;
    
    // 사용자 행동 로그
    analytics.userActions.push({
      type: 'pageview',
      page,
      userId: userId || 'anonymous',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '페이지 뷰 추적 중 오류가 발생했습니다' });
  }
});

// 사용자 행동 추적
app.post('/api/analytics/action', (req, res) => {
  try {
    const { action, details, userId } = req.body;
    
    analytics.userActions.push({
      type: action,
      details,
      userId: userId || 'anonymous',
      timestamp: new Date()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: '사용자 행동 추적 중 오류가 발생했습니다' });
  }
});

// 분석 대시보드 데이터 조회
app.get('/api/analytics/dashboard', (req, res) => {
  try {
    const now = new Date();
    const uptime = now - analytics.startTime;
    
    // 최근 7일 페이지 뷰
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      last7Days.push({
        date: dateStr,
        views: analytics.pageViews[dateStr] ? 
          Object.values(analytics.pageViews[dateStr]).reduce((sum, val) => sum + val, 0) : 0
      });
    }
    
    // 최근 사용자 행동 (최근 50개)
    const recentActions = analytics.userActions
      .slice(-50)
      .reverse()
      .map(action => ({
        ...action,
        timestamp: action.timestamp.toISOString()
      }));
    
    const dashboardData = {
      overview: {
        totalSignups: analytics.signups,
        totalLogins: analytics.logins,
        totalPlaylistsCreated: analytics.playlistsCreated,
        totalPlaylistsShared: analytics.playlistsShared,
        currentUsers: users.length,
        uptime: Math.floor(uptime / (1000 * 60 * 60 * 24)) // 일 단위
      },
      pageViews: {
        last7Days,
        today: analytics.pageViews[new Date().toDateString()] || {}
      },
      recentActions,
      topPages: Object.entries(analytics.pageViews[new Date().toDateString()] || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }))
    };
    
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: '분석 데이터 조회 중 오류가 발생했습니다' });
  }
});

// Vercel 서버리스 함수로 내보내기
module.exports = app;
