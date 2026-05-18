import { useEffect, useState } from "react"
import { adminAPI } from "@food/api"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function DeleteApprovals() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState("")

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getAccountDeletionRequests({ status: "pending", limit: 200 })
      const list = res?.data?.data || []
      setRequests(Array.isArray(list) ? list : [])
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch deletion requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleAction = async (id, status) => {
    try {
      setProcessingId(id)
      await adminAPI.updateAccountDeletionRequestStatus(id, { status })
      toast.success(`Request ${status} successfully`)
      await fetchRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || `Failed to ${status} request`)
    } finally {
      setProcessingId("")
    }
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white rounded-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Delete Approvals</h1>
        <p className="text-sm text-slate-500 mt-1">Review and approve account deletion requests.</p>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-slate-500">No pending deletion requests.</div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full min-w-[860px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Phone/Email</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Reason</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Requested At</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => {
                  const profile = r?.profile || {}
                  const name = profile?.name || profile?.restaurantName || "N/A"
                  const contact = profile?.phone || profile?.ownerPhone || profile?.email || profile?.ownerEmail || "N/A"
                  const id = String(r?._id || "")
                  const processing = processingId === id
                  return (
                    <tr key={id}>
                      <td className="px-3 py-3 text-sm font-medium text-slate-800">{r?.role || "N/A"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{name}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{contact}</td>
                      <td className="px-3 py-3 text-sm text-slate-700 max-w-[320px]">{r?.reason || "-"}</td>
                      <td className="px-3 py-3 text-sm text-slate-700">{r?.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "N/A"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleAction(id, "approved")}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={processing}
                            onClick={() => handleAction(id, "rejected")}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-600 text-white disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

