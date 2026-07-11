export type DeveloperImportMode = 'link' | 'paste'

export interface DeveloperSite {
  name: string
  hosts: string[]
  mode: DeveloperImportMode
  reason?: string
}

/**
 * Режимы импорта по застройщикам CHID.
 * link — «Заполнить из ссылки» обычно работает.
 * paste — сервер блокируется (Qrator/WAF), нужна вставка текста со страницы.
 */
export const DEVELOPER_SITES: DeveloperSite[] = [
  { name: 'ПИК', hosts: ['pik.ru'], mode: 'paste', reason: 'Qrator' },
  { name: 'ГК «Самолет»', hosts: ['samolet.ru'], mode: 'paste', reason: 'Qrator' },
  { name: 'ГК «А101»', hosts: ['a101.ru'], mode: 'link' },
  { name: '«Донстрой»', hosts: ['donstroy.moscow'], mode: 'link' },
  { name: 'MR Group', hosts: ['mr-group.ru'], mode: 'link' },
  { name: 'ГК ФСК', hosts: ['fsk.ru'], mode: 'link' },
  { name: 'Level Group', hosts: ['level.ru'], mode: 'link' },
  { name: 'Группа ЛСР', hosts: ['lsr.ru'], mode: 'paste', reason: 'WAF 403' },
  { name: 'ГК «Гранель»', hosts: ['granelle.ru'], mode: 'link' },
  { name: 'Sminex', hosts: ['sminex.com'], mode: 'link' },
  { name: 'Брусника', hosts: ['moscow.brusnika.ru', 'brusnika.ru'], mode: 'link' },
  { name: 'ГК «Эталон»', hosts: ['etalongroup.ru'], mode: 'link' },
  { name: '«Галс-Девелопмент»', hosts: ['gals-development.ru'], mode: 'link' },
  { name: 'Pioneer', hosts: ['pioneer.ru'], mode: 'link' },
  { name: '«Инград»', hosts: ['ingrad.ru'], mode: 'link' },
  { name: '«Главстрой»', hosts: ['glavstroy.ru'], mode: 'link' },
  { name: '«3-RED»', hosts: ['3-red.ru'], mode: 'link' },
  { name: '«Отрада»', hosts: ['otrada.ru'], mode: 'link' },
  { name: '«ПРОФИ-ИНВЕСТ»', hosts: ['profi-invest.ru'], mode: 'link' },
  { name: '«СЗ Концепт Иммо Девелопмент»', hosts: ['concept-immo.ru'], mode: 'link' },
  { name: '«ЖК Яркий.Рига»', hosts: ['yarkiy.ru'], mode: 'link' },
  { name: '«Вектор»', hosts: ['vector-development.ru'], mode: 'link' },
  { name: '«Тройка Рэд»', hosts: ['troika-red.ru'], mode: 'link' },
  { name: '«Дело»', hosts: ['delo-development.ru'], mode: 'link' },
  { name: '«Б2-Девелопмент»', hosts: ['b2-dev.ru'], mode: 'paste', reason: 'Qrator' },
  { name: '«Главстрой-Регионы»', hosts: ['glavstroy-regions.ru'], mode: 'paste', reason: 'Qrator' },
  { name: '«Страна Девелопмент»', hosts: ['strana-dev.ru', 'strana.com'], mode: 'paste', reason: 'Qrator' },
  { name: '«ТОЧНО»', hosts: ['tochno.ru'], mode: 'link' },
  { name: '«ССК»', hosts: ['ssk.ru'], mode: 'link' },
  { name: '«Зелёный сад»', hosts: ['zelenysad.ru'], mode: 'link' },
  { name: '1-й ДСК', hosts: ['dsk1.ru'], mode: 'link' },
  { name: 'ЦИАН', hosts: ['cian.ru'], mode: 'link' },
]

export function hostFromUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  try {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(normalized).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

export function findDeveloperByUrl(url: string): DeveloperSite | null {
  const host = hostFromUrl(url)
  if (!host) return null
  return DEVELOPER_SITES.find((site) => site.hosts.some((h) => host === h || host.endsWith(`.${h}`))) ?? null
}

export function needsPasteImport(url: string): boolean {
  return findDeveloperByUrl(url)?.mode === 'paste'
}

export const PASTE_ONLY_HOSTS = DEVELOPER_SITES.filter((s) => s.mode === 'paste').flatMap((s) => s.hosts)

export const LINK_DEVELOPER_NAMES = DEVELOPER_SITES.filter((s) => s.mode === 'link').map((s) => s.name)
