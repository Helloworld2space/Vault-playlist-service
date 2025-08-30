import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiYoutube, FiMusic, FiInstagram, FiDownload } from 'react-icons/fi';
import axios from 'axios';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  z-index: 10;
  
  &:hover {
    color: #333;
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 24px;
  font-weight: 700;
`;

const StoryPreview = styled.div`
  width: 100%;
  max-width: 360px;
  height: 640px;
  margin: 0 auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 8px solid #333;
`;

const StoryHeader = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
  z-index: 2;
`;

const StoryTitle = styled.h1`
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
`;

const StoryThumbnail = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.image ? `url(${props.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  background-size: cover;
  background-position: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
  }
`;

const StoryContent = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
  z-index: 2;
`;

const StoryInfo = styled.div`
  color: white;
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StoryLabel = styled.span`
  font-weight: 600;
  font-size: 16px;
  display: block;
  margin-bottom: 5px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const StoryValue = styled.span`
  font-size: 18px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
`;

const PlatformIcon = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: ${props => props.platform === 'youtube' ? '#ff0000' : '#1db954'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  z-index: 3;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 2rem;
  justify-content: center;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: #f8f9fa;
    color: #333;
    border: 2px solid #e9ecef;
    
    &:hover {
      background: #e9ecef;
      transform: translateY(-2px);
    }
  }
`;

const InfoText = styled.p`
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 1rem;
  line-height: 1.5;
`;

const StoryPreviewModal = ({ isOpen, onClose, playlist }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !playlist) return null;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('/uploads/')) {
      // Vercel에서는 placeholder 이미지 사용
      return `https://via.placeholder.com/300x200/667eea/ffffff?text=Vault+Thumbnail`;
    }
    
    return imagePath;
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await axios.post(
        '/api/generate-story-image',
        { playlistId: playlist.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // 이미지 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vault-story-${playlist.id}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert('스토리 이미지가 다운로드되었습니다!');
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      // 먼저 이미지를 다운로드
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await axios.post(
        '/api/generate-story-image',
        { playlistId: playlist.id },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          responseType: 'blob'
        }
      );

      // 이미지 다운로드
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `vault-story-${playlist.title}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // 인스타그램 공유 안내
      alert(`스토리 이미지가 다운로드되었습니다!\n\n📱 인스타그램 공유 방법:\n1. 인스타그램 앱 열기\n2. 스토리 추가 버튼 클릭\n3. 다운로드된 이미지 선택\n4. 원하는 텍스트나 스티커 추가\n5. 스토리 공유하기\n\n이미지 파일명: vault-story-${playlist.title}.png`);
    } catch (error) {
      console.error('스토리 공유 오류:', error);
      alert('스토리 이미지 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <AnimatePresence>
      <ModalOverlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <ModalContent
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>

          <Title>인스타그램 스토리 미리보기</Title>

          <StoryPreview>
            <StoryThumbnail image={getImageUrl(playlist.thumbnail)} />
            
            <StoryHeader>
              <StoryTitle>{playlist.title}</StoryTitle>
            </StoryHeader>

            <PlatformIcon platform={playlist.platform}>
              {playlist.platform === 'youtube' ? <FiYoutube /> : <FiMusic />}
            </PlatformIcon>

            <StoryContent>
              {playlist.vibe && (
                <StoryInfo>
                  <StoryLabel>Vibe</StoryLabel>
                  <StoryValue>{playlist.vibe}</StoryValue>
                </StoryInfo>
              )}
              
              {playlist.kickMusic && (
                <StoryInfo>
                  <StoryLabel>Kick Music</StoryLabel>
                  <StoryValue>{playlist.kickMusic}</StoryValue>
                </StoryInfo>
              )}
              
              <StoryInfo>
                <StoryLabel>Platform</StoryLabel>
                <StoryValue>
                  {playlist.platform === 'youtube' ? 'YouTube' : 'Spotify'}
                </StoryValue>
              </StoryInfo>
            </StoryContent>
          </StoryPreview>

          <ActionButtons>
            <ActionButton className="primary" onClick={handleShare}>
              <FiInstagram size={20} />
              인스타그램 공유
            </ActionButton>
            <ActionButton className="secondary" onClick={handleDownload} disabled={isDownloading}>
              <FiDownload size={20} />
              {isDownloading ? '다운로드 중...' : '이미지 다운로드'}
            </ActionButton>
          </ActionButtons>

          <InfoText>
            💡 Canvas API가 구현되었습니다!<br />
            • "인스타그램 공유": 이미지 다운로드 + 공유 방법 안내<br />
            • "이미지 다운로드": 고품질 스토리 이미지(1080x1920) 다운로드
          </InfoText>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};

export default StoryPreviewModal;
