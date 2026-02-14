import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://whiteclaws-dun.vercel.app'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/bounties`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/protocols`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/heroes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/agents`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/learn`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${base}/submit`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.2 },
  ]
}
