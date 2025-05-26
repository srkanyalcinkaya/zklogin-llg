'use client';

import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { login, isAuthenticated, userAddress } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
          <p className="mb-6">You are logged in with address: {userAddress}</p>
          <a href="/dashboard" className="bg-blue-500 text-white px-4 py-2 rounded">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-8">zkLogin Demo for LLG</h1>
        <div className="space-y-4">
          <button
            onClick={() => login('google')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg block w-full"
          >
            Login with Google
          </button>
          {/* <button
            onClick={() => login('facebook')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg block w-full"
          >
            Login with Facebook
          </button>
          <button
            onClick={() => login('twitch')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg block w-full"
          >
            Login with Twitch
          </button> */}
        </div>
      </div>
    </div>
  );
}