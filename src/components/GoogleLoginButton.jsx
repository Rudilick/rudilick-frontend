import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useUser } from '../contexts/UserContext';

const CLIENT_ID = '170520257716-ftoecfa6d0pd19453hc41fooaanrh9nd.apps.googleusercontent.com';

export default function GoogleLoginButton() {
  const { login, user } = useUser();

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center">
        {user ? (
          <div className="text-xs text-gray-400">✅ {user.email}</div>
        ) : (
          <div className="bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                const token = credentialResponse.credential;
                login(token);
              }}
              onError={() => {
                console.error('❌ Google Login Failed');
              }}
              theme="filled_black"
              text="signin_with"
              shape="pill"
            />
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}