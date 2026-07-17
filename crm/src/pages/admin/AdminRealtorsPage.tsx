import { useEffect, useState } from 'react'
import {
  createRealtor,
  deleteRealtor,
  fetchRealtorClients,
  fetchRealtors,
  updateRealtor,
  updateRealtorAccess,
} from '../../api/client'
import type { Client, RealtorUser } from '../../types/crm'
import { formatDate } from '../../utils/format'

export function AdminRealtorsPage() {
  const [realtors, setRealtors] = useState<RealtorUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRealtor, setIsRealtor] = useState(true)
  const [isBroker, setIsBroker] = useState(false)
  const [closingRealtor, setClosingRealtor] = useState<RealtorUser | null>(null)
  const [editingRealtor, setEditingRealtor] = useState<RealtorUser | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editIsRealtor, setEditIsRealtor] = useState(true)
  const [editIsBroker, setEditIsBroker] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [reassignToId, setReassignToId] = useState<number | ''>('')
  const [accessSaving, setAccessSaving] = useState(false)
  const [deletingRealtor, setDeletingRealtor] = useState<RealtorUser | null>(null)
  const [deleteClients, setDeleteClients] = useState<Client[]>([])
  const [clientAssignments, setClientAssignments] = useState<Record<number, number>>({})
  const [assignAllToId, setAssignAllToId] = useState<number | ''>('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadRealtors = () => {
    setLoading(true)
    fetchRealtors()
      .then(setRealtors)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadRealtors()
  }, [])

  const activeRealtors = realtors.filter((r) => r.active && r.realtor)

  const leastBusyRealtorId = (excludeId: number): number | '' => {
    const candidates = activeRealtors.filter((r) => r.id !== excludeId)
    if (candidates.length === 0) return ''
    return candidates.reduce((best, current) =>
      current.clientsCount < best.clientsCount ? current : best,
    ).id
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isRealtor && !isBroker) {
      setError('Укажите хотя бы одну роль: риелтор или брокер')
      return
    }

    setSaving(true)

    try {
      await createRealtor({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        realtor: isRealtor,
        broker: isBroker,
      })
      setSuccess(`Сотрудник ${fullName.trim()} зарегистрирован. Передайте email и пароль для входа в CRM.`)
      setFullName('')
      setPhone('')
      setEmail('')
      setPassword('')
      setIsRealtor(true)
      setIsBroker(false)
      loadRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (realtor: RealtorUser) => {
    setEditingRealtor(realtor)
    setEditFullName(realtor.fullName)
    setEditPhone(realtor.phone ?? '')
    setEditEmail(realtor.email)
    setEditPassword('')
    setEditIsRealtor(realtor.realtor)
    setEditIsBroker(realtor.broker)
    setEditError('')
    setSuccess('')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRealtor) return

    if (!editIsRealtor && !editIsBroker) {
      setEditError('Укажите хотя бы одну роль: риелтор или брокер')
      return
    }

    setEditSaving(true)
    setEditError('')
    try {
      await updateRealtor(editingRealtor.id, {
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        password: editPassword.trim() || undefined,
        realtor: editIsRealtor,
        broker: editIsBroker,
      })
      setSuccess(`Данные сотрудника ${editFullName.trim()} обновлены`)
      setEditingRealtor(null)
      loadRealtors()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setEditSaving(false)
    }
  }

  const handleOpenAccess = async (realtor: RealtorUser) => {
    if (!window.confirm(`Открыть доступ для ${realtor.fullName}?`)) return

    setAccessSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateRealtorAccess(realtor.id, { active: true })
      setSuccess(`Доступ для ${realtor.fullName} открыт`)
      loadRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setAccessSaving(false)
    }
  }

  const handleCloseAccessClick = (realtor: RealtorUser) => {
    setClosingRealtor(realtor)
    setReassignToId(leastBusyRealtorId(realtor.id))
    setError('')
  }

  const handleOpenDelete = async (realtor: RealtorUser) => {
    setDeletingRealtor(realtor)
    setDeleteError('')
    setDeleteClients([])
    setClientAssignments({})
    setAssignAllToId('')
    setDeleteLoading(true)
    try {
      const clients = await fetchRealtorClients(realtor.id)
      setDeleteClients(clients)
      const defaultAssignee = leastBusyRealtorId(realtor.id)
      setAssignAllToId(defaultAssignee)
      if (defaultAssignee) {
        const next: Record<number, number> = {}
        for (const client of clients) {
          next[client.id] = defaultAssignee
        }
        setClientAssignments(next)
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Ошибка загрузки клиентов')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAssignAllClients = (assigneeId: number | '') => {
    setAssignAllToId(assigneeId)
    if (!assigneeId) return
    const next: Record<number, number> = {}
    for (const client of deleteClients) {
      next[client.id] = assigneeId
    }
    setClientAssignments(next)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingRealtor) return

    if (deleteClients.length > 0) {
      const missing = deleteClients.find((c) => !clientAssignments[c.id])
      if (missing) {
        setDeleteError(`Назначьте риелтора для клиента «${missing.fullName}»`)
        return
      }
      if (activeRealtors.filter((r) => r.id !== deletingRealtor.id).length === 0) {
        setDeleteError('Нет другого активного риелтора, которому можно передать клиентов')
        return
      }
    }

    setDeleteSaving(true)
    setDeleteError('')
    try {
      await deleteRealtor(
        deletingRealtor.id,
        deleteClients.map((client) => ({
          clientId: client.id,
          assignToUserId: clientAssignments[client.id],
        })),
      )
      setSuccess(`Сотрудник ${deletingRealtor.fullName} удалён`)
      setDeletingRealtor(null)
      loadRealtors()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Ошибка удаления')
    } finally {
      setDeleteSaving(false)
    }
  }

  const handleCloseAccessConfirm = async () => {
    if (!closingRealtor) return

    if (closingRealtor.clientsCount > 0 && !reassignToId) {
      setError('Выберите риелтора, которому передать клиентов')
      return
    }

    setAccessSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateRealtorAccess(closingRealtor.id, {
        active: false,
        reassignToUserId: reassignToId ? Number(reassignToId) : undefined,
      })
      setSuccess(
        closingRealtor.clientsCount > 0
          ? `Доступ для ${closingRealtor.fullName} закрыт, клиенты переданы другому риелтору`
          : `Доступ для ${closingRealtor.fullName} закрыт`,
      )
      setClosingRealtor(null)
      loadRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setAccessSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-chid-text">Сотрудники</h2>
        <p className="mt-2 text-sm text-chid-text/60">
          Администратор создаёт и редактирует аккаунты риелторов и брокеров. При увольнении закройте
          доступ и передайте клиентов другому сотруднику.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold text-chid-text">Новый сотрудник</h3>
          <p className="mt-1 text-sm text-chid-text/55">
            Можно назначить риелтором, брокером или обеими ролями сразу
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">ФИО</label>
          <input
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Исмоилов Мунир"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Телефон</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (900) 000-00-00"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Email для входа</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="realtor@chid.ru"
            required
            autoComplete="off"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Пароль для входа</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Минимум 6 символов"
            minLength={6}
            required
            autoComplete="new-password"
          />
          <p className="mt-1.5 text-xs text-chid-text/45">
            Передайте сотруднику email и пароль — он сможет войти в CRM со своего аккаунта.
          </p>
        </div>

        <div className="md:col-span-2">
          <p className="mb-2 text-sm font-medium">Роли</p>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-chid-text">
              <input
                type="checkbox"
                checked={isRealtor}
                onChange={(e) => setIsRealtor(e.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              Риелтор (клиенты и сделки)
            </label>
            <label className="flex items-center gap-2 text-sm text-chid-text">
              <input
                type="checkbox"
                checked={isBroker}
                onChange={(e) => setIsBroker(e.target.checked)}
                className="size-4 rounded border-slate-300"
              />
              Брокер (можно назначить на сделку)
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-chid-btn px-6 py-3 text-sm font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
          >
            {saving ? 'Регистрация…' : 'Зарегистрировать'}
          </button>
          {success && !closingRealtor && !editingRealtor && (
            <span className="text-sm text-green-700">{success}</span>
          )}
          {error && !closingRealtor && !editingRealtor && (
            <span className="text-sm text-red-600">{error}</span>
          )}
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-chid-text">Зарегистрированные сотрудники</h3>
        </div>

        {loading ? (
          <p className="p-8 text-center text-chid-text/60">Загрузка…</p>
        ) : realtors.length === 0 ? (
          <p className="p-8 text-center text-chid-text/60">Пока нет зарегистрированных сотрудников</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-chid-accent-muted/50 text-left text-chid-text/60">
                <tr>
                  <th className="px-6 py-3 font-medium">ФИО</th>
                  <th className="px-6 py-3 font-medium">Телефон</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Роли</th>
                  <th className="px-6 py-3 font-medium">Клиенты</th>
                  <th className="px-6 py-3 font-medium">Статус</th>
                  <th className="px-6 py-3 font-medium">Добавлен</th>
                  <th className="px-6 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {realtors.map((realtor) => (
                  <tr key={realtor.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-medium text-chid-text">{realtor.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{realtor.phone || '—'}</td>
                    <td className="px-6 py-4">{realtor.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {realtor.realtor && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Риелтор
                          </span>
                        )}
                        {realtor.broker && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Брокер
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{realtor.clientsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {realtor.active ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                          Активен
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Доступ закрыт
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-chid-text/60">
                      {formatDate(realtor.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(realtor)}
                          className="text-sm text-chid-btn hover:underline"
                        >
                          Редактировать
                        </button>
                        {realtor.active ? (
                          <button
                            type="button"
                            onClick={() => handleCloseAccessClick(realtor)}
                            disabled={accessSaving}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            Закрыть доступ
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAccess(realtor)}
                            disabled={accessSaving}
                            className="text-sm text-chid-btn hover:underline disabled:opacity-50"
                          >
                            Открыть доступ
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(realtor)}
                          className="text-sm text-red-700 hover:underline"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingRealtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-chid-text">Редактировать сотрудника</h3>
            <p className="mt-1 text-sm text-chid-text/60">{editingRealtor.email}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">ФИО</label>
                <input
                  className="input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Телефон</label>
                <input
                  className="input"
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Email</label>
                <input
                  className="input"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Новый пароль</label>
                <input
                  className="input"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Оставьте пустым, чтобы не менять"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium">Роли</p>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 text-sm text-chid-text">
                    <input
                      type="checkbox"
                      checked={editIsRealtor}
                      onChange={(e) => setEditIsRealtor(e.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    Риелтор
                  </label>
                  <label className="flex items-center gap-2 text-sm text-chid-text">
                    <input
                      type="checkbox"
                      checked={editIsBroker}
                      onChange={(e) => setEditIsBroker(e.target.checked)}
                      className="size-4 rounded border-slate-300"
                    />
                    Брокер
                  </label>
                </div>
              </div>
            </div>

            {editError && <p className="mt-4 text-sm text-red-600">{editError}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingRealtor(null)}
                className="rounded-lg px-4 py-2 text-sm text-chid-text/70 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="rounded-lg bg-chid-btn px-4 py-2 text-sm font-medium text-white hover:bg-chid-btn-hover disabled:opacity-50"
              >
                {editSaving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {closingRealtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-chid-text">Закрыть доступ</h3>
            <p className="mt-2 text-sm text-chid-text/70">
              {closingRealtor.clientsCount > 0
                ? `У ${closingRealtor.fullName} ${closingRealtor.clientsCount} клиент(ов). Передайте их другому риелтору — клиенты останутся в компании, история расчётов сохранится.`
                : `Закрыть доступ для ${closingRealtor.fullName}? Сотрудник не сможет войти в CRM, пока вы не откроете доступ снова.`}
            </p>

            {closingRealtor.clientsCount > 0 && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">Передать клиентов</label>
                <select
                  className="input-select w-full"
                  value={reassignToId}
                  onChange={(e) =>
                    setReassignToId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">Выберите риелтора</option>
                  {activeRealtors
                    .filter((r) => r.id !== closingRealtor.id)
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName} · {r.clientsCount} кл.
                        {r.phone ? ` · ${r.phone}` : ''}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setClosingRealtor(null)
                  setError('')
                }}
                className="rounded-lg px-4 py-2 text-sm text-chid-text/70 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCloseAccessConfirm}
                disabled={accessSaving}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {accessSaving ? 'Сохранение…' : 'Закрыть доступ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingRealtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-chid-text">Удалить сотрудника</h3>
              <p className="mt-1 text-sm text-chid-text/70">
                {deletingRealtor.fullName} будет удалён навсегда. Клиенты останутся в компании —
                назначьте каждому нового риелтора.
              </p>
            </div>

            <div className="overflow-y-auto px-6 py-4">
              {deleteLoading ? (
                <p className="text-sm text-chid-text/60">Загрузка клиентов…</p>
              ) : deleteClients.length === 0 ? (
                <p className="text-sm text-chid-text/60">
                  У сотрудника нет клиентов. Можно удалить сразу.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Назначить всех одному риелтору
                    </label>
                    <select
                      className="input-select w-full"
                      value={assignAllToId}
                      onChange={(e) =>
                        handleAssignAllClients(e.target.value ? Number(e.target.value) : '')
                      }
                    >
                      <option value="">Выберите риелтора</option>
                      {activeRealtors
                        .filter((r) => r.id !== deletingRealtor.id)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.fullName} · {r.clientsCount} кл.
                            {r.phone ? ` · ${r.phone}` : ''}
                          </option>
                        ))}
                    </select>
                    <p className="mt-1.5 text-xs text-chid-text/45">
                      По умолчанию выбран риелтор с наименьшим числом клиентов
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-chid-accent-muted/50 text-left text-chid-text/60">
                        <tr>
                          <th className="px-4 py-3 font-medium">Клиент</th>
                          <th className="px-4 py-3 font-medium">Телефон</th>
                          <th className="px-4 py-3 font-medium">Назначить</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deleteClients.map((client) => (
                          <tr key={client.id} className="border-t border-slate-100">
                            <td className="px-4 py-3 font-medium text-chid-text">
                              {client.fullName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">{client.phone}</td>
                            <td className="px-4 py-3">
                              <select
                                className="input-select w-full min-w-44"
                                value={clientAssignments[client.id] ?? ''}
                                onChange={(e) =>
                                  setClientAssignments((prev) => ({
                                    ...prev,
                                    [client.id]: Number(e.target.value),
                                  }))
                                }
                              >
                                <option value="">Выберите</option>
                                {activeRealtors
                                  .filter((r) => r.id !== deletingRealtor.id)
                                  .map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.fullName} · {r.clientsCount} кл.
                                    </option>
                                  ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDeletingRealtor(null)}
                className="rounded-lg px-4 py-2 text-sm text-chid-text/70 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteSaving || deleteLoading}
                className="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                {deleteSaving ? 'Удаление…' : 'Удалить навсегда'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
