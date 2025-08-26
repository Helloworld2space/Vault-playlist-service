import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiUsers, FiMusic, FiShare2, FiTrendingUp, FiEye, FiActivity } from 'react-icons/fi';
import axios from 'axios';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Title = styled.h1`
  color: #333;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 2rem;
  text-align: center;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  background: ${props => props.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
`;

const StatTitle = styled.h3`
  color: #666;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
`;

const StatValue = styled.div`
  color: #333;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const StatChange = styled.div`
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-size: 14px;
  font-weight: 500;
`;

const Section = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
`;

const SectionTitle = styled.h2`
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ChartContainer = styled.div`
  height: 300px;
  margin-bottom: 2rem;
`;

const PageViewsList = styled.div`
  display: grid;
  gap: 1rem;
`;

const PageViewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
`;

const PageName = styled.span`
  font-weight: 500;
  color: #333;
`;

const PageViews = styled.span`
  font-weight: 600;
  color: #667eea;
`;

const ActionsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActionItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ActionType = styled.span`
  font-weight: 600;
  color: #333;
  text-transform: capitalize;
`;

const ActionTime = styled.span`
  color: #666;
  font-size: 14px;
`;

const ActionDetails = styled.div`
  color: #666;
  font-size: 14px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 18px;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #ef4444;
  font-size: 18px;
`;

const RefreshButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }
`;

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/analytics/dashboard');
      setData(response.data);
      setError('');
    } catch (error) {
      setError('분석 데이터를 불러오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingState>분석 데이터를 불러오는 중...</LoadingState>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <ErrorState>{error}</ErrorState>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <RefreshButton onClick={fetchAnalytics}>다시 시도</RefreshButton>
        </div>
      </DashboardContainer>
    );
  }

  if (!data) return null;

  return (
    <DashboardContainer>
      <Title>📊 Vault 분석 대시보드</Title>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <RefreshButton onClick={fetchAnalytics}>
          데이터 새로고침
        </RefreshButton>
      </div>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
              <FiUsers />
            </StatIcon>
            <StatTitle>총 회원가입</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.totalSignups}</StatValue>
          <StatChange positive>전체 기간</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)">
              <FiActivity />
            </StatIcon>
            <StatTitle>총 로그인</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.totalLogins}</StatValue>
          <StatChange positive>전체 기간</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)">
              <FiMusic />
            </StatIcon>
            <StatTitle>생성된 플레이리스트</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.totalPlaylistsCreated}</StatValue>
          <StatChange positive>전체 기간</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)">
              <FiShare2 />
            </StatIcon>
            <StatTitle>스토리 공유</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.totalPlaylistsShared}</StatValue>
          <StatChange positive>전체 기간</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)">
              <FiEye />
            </StatIcon>
            <StatTitle>현재 사용자</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.currentUsers}</StatValue>
          <StatChange positive>활성 사용자</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <StatHeader>
            <StatIcon color="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)">
              <FiTrendingUp />
            </StatIcon>
            <StatTitle>서비스 운영일</StatTitle>
          </StatHeader>
          <StatValue>{data.overview.uptime}</StatValue>
          <StatChange positive>일</StatChange>
        </StatCard>
      </StatsGrid>

      <Section>
        <SectionTitle>
          <FiTrendingUp />
          최근 7일 페이지 뷰
        </SectionTitle>
        <ChartContainer>
          <div style={{ 
            display: 'flex', 
            alignItems: 'end', 
            height: '100%', 
            gap: '8px',
            padding: '20px 0'
          }}>
            {data.pageViews.last7Days.map((day, index) => (
              <div
                key={day.date}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  height: `${Math.max((day.views / Math.max(...data.pageViews.last7Days.map(d => d.views))) * 200, 20)}px`,
                  borderRadius: '8px 8px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
                title={`${day.date}: ${day.views} 뷰`}
              >
                {day.views}
              </div>
            ))}
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '10px',
            fontSize: '12px',
            color: '#666'
          }}>
            {data.pageViews.last7Days.map(day => (
              <span key={day.date}>
                {new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
              </span>
            ))}
          </div>
        </ChartContainer>
      </Section>

      <Section>
        <SectionTitle>
          <FiEye />
          오늘의 인기 페이지
        </SectionTitle>
        <PageViewsList>
          {data.topPages.map((page, index) => (
            <PageViewItem key={index}>
              <PageName>{page.page}</PageName>
              <PageViews>{page.views} 뷰</PageViews>
            </PageViewItem>
          ))}
        </PageViewsList>
      </Section>

      <Section>
        <SectionTitle>
          <FiActivity />
          최근 사용자 행동
        </SectionTitle>
        <ActionsList>
          {data.recentActions.map((action, index) => (
            <ActionItem key={index}>
              <ActionHeader>
                <ActionType>{action.type}</ActionType>
                <ActionTime>
                  {new Date(action.timestamp).toLocaleString('ko-KR')}
                </ActionTime>
              </ActionHeader>
              <ActionDetails>
                {action.page && `페이지: ${action.page}`}
                {action.details && `상세: ${JSON.stringify(action.details)}`}
                {action.userId && `사용자: ${action.userId}`}
              </ActionDetails>
            </ActionItem>
          ))}
        </ActionsList>
      </Section>
    </DashboardContainer>
  );
};

export default AnalyticsDashboard;
