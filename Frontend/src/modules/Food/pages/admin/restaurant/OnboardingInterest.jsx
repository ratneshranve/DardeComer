import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Phone } from "lucide-react"
import { adminAPI } from "@food/api"

const debugWarn = (...args) => {}

export default function OnboardingInterest() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getRestaurantOnboardingLeads({ limit: 200 })
      const body = response?.data
      const list = Array.isArray(body?.data)
        ? body.data
        : Array.isArray(body?.data?.leads)
          ? body.data.leads
          : []
      setLeads(list)
    } catch (err) {
      debugWarn("Failed to fetch onboarding interest leads:", err)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Restaurant Onboarding Interest</h1>
                <p className="text-sm text-slate-500">Phone numbers from new restaurant OTP requests (info only)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchLeads}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading onboarding interest...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg font-semibold text-slate-700">No Data Found</p>
              <p className="text-sm text-slate-500 mt-1">No onboarding interest numbers yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-600">SL</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-600">Phone</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-600">Requests</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-600">First Seen</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase text-slate-600">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead, idx) => (
                    <tr key={String(lead?._id || lead?.phone || idx)} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{lead?.phone || lead?.phoneLast10 || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{Number(lead?.requestCount || 0)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{lead?.firstRequestedAt ? new Date(lead.firstRequestedAt).toLocaleString("en-IN") : "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{lead?.lastRequestedAt ? new Date(lead.lastRequestedAt).toLocaleString("en-IN") : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

