import { useEffect, useState } from 'react'
import { fetchClients, saveCalculation, updateCalculation } from '../api/client'
import type { MortgageRequest } from '../types/mortgage'
import { discountToApi, type DiscountUnit } from '../utils/discount'

interface SaveCalculationPanelProps {
  request: MortgageRequest
  calculationId?: number
  defaultClientId?: number
  title: string
  onTitleChange: (value: string) => void
  propertyUrl: string
  onPropertyUrlChange: (value: string) => void
  defaultComment?: string
  baseLoanAmount?: number
  discountValue?: string
  discountType?: DiscountUnit
  onSaved: (id: number) => void
}

function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function SaveCalculationPanel({
  request,
  calculationId,
  defaultClientId,
  title,
  onTitleChange,
  propertyUrl,
  onPropertyUrlChange,
  defaultComment = '',
  baseLoanAmount = 0,
  discountValue = '',
  discountType = 'AMOUNT',
  onSaved,
}: SaveCalculationPanelProps) {
  const [clients, setClients] = useState<{ id: number; fullName: string }[]>([])
  const [clientId, setClientId] = useState(defaultClientId ? String(defaultClientId) : '')
  const [comment, setComment] = useState(defaultComment)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const isEdit = calculationId != null

  useEffect(() => {
    fetchClients()
      .then((data) => setClients(data.map((c) => ({ id: c.id, fullName: c.fullName }))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (defaultClientId) setClientId(String(defaultClientId))
  }, [defaultClientId])

  useEffect(() => {
    setComment(defaultComment)
  }, [defaultComment])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const apiDiscount = discountToApi(discountValue, discountType)
    const normalizedUrl = normalizeUrl(propertyUrl)

    const payload = {
      calculation: request,
      clientId: clientId ? Number(clientId) : undefined,
      title: title.trim() || undefined,
      propertyUrl: normalizedUrl || undefined,
      comment: comment.trim() || undefined,
      baseLoanAmount: baseLoanAmount > 0 ? baseLoanAmount : undefined,
      discountAmount: apiDiscount.discountAmount,
      discountPercent: apiDiscount.discountPercent,
    }

    try {
      const saved = isEdit
        ? await updateCalculation(calculationId, payload)
        : await saveCalculation(payload)
      setSuccess(true)
      onSaved(saved.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-green-800 ring-1 ring-green-200">
        {isEdit ? 'Расчёт обновлён' : 'Расчёт сохранён в CRM'}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
      <h3 className="text-lg font-semibold text-chid-text">
        {isEdit ? 'Сохранить изменения' : 'Сохранить в CRM'}
      </h3>
      <p className="mt-1 text-sm text-chid-text/60">
        Укажите клиента, квартиру и ссылку на карточку в ЖК — данные сохранятся для агента и
        отобразятся на публичной ссылке
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Клиент</label>
          <select
            className="input-select"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Без клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Квартира</label>
          <input
            className="input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="2-комн., ЖК Солнечный, ул. Ленина 10"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Ссылка на квартиру</label>
        <input
          className="input"
          type="url"
          value={propertyUrl}
          onChange={(e) => onPropertyUrlChange(e.target.value)}
          placeholder="https://zhk.example.ru/flats/123"
        />
        <p className="mt-1.5 text-xs text-chid-text/45">
          Сохраняется в CRM и отображается на публичной ссылке для клиента
        </p>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium">Комментарий</label>
        <textarea
          className="input min-h-24 resize-y"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Заметки для риелтора"
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 rounded-lg bg-chid-btn px-6 py-3 font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
      >
        {saving ? 'Сохранение…' : isEdit ? 'Сохранить изменения' : 'Сохранить расчёт'}
      </button>
    </div>
  )
}
