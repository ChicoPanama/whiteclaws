import type { ComponentPropsWithoutRef } from 'react'
import { cx } from './utils'

type InputProps = ComponentPropsWithoutRef<'input'>

export default function Input({ className, ...props }: InputProps) {
  return <input className={cx('ui-input', className)} {...props} />
}
