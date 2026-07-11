import { useState } from 'react'
import { submitLead } from '../api/client'

export function LeadForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await submitLead({ name, phone, consent })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-green-50 p-6 text-green-800 ring-1 ring-green-200">
        Спасибо! Риелтор CHID свяжется с вами в ближайшее время.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-chid-white p-6 shadow-sm ring-1 ring-chid-ring/40">
      <h3 className="text-lg font-semibold text-chid-text">Хотите, чтобы риелтор CHID подобрал ипотеку?</h3>
      <p className="mt-1 text-sm text-chid-text/70">Оставьте контакты — мы перезвоним</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input
          className="rounded-lg border border-slate-200 px-4 py-3"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-slate-200 px-4 py-3"
          placeholder="Телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-chid-text/70">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
        Согласен на обработку персональных данных
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        className="mt-4 rounded-lg bg-chid-btn px-6 py-3 font-medium text-white hover:bg-chid-btn-hover"
      >
        Отправить заявку
      </button>
    </form>
  )
}
