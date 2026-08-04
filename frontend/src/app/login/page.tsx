'use client';

import { login } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { Alert, Button, Card, Form, Input, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      const result = await login(values.email, values.password);
      setToken(result.accessToken);
      router.replace('/invoices');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Invalid email or password';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <Card
        style={{ width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(15,118,110,0.12)' }}
      >
        <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>
          SimpleInvoice
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Sign in to manage invoices
        </Typography.Paragraph>
        {error ? (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
        ) : null}
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input size="large" placeholder="reviewer@101digital.io" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Password is required' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Password"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}
