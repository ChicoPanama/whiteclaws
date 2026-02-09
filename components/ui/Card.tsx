import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cx } from './utils'

type CardProps<T extends ElementType> = {
  as?: T
  interactive?: boolean
} & ComponentPropsWithoutRef<T>

export default function Card<T extends ElementType = 'div'>({
  as,
  interactive,
  className,
  ...props
}: CardProps<T>) {
  const Component = as ?? 'div'

  return (
    <Component
      className={cx('ui-card', interactive && 'ui-card--interactive', className)}
      {...props}
    />
  )
}
