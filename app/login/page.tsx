import { Suspense } from 'react';
import LoginForm from './LoginForm';
import Nav from '@/components/landing/Nav';
import Footer from '@/components/Footer';

export default function LoginPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={
        <div className="lg-page">
          <div className="lg-wrap">
            <div className="ap-spinner" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
