import { Suspense } from 'react';
import DashboardContent from './DashboardContent';
import Nav from '@/components/landing/Nav';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={
        <div className="pr-page">
          <div className="pr-wrap">
            <div className="ap-page-header">
              <div className="ap-skeleton" style={{ width: '25%', height: 32 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                <div className="ap-skeleton" style={{ height: 100 }} />
                <div className="ap-skeleton" style={{ height: 100 }} />
                <div className="ap-skeleton" style={{ height: 100 }} />
              </div>
            </div>
          </div>
        </div>
      }>
        <DashboardContent />
      </Suspense>
      <Footer />
    </>
  );
}
