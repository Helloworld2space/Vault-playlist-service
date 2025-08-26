import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FiMusic, FiLogOut, FiUser } from 'react-icons/fi';

const Nav = styled(motion.nav)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  font-size: 24px;
  font-weight: 700;
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Navbar = ({ user, onLogout }) => {
  return (
    <Nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Logo>
        <FiMusic size={32} />
        Vault
      </Logo>
      
      <UserSection>
        <UserInfo>
          <FiUser size={16} />
          {user.username}
        </UserInfo>
        <LogoutButton onClick={onLogout}>
          <FiLogOut size={16} />
          로그아웃
        </LogoutButton>
      </UserSection>
    </Nav>
  );
};

export default Navbar;

