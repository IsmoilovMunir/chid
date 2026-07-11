import logoUrl from '../assets/logochid.svg'

interface ChidLogoProps {
  className?: string
}

export function ChidLogo({ className = 'h-14 w-auto md:h-16' }: ChidLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="CHID — Агентство недвижимости"
      className={className}
      draggable={false}
    />
  )
}
