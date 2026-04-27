import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import type { RegisterPayload } from '@/entities/Auth/api';

const Signup = () => {
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    setLoading(true);
    try {
      const payload: RegisterPayload = {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone.startsWith('+') ? values.phone : `+${values.phone}`,
        userType: 'LEARNER',
      };
      await register(payload);
      message.success('Account created! You are now logged in.');
      navigate('/', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      message.error('Google sign-in failed');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle(idToken, 'LEARNER');
      message.success('Welcome!');
      navigate('/', { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-20">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-block text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8"
        >
          BISP
        </Link>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create account</h1>
          <p className="text-gray-600 mb-6">
            Sign up as a learner to find your perfect tutor.
          </p>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="fullName"
              label="Full name"
              rules={[{ required: true, message: 'Please enter your full name' }]}
            >
              <Input placeholder="John Doe" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                type="email"
                placeholder="you@example.com"
                size="large"
                className="rounded-xl"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please enter a password' },
                { min: 8, message: 'Password must be at least 8 characters' },
              ]}
            >
              <Input.Password placeholder="••••••••" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Phone"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input placeholder="+1234567890" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-0 font-semibold"
              >
                Sign up
              </Button>
            </Form.Item>
          </Form>
          <div className="my-6 flex items-center gap-3 text-gray-400">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs font-medium uppercase tracking-wide">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error('Google sign-in failed')}
              text="signup_with"
            />
          </div>
          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
