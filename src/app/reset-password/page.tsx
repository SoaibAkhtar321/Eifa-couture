import type { Metadata } from 'next';

import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Set New Password | Eifa Couture',
  description: 'Set a new password for your Eifa Couture account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}