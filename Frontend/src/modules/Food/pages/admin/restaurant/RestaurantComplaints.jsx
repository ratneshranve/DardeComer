import { useState, useEffect } from "react"
import { adminAPI } from "@food/api"
import { toast } from "sonner"
import { AlertCircle, CheckCircle, Clock, XCircle, FileText, Edit, Building2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@food/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@food/components/ui/dialog"

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'rejected', label: 'Rejected', color: 'bg-rose-100 text-rose-700 border-rose-200' },
]

const COMPLAINT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'food_quality', label: 'Food Quality' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'missing_item', label: 'Missing Item' },
  { value: 'delivery_issue', label: 'Delivery Issue' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'service', label: 'Service' },
  { value: 'other', label: 'Other' },
]

const getStatusDetails = (status) => {
  return STATUS_OPTIONS.find(opt => opt.value === status) || { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

const getComplaintTypeLabel = (type) => {
  return COMPLAINT_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type
}

export default function RestaurantComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  })
  const [filters, setFilters] = useState({
    status: 'all',
    complaintType: 'all',
    search: '',
    page: 1,
    limit: 50
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  })
  const [editingComplaint, setEditingComplaint] = useState(null)
  const [updateData, setUpdateData] = useState({ status: '', adminResponse: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComplaints()
  }, [filters])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const params = {
        page: filters.page,
        limit: filters.limit,
      }
      if (filters.status !== 'all') params.status = filters.status
      if (filters.complaintType !== 'all') params.complaintType = filters.complaintType
      if (filters.search) params.search = filters.search

      const response = await adminAPI.getRestaurantComplaints(params)

      if (response?.data?.success) {
        const data = response.data.data
        setComplaints(data.complaints || [])
        setStats(data.stats || stats)
        setPagination({
          page: data.page || 1,
          limit: data.limit || 50,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / (data.limit || 50))
        })
      }
    } catch (error) {
      toast.error('Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (complaint) => {
    setEditingComplaint(complaint)
    setUpdateData({
      status: complaint.status,
      adminResponse: complaint.adminResponse || ''
    })
  }

  const handleUpdateComplaint = async () => {
    if (!editingComplaint) return
    try {
      setIsSubmitting(true)
      const response = await adminAPI.updateRestaurantComplaint(editingComplaint._id, updateData)
      if (response?.data?.success) {
        toast.success('Complaint updated successfully')
        setEditingComplaint(null)
        fetchComplaints()
      }
    } catch {
      toast.error('Failed to update complaint')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Restaurant Complaints</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 })}
          >
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.complaintType}
            onValueChange={(v) => setFilters({ ...filters, complaintType: v, page: 1 })}
          >
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Complaint Type" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              {COMPLAINT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search complaints..."
              className="pl-4 pr-10 py-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: stats.total, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'In Progress', value: stats.in_progress, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-100' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${item.bg}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600">{item.label}</p>
            <p className="text-2xl font-bold text-slate-900">{item.value || 0}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No complaints found matching your criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const statusInfo = getStatusDetails(complaint.status)
              return (
                <div key={complaint._id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                          {statusInfo.label.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                          {getComplaintTypeLabel(complaint.complaintType || complaint.issueType)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID: #{complaint._id?.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(complaint.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{complaint.subject}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {complaint.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Restaurant: {complaint.restaurantId?.restaurantName || complaint.restaurantId?._id || (typeof complaint.restaurantId === 'string' ? complaint.restaurantId : 'N/A')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Order ID: {complaint.orderId?.orderId || (typeof complaint.orderId === 'string' ? complaint.orderId : (complaint.orderId?._id || 'N/A'))}</span>
                        </div>
                      </div>

                      {complaint.adminResponse && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Response</p>
                          <p className="text-sm text-slate-700 italic bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                            "{complaint.adminResponse}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-end gap-2 shrink-0">
                      <button 
                        onClick={() => handleOpenModal(complaint)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 active:scale-95"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Update Status</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          
          <span className="text-sm font-bold text-slate-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page >= pagination.pages}
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      <Dialog open={!!editingComplaint} onOpenChange={(o) => !o && setEditingComplaint(null)}>
        <DialogContent className="max-w-xl bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
          <div className="bg-slate-900 p-6 text-white relative">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">Process Complaint</DialogTitle>
              <DialogDescription className="text-slate-400">
                Provide a professional response and update the status of this ticket.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Update Ticket Status
              </label>
              <Select
                value={updateData.status}
                onValueChange={(v) => setUpdateData({ ...updateData, status: v })}
              >
                <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all font-medium">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="bg-white rounded-xl border-slate-200 shadow-xl overflow-hidden">
                  {STATUS_OPTIONS.filter(o => o.value !== 'all').map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="py-3 cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          opt.value === 'resolved' ? 'bg-emerald-500' : 
                          opt.value === 'pending' ? 'bg-amber-500' : 
                          opt.value === 'rejected' ? 'bg-rose-500' : 
                          'bg-blue-500'
                        }`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Admin Response Message
              </label>
              <div className="relative">
                <textarea
                  placeholder="Explain the resolution or action taken..."
                  className="w-full h-40 p-4 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-all resize-none leading-relaxed"
                  value={updateData.adminResponse}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, adminResponse: e.target.value })
                  }
                />
                <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-medium">
                  {updateData.adminResponse.length} characters
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
            <button 
              onClick={() => setEditingComplaint(null)}
              className="px-6 py-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
            >
              Discard
            </button>
            <button 
              onClick={handleUpdateComplaint}
              disabled={isSubmitting || !updateData.status}
              className="px-8 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Update
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}