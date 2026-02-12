import type { HeroesDataset, Hero } from '@/lib/types/heroes'
import heroesData from '@/public/data/immunefi-heroes.json'

const dataset = heroesData as HeroesDataset

export function getHeroes(): Hero[] {
  return dataset.heroes
}

export function getHeroesMeta() {
  return dataset.meta
}

export function getHeroByHandle(handle: string): Hero | undefined {
  return dataset.heroes.find(
    (h) => h.handle.toLowerCase() === handle.toLowerCase()
  )
}

export function getTopHeroes(n: number = 3): Hero[] {
  return dataset.heroes.slice(0, n)
}

export function getAggregateStats() {
  const heroes = dataset.heroes
  const totalEarned = heroes.reduce((sum, h) => sum + (h.total_earned_usd || 0), 0)
  const totalBugs = heroes.reduce((sum, h) => sum + (h.bugs_found || 0), 0)
  const withX = heroes.filter((h) => h.links.x_handle).length
  const withPfp = heroes.filter((h) => h.has_custom_pfp).length

  return {
    heroCount: heroes.length,
    totalEarned,
    totalBugs,
    withX,
    withPfp,
    totalEarnedDisplay:
      totalEarned >= 1_000_000
        ? `$${(totalEarned / 1_000_000).toFixed(0)}M`
        : `$${(totalEarned / 1_000).toFixed(0)}K`,
    totalBugsDisplay: totalBugs.toLocaleString(),
  }
}
