import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiMusic } from 'react-icons/fi';
import axios from 'axios';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: white;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 24px;
  font-weight: 600;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Icon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.6);
`;

const Button = styled.button`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LinkText = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 1.5rem;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff4757;
  background: rgba(255, 71, 87, 0.1);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
`;

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      onLogin(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.message || '로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo>
          <FiMusic size={32} />
          Vault
        </Logo>
        
        <Title>로그인</Title>
        
        <Form onSubmit={handleSubmit}>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          
          <InputGroup>
            <Icon>
              <FiMail size={20} />
            </Icon>
            <Input
              type="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </InputGroup>
          
          <InputGroup>
            <Icon>
              <FiLock size={20} />
            </Icon>
            <Input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </Form>
        
        <LinkText>
          계정이 없으신가요? <Link to="/register">회원가입</Link>
        </LinkText>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;

