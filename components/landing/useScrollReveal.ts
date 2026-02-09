'use client'

import { useCallback, useEffect, useRef } from 'react'

export type RevealRef = (element: HTMLElement | null) => void

export default function useScrollReveal(): RevealRef {
  const elementsRef = useRef<Set<HTMLElement>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  const register = useCallback<RevealRef>((element) => {
    if (!element) return
    if (elementsRef.current.has(element)) return
    elementsRef.current.add(element)
    if (observerRef.current) {
      observerRef.current.observe(element)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    observerRef.current = observer
    elementsRef.current.forEach((element) => observer.observe(element))

    return () => {
      observer.disconnect()
    }
  }, [])

  return register
}
