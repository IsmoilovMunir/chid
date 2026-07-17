import { useEffect, useState } from 'react'
import {
  DEFAULT_BRAND_SETTINGS,
  loadBrandSettings,
  phoneToHref,
  saveBrandSettings,
  type BrandSettings,
} from '../../utils/brandSettings'

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadBrandSettings())
  }, [])

  const handleChange = (field: keyof BrandSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const next = {
      ...settings,
      phoneHref: phoneToHref(settings.phone),
      website: settings.website.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    }
    saveBrandSettings(next)
    setSettings(next)
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-chid-text">Настройки бренда</h2>
        <p className="mt-2 text-sm text-chid-text/60">
          Контакты используются в PDF-расчётах и публичных материалах CHID.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Название</label>
            <input
              className="input"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Слоган</label>
            <input
              className="input"
              value={settings.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Телефон</label>
            <input
              className="input"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+7 (495) 000-00-00"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              className="input"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Сайт</label>
            <input
              className="input"
              value={settings.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="chid.ru"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-xl bg-chid-btn px-6 py-3 text-sm font-medium text-white hover:bg-chid-btn-hover"
          >
            Сохранить настройки
          </button>
          {saved && <span className="text-sm text-green-700">Сохранено</span>}
        </div>
      </form>

      <section className="rounded-2xl bg-chid-accent-muted p-6 ring-1 ring-chid-ring/40">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-chid-text/50">
          Превью визитки
        </p>
        <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-2xl font-bold text-chid-btn">{settings.name}</p>
          <p className="mt-1 text-sm text-chid-text/60">{settings.tagline}</p>
          <div className="mt-5 space-y-1 text-sm text-chid-text">
            <p>{settings.phone}</p>
            <p>{settings.email}</p>
            <p>{settings.website}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
