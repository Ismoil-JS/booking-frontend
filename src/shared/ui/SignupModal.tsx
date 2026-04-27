import { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useAuth } from '@/contexts/AuthContext';

export interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

const SignupModal = ({ open, onClose }: SignupModalProps) => {
  const [form] = Form.useForm<SignupFormValues>();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (values: SignupFormValues) => {
    setLoading(true);
    try {
      await register({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        phone: values.phone.startsWith('+') ? values.phone : `+${values.phone}`,
        userType: 'LEARNER',
      });
      message.success('Account created! You are now logged in.');
      form.resetFields();
      onClose();
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Create account"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={440}
      className="rounded-2xl"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
        className="mt-4"
      >
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
          <Input type="email" placeholder="you@example.com" size="large" className="rounded-xl" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 8, message: 'At least 8 characters' },
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
        <Form.Item className="mb-0 mt-6">
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
    </Modal>
  );
};

export default SignupModal;
