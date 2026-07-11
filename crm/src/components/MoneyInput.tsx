import { useRef } from 'react'
import { formatWithSpaces, sanitizeRublesInput } from '../utils/loanAmount'

interface MoneyInputProps {
  value: string
  onChange: (rawDigits: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
  hasError?: boolean
  isFixed?: boolean
}

function countDigitsBefore(str: string, position: number): number {
  let count = 0
  for (let i = 0; i < position && i < str.length; i++) {
    if (/\d/.test(str[i])) count++
  }
  return count
}

function cursorAfterDigits(digitCount: number, formatted: string): number {
  if (digitCount <= 0) return 0
  let digits = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digits++
      if (digits === digitCount) return i + 1
    }
  }
  return formatted.length
}

export function MoneyInput({ value, onChange, placeholder, className = 'input', readOnly, hasError, isFixed }: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const displayValue = formatWithSpaces(value)

  const handleChange = (raw: string) => {
    const input = inputRef.current
    const cursor = input?.selectionStart ?? 0
    const digitsBefore = countDigitsBefore(raw, cursor)
    const sanitized = sanitizeRublesInput(raw)

    onChange(sanitized)

    requestAnimationFrame(() => {
      if (!input) return
      const formatted = formatWithSpaces(sanitized)
      const newCursor = cursorAfterDigits(digitsBefore, formatted)
      input.setSelectionRange(newCursor, newCursor)
    })
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      className={`${className}${hasError ? ' input-error' : isFixed ? ' input-valid' : ''}`}
      value={displayValue}
      readOnly={readOnly}
      placeholder={placeholder}
      onChange={(e) => {
        if (!readOnly) handleChange(e.target.value)
      }}
    />
  )
}
