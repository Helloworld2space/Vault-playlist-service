import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiShare2, FiYoutube, FiMusic } from 'react-icons/fi';
import axios from 'axios';
import AddPlaylistModal from './AddPlaylistModal';
import EditPlaylistModal from './EditPlaylistModal';
import StoryPreviewModal from './StoryPreviewModal';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: white;
  font-size: 32px;
  font-weight: 700;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const PlaylistsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`;

const PlaylistCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
`;

const ThumbnailContainer = styled.div`
  width: 100%;
  height: 200px;
  border-radius: 12px;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const PlaylistTitle = styled.h3`
  color: white;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const PlaylistInfo = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-bottom: 1rem;
`;

const PlatformBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${props => props.platform === 'youtube' ? '#ff0000' : '#1db954'};
  color: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
`;

const VibeInfo = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 0.5rem;
`;

const KickMusicInfo = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 1rem;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-size: 16px;

  &.edit {
    background: rgba(255, 255, 255, 0.1);
    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }

  &.delete {
    background: rgba(255, 71, 87, 0.1);
    &:hover {
      background: rgba(255, 71, 87, 0.2);
    }
  }

  &.share {
    background: rgba(46, 213, 115, 0.1);
    &:hover {
      background: rgba(46, 213, 115, 0.2);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  padding: 4rem 2rem;

  h3 {
    font-size: 24px;
    margin-bottom: 1rem;
  }

  p {
    font-size: 16px;
    margin-bottom: 2rem;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: white;
  font-size: 18px;
`;

