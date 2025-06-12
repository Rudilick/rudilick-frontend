import React from 'react';
import { useGoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useUser } from '../contexts/UserContext';

const CLIENT_ID = '170520257716-ftoecfa6d0pd19453hc41fooaanrh9nd.apps.googleusercontent.com';

export default function GoogleLoginButton() {
  const { login, user } = useUser();

  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      const token = tokenResponse.credential;
      login(token);
    },
    onError: () => {
      console.error('❌ Google Login Failed');
    },
  });

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        {user ? (
          <div className="text-xs text-gray-400">✅ {user.email}</div>
        ) : (
          <button
            onClick={googleLogin}
            className="flex items-center gap-2 bg-black/20 text-white text-sm font-medium px-4 py-2 rounded-full shadow-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="w-5 h-5"
            >
              <path
                fill="#4285F4"
                d="M24 9.5c3.5 0 6.7 1.3 9.1 3.4l6.8-6.8C35.5 2.2 30.2 0 24 0 14.6 0 6.6 5.8 2.7 14.2l7.9 6.2C12.6 13.6 17.8 9.5 24 9.5z"
              />
              <path
                fill="#34A853"
                d="M46.1 24.5c0-1.7-.1-2.9-.3-4.1H24v8h12.8c-.5 2.6-1.9 4.8-4 6.3v5.2h6.5c3.8-3.5 6-8.7 6-15.4z"
              />
              <path
                fill="#FBBC05"
                d="M10.6 28.4c-1.2-3.5-1.2-7.3 0-10.8v-5.3H4.1C1.5 17.6 0 20.7 0 24c0 3.3 1.5 6.4 4.1 9.1l6.5-4.7z"
              />
              <path
                fill="#EA4335"
                d="M24 48c6.5 0 12-2.1 16.1-5.7l-6.5-5.1c-2.1 1.4-4.9 2.1-9.6 2.1-6.2 0-11.4-4.1-13.3-9.7L4.1 33.1C8 41.3 16 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span className="whitespace-nowrap">Google 계정으로 로그인</span>
          </button>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}