import type { ComponentPropsWithoutRef } from 'react'
import { cx } from './utils'

type SelectProps = ComponentPropsWithoutRef<'select'>

export default function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="ui-select-wrap">
      <select className={cx('ui-select', className)} {...props}>
        {children}
      </select>
      <span className="ui-select-chevron">▾</span>
    </div>
  )
}