const Dashboard = ({ user }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [showStoryPreview, setShowStoryPreview] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/playlists', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched playlists:', response.data);
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('플레이리스트를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlaylist = async (playlistData) => {
    try {
      console.log('=== DASHBOARD: Adding playlist with data ===');
      console.log('Playlist data:', playlistData);
      console.log('Thumbnail URL:', playlistData.thumbnail);
      
      // 모바일에서 localStorage 접근 안전성 확인
      let token;
      try {
        token = localStorage.getItem('token');
      } catch (storageError) {
        console.error('localStorage access error:', storageError);
        setError('브라우저 저장소에 접근할 수 없습니다. 다시 로그인해주세요.');
        return;
      }

      if (!token) {
        console.log('No token found in localStorage');
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }
      
      console.log('Token found, making API request...');
      const response = await axios.post('/api/playlists', playlistData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000 // 15초 타임아웃 설정
      });
      
      console.log('Server response:', response.data);
      setPlaylists([response.data.playlist, ...playlists]);
      setShowAddModal(false);
      setError(''); // 성공 시 오류 메시지 초기화
      console.log('Playlist added successfully to state');
    } catch (error) {
      console.error('Error adding playlist:', error);
      
      // 모바일 특화 오류 처리
      if (error.code === 'ECONNABORTED') {
        setError('네트워크 연결이 불안정합니다. 다시 시도해주세요.');
      } else if (error.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else if (error.response?.status === 500) {
        setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || '입력 정보를 확인해주세요.');
      } else {
        setError('플레이리스트 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleEditPlaylist = async (playlistData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`/api/playlists/${editingPlaylist.id}`, playlistData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(playlists.map(p => p.id === editingPlaylist.id ? response.data.playlist : p));
      setEditingPlaylist(null);
    } catch (error) {
      setError('플레이리스트 수정 중 오류가 발생했습니다');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('정말로 이 플레이리스트를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(playlists.filter(p => p.id !== playlistId));
    } catch (error) {
      setError('플레이리스트 삭제 중 오류가 발생했습니다');
    }
  };

  const handleImageError = (playlistId) => {
    console.log('Image failed to load for playlist:', playlistId);
    setImageErrors(prev => ({
      ...prev,
      [playlistId]: true
    }));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // Base64 이미지인지 확인
    if (imagePath.startsWith('data:image/')) {
      console.log('Using Base64 image:', imagePath.substring(0, 50) + '...');
      return imagePath;
    }
    
    if (imagePath.startsWith('/uploads/')) {
      // Vercel에서는 placeholder 이미지 사용
      const fullUrl = `https://via.placeholder.com/300x200/667eea/ffffff?text=Vault+Thumbnail`;
      console.log('Generated image URL:', fullUrl);
      return fullUrl;
    }
    
    console.log('Using external image URL:', imagePath);
    return imagePath;
  };

  const renderThumbnail = (playlist) => {
    console.log('Rendering thumbnail for playlist:', playlist.id, 'thumbnail:', playlist.thumbnail);
    
    if (!playlist.thumbnail || imageErrors[playlist.id]) {
      console.log('Showing fallback icon for playlist:', playlist.id);
      return playlist.platform === 'youtube' ? <FiYoutube /> : <FiMusic />;
    }

    const imageUrl = getImageUrl(playlist.thumbnail);
    console.log('Image URL for playlist', playlist.id, ':', imageUrl);

    return (
      <ThumbnailImage
        src={imageUrl}
        alt={playlist.title}
        onError={(e) => {
          console.error('Image failed to load:', imageUrl, e);
          handleImageError(playlist.id);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', imageUrl);
        }}
      />
    );
  };

  const handleSharePlaylist = async (playlistId) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        setSelectedPlaylist(playlist);
        setShowStoryPreview(true);
      }
    } catch (error) {
      setError('스토리 미리보기를 불러오는 중 오류가 발생했습니다');
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingState>플레이리스트를 불러오는 중...</LoadingState>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>안녕하세요, {user.username}님! 🎵</Title>
        <AddButton onClick={() => setShowAddModal(true)}>
          <FiPlus size={20} />
          플레이리스트 추가
        </AddButton>
      </Header>

      {error && (
        <div className="error" style={{ marginBottom: '1rem', color: 'red' }}>
          {error}
        </div>
      )}

      {playlists.length === 0 ? (
        <EmptyState>
          <h3>아직 플레이리스트가 없습니다</h3>
          <p>첫 번째 플레이리스트를 추가해보세요!</p>
          <AddButton onClick={() => setShowAddModal(true)}>
            <FiPlus size={20} />
            플레이리스트 추가
          </AddButton>
        </EmptyState>
      ) : (
        <PlaylistsGrid>
          <AnimatePresence>
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ThumbnailContainer>
                  {renderThumbnail(playlist)}
                </ThumbnailContainer>
                
                <PlaylistTitle>{playlist.title}</PlaylistTitle>
                
                <PlaylistInfo>
                  <PlatformBadge platform={playlist.platform}>
                    {playlist.platform === 'youtube' ? <FiYoutube size={12} /> : <FiMusic size={12} />}
                    {playlist.platform === 'youtube' ? 'YouTube' : 'Spotify'}
                  </PlatformBadge>
                </PlaylistInfo>

                {playlist.vibe && (
                  <VibeInfo>
                    <strong>Vibe:</strong> {playlist.vibe}
                  </VibeInfo>
                )}

                {playlist.kickMusic && (
                  <KickMusicInfo>
                    <strong>Kick Music:</strong> {playlist.kickMusic}
                  </KickMusicInfo>
                )}

                <CardActions>
                  <ActionButton
                    className="edit"
                    onClick={() => setEditingPlaylist(playlist)}
                    title="편집"
                  >
                    <FiEdit />
                  </ActionButton>
                  <ActionButton
                    className="share"
                    onClick={() => handleSharePlaylist(playlist.id)}
                    title="인스타그램 스토리 공유"
                  >
                    <FiShare2 />
                  </ActionButton>
                  <ActionButton
                    className="delete"
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    title="삭제"
                  >
                    <FiTrash2 />
                  </ActionButton>
                </CardActions>
              </PlaylistCard>
            ))}
          </AnimatePresence>
        </PlaylistsGrid>
      )}

      {showAddModal && (
        <AddPlaylistModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddPlaylist}
        />
      )}

      {editingPlaylist && (
        <EditPlaylistModal
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
          onEdit={handleEditPlaylist}
        />
      )}

      {showStoryPreview && selectedPlaylist && (
        <StoryPreviewModal
          isOpen={showStoryPreview}
          onClose={() => {
            setShowStoryPreview(false);
            setSelectedPlaylist(null);
          }}
          playlist={selectedPlaylist}
        />
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
