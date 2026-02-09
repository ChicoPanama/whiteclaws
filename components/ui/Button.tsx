import type { ComponentPropsWithoutRef, ElementType } from 'react'
import { cx } from './utils'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

type ButtonProps<T extends ElementType> = {
  as?: T
  variant?: ButtonVariant
  size?: ButtonSize
} & ComponentPropsWithoutRef<T>

export default function Button<T extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps<T>) {
  const Component = as ?? 'button'
  const isButton = Component === 'button'

  return (
    <Component
      className={cx('ui-button', `ui-button--${variant}`, `ui-button--${size}`, className)}
      {...(isButton
        ? { type: (props as ComponentPropsWithoutRef<'button'>).type ?? 'button' }
        : {})}
      {...props}
    />
  )
}
