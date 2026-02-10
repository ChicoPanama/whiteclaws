import Landing from '@/components/landing/Landing'
import { getJSONBounties } from '@/lib/data/bounties'

export default function Home() {
  const bounties = getJSONBounties()
  return <Landing bounties={bounties} />
}
