import { Suspense } from 'react'
import SiteLayout from '@/components/shell/SiteLayout'
import DashboardContent from './DashboardContent'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="nb">
            <p>Loading dashboard...</p>
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </SiteLayout>
  )
}
