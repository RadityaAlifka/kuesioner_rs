'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // <-- Gunakan ini
import Link from 'next/link';

// ... (Fungsi error helper kamu sudah bagus, tidak perlu diubah)
interface ErrorWithMessage {
  message: string;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

function getErrorMessage(error: unknown) {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 2. Buat client Supabase di dalam komponen
  const supabase = createClientComponentClient(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sekarang, 'supabase' di sini sudah benar
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect akan berhasil karena cookie sudah di-set dengan benar
      router.push('/admin/dashboard');

      // router.refresh() opsional, berguna untuk me-refresh data di server component
      // Biarkan saja, ini praktik yang bagus.
      //router.refresh(); 

    } catch (error) {
      console.error('Error logging in:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    // ... (Fungsi handleSignUp kamu juga harus menggunakan client yang sama)
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      alert('Akun admin berhasil dibuat! Silakan cek email untuk verifikasi.');
    } catch (error) {
      console.error('Error signing up:', error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-600 mt-2">Silakan masuk untuk mengakses dashboard</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="email@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
            }`}
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleSignUp}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
            }`}
          >
            Buat Akun Admin
          </button>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-orange-500 hover:text-orange-700 font-medium"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}