import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMusic, FiYoutube, FiImage } from 'react-icons/fi';
import axios from 'axios';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    padding: 0.5rem;
    align-items: flex-start;
    padding-top: 2rem;
  }
`;

const ModalContent = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    max-height: 95vh;
    border-radius: 16px;
    width: 100%;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 10;

  &:hover {
    color: white;
  }
`;

const Title = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  padding: 2rem 2rem 0 2rem;
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    font-size: 20px;
    padding: 1.5rem 1rem 0 1rem;
    margin-bottom: 1rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 0 2rem 2rem 2rem;
  overflow-y: auto;
  flex: 1;
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    gap: 1rem;
    padding: 0 1rem 1rem 1rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: white;
  font-weight: 500;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
  min-height: 44px; /* 모바일 터치 최적화 */

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    font-size: 16px; /* iOS 줌 방지 */
    min-height: 48px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    font-size: 16px; /* iOS 줌 방지 */
    min-height: 100px;
  }
`;

const PlatformSelector = styled.div`
  display: flex;
  gap: 1rem;
`;

const PlatformOption = styled.button`
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: ${props => props.selected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  min-height: 44px; /* 모바일 터치 최적화 */

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    &:active {
      background: rgba(255, 255, 255, 0.15);
    }
  }
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    min-height: 48px;
    font-size: 16px;
  }
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  background: rgba(255, 71, 87, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 14px;
`;

const FileUploadArea = styled.div`
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }

  &.has-file {
    border-color: #2ed573;
    background: rgba(46, 213, 115, 0.1);
  }
  
  /* 모바일 최적화 */
  @media (max-width: 768px) {
    padding: 1.5rem;
    min-height: 100px;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadIcon = styled.div`
  font-size: 48px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
`;

const UploadText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 0.5rem;
`;

const UploadHint = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`;

const ThumbnailPreview = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 12px;
  background: ${props => props.image ? `url(${props.image})` : 'rgba(255, 255, 255, 0.1)'};
  background-size: cover;
  background-position: center;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const RemoveButton = styled.button`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  color: #ff4757;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 71, 87, 0.2);
  }
`;

const AddPlaylistModal = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    link: '',
    title: '',
    thumbnail: '',
    vibe: '',
    kickMusic: '',
    platform: ''
  });
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLinkChange = async (e) => {
    const link = e.target.value;
    setFormData({ ...formData, link });

    if (link && (link.includes('youtube.com') || link.includes('spotify.com'))) {
      setExtracting(true);
      try {
        // 모바일에서 localStorage 접근 안전성 확인
        let token;
        try {
          token = localStorage.getItem('token');
        } catch (storageError) {
          console.error('localStorage access error:', storageError);
          setError('브라우저 저장소에 접근할 수 없습니다. 다시 로그인해주세요.');
          setExtracting(false);
          return;
        }

        if (!token) {
          setError('로그인이 필요합니다. 다시 로그인해주세요.');
          setExtracting(false);
          return;
        }

        const response = await axios.post('/api/extract-info', { link }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10초 타임아웃 설정
        });
        
        setFormData(prev => ({
          ...prev,
          link,
          platform: response.data.platform,
          title: response.data.title || prev.title,
          // 썸네일은 유효한 URL이 있을 때만 설정, 빈 값이면 기존 값 유지
          thumbnail: response.data.thumbnail && response.data.thumbnail.trim() !== '' ? response.data.thumbnail : prev.thumbnail
        }));
      } catch (error) {
        console.error('정보 추출 실패:', error);
        // 모바일에서 네트워크 오류 시 사용자에게 알림
        if (error.code === 'ECONNABORTED') {
          setError('네트워크 연결이 불안정합니다. 다시 시도해주세요.');
        } else {
          setError('링크 정보를 가져오는 중 오류가 발생했습니다.');
        }
      } finally {
        setExtracting(false);
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log('=== FILE SELECTION ===');
    console.log('Selected file:', file);
    
    if (file) {
      // 파일 크기 검증 (5MB 제한)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
        return;
      }

      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드할 수 있습니다.');
        return;
      }

      console.log('File validation passed:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      setSelectedFile(file);
      setError(''); // 오류 메시지 초기화
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target.result);
        console.log('Thumbnail preview generated');
      };
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        setError('파일을 읽는 중 오류가 발생했습니다.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return null;

    console.log('=== FILE UPLOAD START ===');
    console.log('Selected file:', selectedFile);
    console.log('File size:', selectedFile.size);
    console.log('File type:', selectedFile.type);

    setError('');

    try {
      // 모바일에서 localStorage 접근 안전성 확인
      let token;
      try {
        token = localStorage.getItem('token');
      } catch (storageError) {
        console.error('localStorage access error during file upload:', storageError);
        setError('브라우저 저장소에 접근할 수 없습니다. 다시 로그인해주세요.');
        return null;
      }

      if (!token) {
        console.log('No token found for file upload');
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        return null;
      }

      const formData = new FormData();
      formData.append('thumbnail', selectedFile);

      console.log('FormData created:', formData);
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('Uploading file to server...');
      const response = await axios.post('/api/upload-thumbnail', formData, {
        headers: { 
          Authorization: `Bearer ${token}`
          // Content-Type을 명시적으로 설정하지 않음 (axios가 자동으로 multipart/form-data 설정)
        },
        timeout: 30000, // 30초 타임아웃 (파일 업로드는 더 오래 걸릴 수 있음)
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('File upload response:', response.data);
      const thumbnailUrl = response.data.thumbnailUrl;
      
      setFormData(prev => ({
        ...prev,
        thumbnail: thumbnailUrl
      }));
      
      console.log('File uploaded successfully:', thumbnailUrl);
      return thumbnailUrl;
    } catch (error) {
      console.error('File upload error:', error);
      
      // 모바일 특화 오류 처리
      if (error.code === 'ECONNABORTED') {
        setError('파일 업로드 시간이 초과되었습니다. 다시 시도해주세요.');
      } else if (error.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (error.response?.status === 413) {
        setError('파일 크기가 너무 큽니다. 5MB 이하의 파일을 선택해주세요.');
      } else if (error.response?.status === 400) {
        setError('지원하지 않는 파일 형식입니다. 이미지 파일을 선택해주세요.');
      } else {
        setError('썸네일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
      return null;
    }
  };

  const handleRemoveThumbnail = () => {
    setSelectedFile(null);
    setThumbnailPreview('');
    setFormData(prev => ({
      ...prev,
      thumbnail: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('=== FORM SUBMISSION START ===');
      console.log('Form data:', formData);
      console.log('Selected file:', selectedFile);

      // 모바일에서 필수 필드 검증
      if (!formData.link || !formData.title) {
        console.log('Validation failed - missing required fields');
        setError('링크와 제목은 필수 입력 항목입니다.');
        setLoading(false);
        return;
      }

      let finalFormData = { ...formData };
      
      // 썸네일이 선택되었지만 업로드되지 않은 경우 먼저 업로드
      if (selectedFile && !formData.thumbnail) {
        console.log('Uploading thumbnail file...');
        const thumbnailUrl = await handleFileUpload();
        if (thumbnailUrl) {
          finalFormData = { ...formData, thumbnail: thumbnailUrl };
          console.log('Thumbnail uploaded successfully:', thumbnailUrl);
        }
      }

      // 빈 썸네일 값 제거 (서버로 전송하지 않음)
      if (!finalFormData.thumbnail || finalFormData.thumbnail.trim() === '') {
        delete finalFormData.thumbnail;
      }

      console.log('Final form data to send:', finalFormData);
      console.log('Calling onAdd function...');
      
      await onAdd(finalFormData);
      
      console.log('Form submission completed successfully');
    } catch (error) {
      console.error('플레이리스트 추가 오류:', error);
      if (error.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (error.response?.status === 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        setError('플레이리스트 추가 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
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

          <Title>새 플레이리스트 추가</Title>

          <Form onSubmit={handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormGroup>
              <Label>링크</Label>
              <Input
                type="url"
                name="link"
                placeholder="YouTube 또는 Spotify 링크를 입력하세요"
                value={formData.link}
                onChange={handleLinkChange}
                required
              />
              {extracting && <LoadingMessage>정보를 추출하는 중...</LoadingMessage>}
            </FormGroup>

            <FormGroup>
              <Label>플랫폼</Label>
              <PlatformSelector>
                <PlatformOption
                  type="button"
                  selected={formData.platform === 'youtube'}
                  onClick={() => setFormData({ ...formData, platform: 'youtube' })}
                >
                  <FiYoutube size={16} />
                  YouTube
                </PlatformOption>
                <PlatformOption
                  type="button"
                  selected={formData.platform === 'spotify'}
                  onClick={() => setFormData({ ...formData, platform: 'spotify' })}
                >
                  <FiMusic size={16} />
                  Spotify
                </PlatformOption>
              </PlatformSelector>
            </FormGroup>

            <FormGroup>
              <Label>제목</Label>
              <Input
                type="text"
                name="title"
                placeholder="플레이리스트 제목"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>썸네일 (선택사항)</Label>
              
              {thumbnailPreview || formData.thumbnail ? (
                <div>
                  <ThumbnailPreview image={thumbnailPreview || formData.thumbnail}>
                    {!thumbnailPreview && !formData.thumbnail && '썸네일 미리보기'}
                  </ThumbnailPreview>
                  <RemoveButton onClick={handleRemoveThumbnail}>
                    썸네일 제거
                  </RemoveButton>
                </div>
              ) : (
                <FileUploadArea 
                  onClick={() => document.getElementById('thumbnail-input').click()}
                  className={selectedFile ? 'has-file' : ''}
                >
                  <FileInput
                    id="thumbnail-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    capture="environment"
                  />
                  <UploadIcon>
                    <FiImage size={48} />
                  </UploadIcon>
                  <UploadText>
                    {selectedFile ? selectedFile.name : '썸네일 이미지를 선택하세요'}
                  </UploadText>
                  <UploadHint>
                    JPG, PNG, GIF 파일 (최대 5MB)
                  </UploadHint>
                </FileUploadArea>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Vibe (선택사항)</Label>
              <Input
                type="text"
                name="vibe"
                placeholder="예: 차분한, 에너지 넘치는, 로맨틱한"
                value={formData.vibe}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup>
              <Label>Kick Music (선택사항)</Label>
              <Textarea
                name="kickMusic"
                placeholder="이 플레이리스트를 듣고 싶은 상황이나 감정을 설명해주세요"
                value={formData.kickMusic}
                onChange={handleChange}
              />
            </FormGroup>

            <ButtonGroup>
              <Button type="button" className="secondary" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" className="primary" disabled={loading}>
                {loading ? '추가 중...' : '추가하기'}
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </ModalOverlay>
    </AnimatePresence>
  );
};

export default AddPlaylistModal;

