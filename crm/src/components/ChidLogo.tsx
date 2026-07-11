import logoUrl from '../assets/logochid.svg'

interface ChidLogoProps {
  className?: string
}

export function ChidLogo({ className = 'h-10 w-auto' }: ChidLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="CHID"
      className={className}
      draggable={false}
    />
  )
}
