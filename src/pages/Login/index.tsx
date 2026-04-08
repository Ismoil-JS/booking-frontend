import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login({ email: values.email, password: values.password });
      message.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Login failed');
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
      await loginWithGoogle(idToken);
      message.success('Welcome!');
      navigate(from, { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 pt-20">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-block text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8"
        >
          BISP
        </Link>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Log in</h1>
          <p className="text-gray-600 mb-6">Enter your email and password.</p>
          <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input type="email" placeholder="you@example.com" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password placeholder="••••••••" size="large" className="rounded-xl" />
            </Form.Item>
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 border-0 font-semibold"
              >
                Log in
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
              text="signin_with"
            />
          </div>
          <p className="text-center text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
