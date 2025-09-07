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
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB 제한 (Vercel 호환성을 위해 더 줄임)
    files: 1, // 한 번에 하나의 파일만
    fieldSize: 512 * 1024 // 512KB 필드 크기 제한
  },
  fileFilter: function (req, file, cb) {
    console.log('Multer file filter - file:', file);
    
    // 이미지 파일만 허용
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('File rejected - not an image:', file.originalname, file.mimetype);
      cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
  }
});

// 정적 파일 서빙
app.use('/uploads', express.static(uploadDir));

// 인증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth header:', authHeader);
  console.log('Extracted token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: '액세스 토큰이 필요합니다' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('Decoded token:', decoded);
    req.user = users.find(user => user.id === decoded.userId);
    console.log('Found user:', req.user ? req.user.username : 'Not found');
    
    if (!req.user) {
      console.log('User not found for token');
      return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
    }
    next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
  }
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
      process.env.JWT_SECRET || 'your-secret-key',
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
      process.env.JWT_SECRET || 'your-secret-key',
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

// 플레이리스트 생성
app.post('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const { title, link, thumbnail, vibe, kickMusic, platform } = req.body;
    
    console.log('=== PLAYLIST CREATION REQUEST ===');
    console.log('User ID:', req.user.id);
    console.log('Request body:', req.body);
    console.log('Thumbnail URL:', thumbnail);

    // 필수 필드 검증
    if (!title || !link) {
      console.log('Missing required fields - title:', title, 'link:', link);
      return res.status(400).json({ 
        message: '제목과 링크는 필수 입력 항목입니다.',
        details: { title: !!title, link: !!link }
      });
    }

    // 빈 썸네일 값 처리
    const playlistData = {
      id: generateId(),
      userId: req.user.id,
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

    console.log('Playlist successfully created and saved');
    console.log('Total playlists:', playlists.length);

    res.status(201).json({
      message: '플레이리스트가 저장되었습니다',
      playlist: playlistData
    });
  } catch (error) {
    console.error('=== PLAYLIST CREATION ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.id);
    console.error('Request headers:', req.headers);
    
    res.status(500).json({ 
      message: '플레이리스트 저장 중 오류가 발생했습니다',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 플레이리스트 목록 조회
app.get('/api/playlists', authenticateToken, async (req, res) => {
  try {
    const userPlaylists = playlists
      .filter(playlist => playlist.userId === req.user.id)
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
      playlist => playlist.id === req.params.id && playlist.userId === req.user.id
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
      playlist => playlist.id === req.params.id && playlist.userId === req.user.id
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

// Multer 오류 처리 미들웨어
const handleMulterError = (error, req, res, next) => {
  console.log('Multer error:', error);
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: '파일 크기가 너무 큽니다. 1MB 이하의 파일을 선택해주세요.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '한 번에 하나의 파일만 업로드할 수 있습니다.' });
    }
  }
  if (error.message === '이미지 파일만 업로드 가능합니다.') {
    return res.status(400).json({ message: '이미지 파일만 업로드할 수 있습니다.' });
  }
  next(error);
};

// 썸네일 업로드 (Base64 방식)
app.post('/api/upload-thumbnail-base64', authenticateToken, (req, res) => {
  try {
    console.log('=== THUMBNAIL UPLOAD REQUEST (Base64) ===');
    console.log('User ID:', req.user.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Filename:', req.body.filename);
    console.log('Mimetype:', req.body.mimetype);
    console.log('Base64 data length:', req.body.thumbnail?.length);

    const { thumbnail, filename, mimetype } = req.body;

    if (!thumbnail) {
      console.log('No Base64 data provided');
      return res.status(400).json({ message: '이미지 데이터가 제공되지 않았습니다.' });
    }

    // Base64 데이터를 버퍼로 변환
    const imageBuffer = Buffer.from(thumbnail, 'base64');
    console.log('Image buffer size:', imageBuffer.length);

    // 파일명 생성
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(filename) || '.jpg';
    const generatedFilename = `thumbnail-${uniqueSuffix}${fileExtension}`;
    const filePath = path.join(uploadDir, generatedFilename);

    // 파일 저장
    fs.writeFileSync(filePath, imageBuffer);
    console.log('File saved to:', filePath);

    const thumbnailUrl = `/uploads/${generatedFilename}`;
    console.log('Generated thumbnail URL:', thumbnailUrl);
    
    res.json({ 
      message: '썸네일이 업로드되었습니다.',
      thumbnailUrl: thumbnailUrl
    });
  } catch (error) {
    console.error('Base64 thumbnail upload error:', error);
    res.status(500).json({ message: '썸네일 업로드 중 오류가 발생했습니다.' });
  }
});

// 썸네일 업로드 (기존 FormData 방식 - 호환성을 위해 유지)
app.post('/api/upload-thumbnail', authenticateToken, upload.single('thumbnail'), handleMulterError, (req, res) => {
  try {
    console.log('=== THUMBNAIL UPLOAD REQUEST (FormData) ===');
    console.log('User ID:', req.user.id);
    console.log('Uploaded file:', req.file);
    console.log('Request headers:', req.headers);

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const thumbnailUrl = `/uploads/${req.file.filename}`;
    console.log('Generated thumbnail URL:', thumbnailUrl);
    
    res.json({ 
      message: '썸네일이 업로드되었습니다.',
      thumbnailUrl: thumbnailUrl
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ message: '썸네일 업로드 중 오류가 발생했습니다.' });
  }
});

// 인스타그램 스토리 정보 생성
app.post('/api/generate-story', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.body;
    
    const playlist = playlists.find(
      playlist => playlist.id === playlistId && playlist.userId === req.user.id
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

// 인스타그램 스토리 이미지 생성
app.post('/api/generate-story-image', authenticateToken, async (req, res) => {
  try {
    const { playlistId } = req.body;
    
    const playlist = playlists.find(
      playlist => playlist.id === playlistId && playlist.userId === req.user.id
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

    // 썸네일 이미지가 있으면 배경으로 사용
    if (playlist.thumbnail && playlist.thumbnail.startsWith('/uploads/')) {
      try {
        const imagePath = path.join(__dirname, playlist.thumbnail);
        if (fs.existsSync(imagePath)) {
          const image = await loadImage(imagePath);
          
          // 이미지를 배경으로 설정 (투명도 적용)
          ctx.globalAlpha = 0.3;
          ctx.drawImage(image, 0, 0, 1080, 1920);
          ctx.globalAlpha = 1.0;
          
          // 어두운 오버레이 추가
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, 1080, 1920);
        }
      } catch (error) {
        console.log('썸네일 이미지 로드 실패:', error.message);
      }
    }

    // 플랫폼 아이콘 그리기
    const platformIcon = playlist.platform === 'youtube' ? '🎵' : '🎧';
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(platformIcon, 540, 200);

    // 제목 그리기
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(playlist.title, 540, 400);

    // Vibe 정보 그리기
    if (playlist.vibe) {
      ctx.font = '36px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Vibe: ${playlist.vibe}`, 540, 600);
    }

    // Kick Music 정보 그리기
    if (playlist.kickMusic) {
      ctx.font = '36px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Kick: ${playlist.kickMusic}`, 540, 700);
    }

    // 플랫폼 정보 그리기
    ctx.font = '28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${playlist.platform.toUpperCase()}`, 540, 900);

    // Vault 로고 그리기
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('VAULT', 540, 1700);

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

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
});
