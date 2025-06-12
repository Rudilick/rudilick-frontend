import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useUser } from '../contexts/UserContext';

const CLIENT_ID = "170520257716-ftoecfa6d0pd19453hc41fooaanrh9nd.apps.googleusercontent.com";

export default function GoogleLoginButton() {
  const { login, user } = useUser();

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        {user ? (
          <div className="text-xs text-gray-400">✅ {user.email}</div>
        ) : (
          <GoogleLogin
            onSuccess={(res) => {
              const token = res.credential;
              login(token);
            }}
            onError={() => {
              console.error("❌ Google Login Failed");
            }}
          />
        )}
      </div>
    </GoogleOAuthProvider>
  );
}