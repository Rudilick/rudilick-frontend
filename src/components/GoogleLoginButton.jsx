import React from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useUser } from '../contexts/UserContext';

const CLIENT_ID = "170520257716-ftoecfa6d0pd19453hc41fooaanrh9nd.apps.googleusercontent.com";

export default function GoogleLoginButton() {
  const { login, user } = useUser();

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.credential;
      login(token);
    },
    onError: () => {
      console.error("❌ Google Login Failed");
    }
  });

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        {user ? (
          <div className="text-xs text-gray-400">✅ {user.email}</div>
        ) : (
          <button
            onClick={() => googleLogin()}
            className="bg-white px-4 py-2 rounded-full shadow"
          >
            <span className="opacity-30 font-medium text-sm">
              Google 계정으로 로그인
            </span>
          </button>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}