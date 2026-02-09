import type { ComponentPropsWithoutRef } from 'react'
import { cx } from './utils'

type PillProps = {
  active?: boolean
} & ComponentPropsWithoutRef<'button'>

export default function Pill({ active, className, type = 'button', ...props }: PillProps) {
  return (
    <button
      type={type}
      className={cx('ui-pill', active && 'ui-pill--active', className)}
      {...props}
    />
  )
}
