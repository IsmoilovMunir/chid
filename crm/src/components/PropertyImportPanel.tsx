import { useEffect, useState } from 'react'
import { fetchPropertyImport } from '../utils/propertyImport'

import {
  findDeveloperByUrl,
  LINK_DEVELOPER_NAMES,
  needsPasteImport,
} from '../constants/developers'

function normalizeOpenUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export interface PropertyImportData {
  title?: string
  propertyPrice?: number
  propertyUrl?: string
  address?: string
}

interface PropertyImportPanelProps {
  propertyUrl: string
  onPropertyUrlChange: (value: string) => void
  onImported: (data: PropertyImportData) => void
}

export function PropertyImportPanel({
  propertyUrl,
  onPropertyUrlChange,
  onImported,
}: PropertyImportPanelProps) {
  const [pasteText, setPasteText] = useState('')
  const [showPaste, setShowPaste] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const pasteOnly = needsPasteImport(propertyUrl)
  const developer = findDeveloperByUrl(propertyUrl)

  useEffect(() => {
    if (pasteOnly) {
      setShowPaste(true)
    }
  }, [pasteOnly])

  const runImport = async (text?: string) => {
    const pasted = text ?? pasteText

    if (!propertyUrl.trim() && !pasted.trim()) {
      setMessage('Вставьте ссылку на объявление или текст со страницы')
      setIsError(true)
      return
    }

    setLoading(true)
    setMessage('')
    setIsError(false)

    try {
      const result = await fetchPropertyImport(
        propertyUrl,
        pasted.trim() ? pasted : undefined
      )

      if (result.blocked && !result.propertyPrice && !result.title) {
        setShowPaste(true)
        setMessage(
          result.message ||
            'Автозагрузка недоступна — скопируйте название и цену со страницы и нажмите «Распознать»'
        )
        setIsError(false)
        return
      }

      if (!result.propertyPrice && !result.title) {
        setShowPaste(true)
        setMessage(result.message || 'Не удалось распознать данные — попробуйте скопировать блок с ценой')
        setIsError(true)
        return
      }

      onImported({
        title: result.title ?? undefined,
        propertyPrice: result.propertyPrice ?? undefined,
        propertyUrl: propertyUrl.trim() || undefined,
        address: result.address ?? undefined,
      })

      const parts: string[] = []
      if (result.title) parts.push('квартира')
      if (result.propertyPrice) parts.push('цена')
      setMessage(
        result.message ||
          `Заполнено: ${parts.join(' и ') || 'данные'}${
            result.source ? ` (${result.source})` : ''
          }`
      )
      setIsError(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Ошибка загрузки')
      setIsError(true)
      setShowPaste(true)
    } finally {
      setLoading(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setMessage('Буфер обмена пустой — сначала скопируйте текст со страницы квартиры')
        setIsError(true)
        return
      }
      setPasteText(text)
      setShowPaste(true)
      await runImport(text)
    } catch {
      setMessage('Не удалось прочитать буфер — вставьте текст вручную (Ctrl+V / Cmd+V)')
      setIsError(true)
      setShowPaste(true)
    }
  }

  const openUrl = normalizeOpenUrl(propertyUrl)

  return (
    <div className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
      <h3 className="text-lg font-semibold text-chid-text">Ссылка на объявление</h3>
      <p className="mt-1 text-sm text-chid-text/60">
        По ссылке заполняются {LINK_DEVELOPER_NAMES.slice(0, 6).join(', ')} и другие. Ручная
        вставка нужна только для застройщиков с Qrator/WAF (Самолёт, ПИК, ЛСР и др.).
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="input min-w-0 flex-1"
          type="url"
          value={propertyUrl}
          onChange={(e) => onPropertyUrlChange(e.target.value)}
          placeholder="https://samolet.ru/... или cian.ru/... или dsk1.ru/..."
        />
        {!pasteOnly && (
          <button
            type="button"
            onClick={() => runImport()}
            disabled={loading}
            className="shrink-0 rounded-lg bg-chid-btn px-5 py-3 font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
          >
            {loading ? 'Загрузка…' : 'Заполнить из ссылки'}
          </button>
        )}
      </div>

      {pasteOnly && (
        <div className="mt-4 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <p className="text-sm font-medium text-amber-900">
            {developer?.name ?? 'Этот застройщик'} не отдаёт данные серверу
            {developer?.reason ? ` (${developer.reason})` : ''} — скопируйте текст со страницы
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-800">
            <li>Откройте квартиру на сайте застройщика</li>
            <li>Выделите название и цену, скопируйте (Ctrl+C / Cmd+C)</li>
            <li>Вернитесь сюда и нажмите «Вставить из буфера»</li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            {openUrl && (
              <a
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-chid-text ring-1 ring-amber-300 hover:bg-amber-100"
              >
                Открыть квартиру ↗
              </a>
            )}
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              disabled={loading}
              className="rounded-lg bg-chid-btn px-4 py-2 text-sm font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
            >
              {loading ? 'Распознаём…' : 'Вставить из буфера'}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowPaste((v) => !v)}
        className="mt-3 text-sm text-chid-btn hover:underline"
      >
        {showPaste ? 'Скрыть поле текста' : 'Вставить текст вручную'}
      </button>

      {showPaste && (
        <div className="mt-3">
          <label className="mb-2 block text-sm font-medium text-chid-text">
            Текст со страницы объявления
          </label>
          <textarea
            className="input min-h-24 resize-y"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={'2-комнатная квартира\n12 450 000 ₽'}
          />
          <button
            type="button"
            onClick={() => runImport()}
            disabled={loading}
            className="mt-2 rounded-lg bg-chid-accent-muted px-4 py-2 text-sm font-medium text-chid-text ring-1 ring-chid-ring/50 hover:bg-chid-white disabled:opacity-50"
          >
            Распознать из текста
          </button>
        </div>
      )}

      {message && (
        <p className={`mt-3 text-sm ${isError ? 'text-amber-700' : 'text-green-700'}`}>{message}</p>
      )}
    </div>
  )
}
