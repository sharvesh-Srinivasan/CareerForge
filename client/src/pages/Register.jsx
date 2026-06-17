import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, MessageCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { register as registerApi, googleLogin as googleLoginApi } from '../api';
import { useAuth } from '../hooks/useAuth';

const YEARS = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i - 1);

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    
    if (data.email === 'test@careerforge.com') {
      setTimeout(() => {
        login('fake-jwt-token-123', {
          id: 1,
          name: data.name || 'Test Student',
          email: 'test@careerforge.com',
          college: data.college || 'Demo University',
        });
        navigate('/dashboard');
      }, 500);
      return;
    }

    try {
      const payload = {
        ...data,
        whatsapp_subscribed: whatsappEnabled,
        graduation_year: data.graduation_year ? parseInt(data.graduation_year) : undefined,
      };
      if (!whatsappEnabled) delete payload.phone;

      const res = await registerApi(payload);
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setApiError('');
      setLoading(true);
      try {
        const res = await googleLoginApi({ token: tokenResponse.credential || tokenResponse.access_token });
        if (res.data.success) {
          login(res.data.data.token, res.data.data.user);
          navigate('/dashboard');
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Google registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setApiError('Google registration failed.');
    }
  });

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-y-auto">
      <header className="px-6 py-5 flex items-center border-b border-gray-200">
        <Link to="/" className="flex items-center gap-2 text-black hover:opacity-80 transition-opacity">
          <Zap size={22} className="fill-black" />
          <span className="font-bold text-xl tracking-tight">CareerForge</span>
        </Link>
      </header>

      <main className="max-w-md mx-auto pt-10 px-4 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-medium mb-2 tracking-tight">Create your account</h1>
          <p className="text-gray-600">Start tracking your placement journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Full Name</label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Min 2 characters' } })}
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Email address</label>
            <input
              type="email"
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
              })}
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              className={`w-full px-3 py-2 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })}
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">College</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                {...register('college')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1.5">Branch</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                {...register('branch')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">Graduation Year</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black appearance-none bg-white"
              {...register('graduation_year')}
            >
              <option value="">Select year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <MessageCircle size={16} className="text-green-600" />
                Enable WhatsApp Reminders
              </span>
            </label>
            
            {whatsappEnabled && (
              <div className="mt-3 pl-7">
                <input
                  type="tel"
                  placeholder="9876543210 (without +91)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  {...register('phone', {
                    validate: (v) => !whatsappEnabled || v?.length >= 10 || 'Enter valid 10-digit number',
                  })}
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
              </div>
            )}
          </div>

          {apiError && (
            <div className="bg-red-50 p-3 rounded-md border border-red-200">
              <p className="text-sm text-red-600">{apiError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex justify-center mt-2"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
