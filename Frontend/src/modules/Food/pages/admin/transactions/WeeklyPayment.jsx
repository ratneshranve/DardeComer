import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export default function WeeklyPayment() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    isEnabled: false,
    dayOfWeek: 1,
    startTime: "10:00",
    endTime: "18:00",
    timezone: "Asia/Kolkata",
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getWithdrawalWindowSettings()
      const data = response?.data?.data || {}
      setForm({
        isEnabled: Boolean(data?.isEnabled),
        dayOfWeek: Number(data?.dayOfWeek ?? 1),
        startTime: String(data?.startTime || "10:00"),
        endTime: String(data?.endTime || "18:00"),
        timezone: String(data?.timezone || "Asia/Kolkata"),
      })
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load weekly payment settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await adminAPI.updateWithdrawalWindowSettings(form)
      toast.success("Weekly payment schedule updated")
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update schedule")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Weekly Payment Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">
          Restaurant and delivery withdrawal requests are allowed only during this weekly window.
        </p>

        <div className="mt-6 space-y-5">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input
              type="checkbox"
              checked={form.isEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, isEnabled: e.target.checked }))}
            />
            Enable weekly withdrawal window
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Day</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Timezone</label>
              <input
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Start Time</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">End Time</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full h-10 rounded-md border border-slate-300 px-3 text-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  )
}

