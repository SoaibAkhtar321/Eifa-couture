import type { Metadata } from 'next';

import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password | Eifa Couture',
  description: 'Reset the password for your Eifa Couture account.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}