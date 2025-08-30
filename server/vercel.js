const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage, registerFont } = require('canvas');
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

// 인스타그램 스토리 이미지 생성 (Vercel용)
app.post('/api/generate-story-image', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.body;
    
    const playlist = playlists.find(
      playlist => playlist.id === playlistId && playlist.userId === req.user.userId
    );

    if (!playlist) {
      return res.status(404).json({ message: '플레이리스트를 찾을 수 없습니다' });
    }

    // Instagram 스토리 크기 (1080x1920)
    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext('2d');

    // 그라데이션 배경 생성
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Vercel에서는 파일 시스템 접근이 제한적이므로 썸네일 이미지는 사용하지 않음
    // 대신 플레이리스트 정보를 기반으로 한 디자인 사용

    // 텍스트 렌더링을 위한 헬퍼 함수
    const drawText = (text, x, y, fontSize, fontWeight = 'normal') => {
      ctx.font = `${fontWeight} ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 텍스트가 너무 길면 줄바꿈 처리
      const maxWidth = 1000;
      const words = text.split(' ');
      let line = '';
      let lines = [];
      
      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== '') {
          lines.push(line);
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);
      
      // 여러 줄 텍스트 그리기
      lines.forEach((line, index) => {
        ctx.fillText(line.trim(), x, y + (index * fontSize * 1.2));
      });
    };

    // 플랫폼 아이콘 그리기
    const platformIcon = playlist.platform === 'youtube' ? '🎵' : '🎧';
    ctx.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(platformIcon, 540, 200);

    // 제목 그리기 (줄바꿈 지원)
    drawText(playlist.title, 540, 400, 64, 'bold');

    // Vibe 정보 그리기
    if (playlist.vibe) {
      drawText(`Vibe: ${playlist.vibe}`, 540, 600, 36);
    }

    // Kick Music 정보 그리기
    if (playlist.kickMusic) {
      drawText(`Kick: ${playlist.kickMusic}`, 540, 700, 36);
    }

    // 플랫폼 정보 그리기
    ctx.font = 'bold 28px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${playlist.platform.toUpperCase()}`, 540, 900);

    // Vault 로고 그리기
    ctx.font = 'bold 48px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VAULT', 540, 1700);

    // 링크 안내 텍스트 그리기
    ctx.font = 'bold 24px "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💫 스토리에 링크 스티커를 추가하세요!', 540, 1800);

    // Canvas를 이미지로 변환
    const buffer = canvas.toBuffer('image/png');
    
    // 이미지 최적화 (Sharp 사용)
    const optimizedBuffer = await sharp(buffer)
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
