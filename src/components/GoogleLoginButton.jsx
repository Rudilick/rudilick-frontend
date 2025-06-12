import React from 'react';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';

const CLIENT_ID = "170520257716-ftoecfa6d0pd19453hc41fooaanrh9nd.apps.googleusercontent.com";

export default function GoogleLoginButton({ onSuccess }) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <div className="flex justify-center my-6">
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            const token = credentialResponse.credential;
            console.log("✅ Google ID Token:", token);
            onSuccess?.(token);  // 상위 컴포넌트에서 이 토큰을 서버로 전송하면 됨
          }}
          onError={() => {
            console.error("❌ Google Login Failed");
          }}
        />
      </div>
    </GoogleOAuthProvider>
  );
}