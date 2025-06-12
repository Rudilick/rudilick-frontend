import React, { createContext, useState, useContext, useEffect } from 'react';
import jwt_decode from 'jwt-decode';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // ✅ 자동 로그인 시도
  useEffect(() => {
    const token = localStorage.getItem('google_id_token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUser({
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        });
      } catch (e) {
        console.error('❌ 토큰 디코딩 실패:', e);
        localStorage.removeItem('google_id_token');
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('google_id_token', token);
    const decoded = jwt_decode(token);
    setUser({
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    });
  };

  const logout = () => {
    localStorage.removeItem('google_id_token');
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);