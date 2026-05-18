import React, { useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { deliveryAPI } from '@food/api';
import { toast } from 'sonner';
import useDeliveryBackNavigation from '../../hooks/useDeliveryBackNavigation';

/**
 * CreateSupportTicketV2 - Restored Old UI for Ticket Creation.
 */
export const CreateSupportTicketV2 = () => {
  const goBack = useDeliveryBackNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "other",
    priority: "medium"
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteRequestStatus, setDeleteRequestStatus] = useState(null);

  React.useEffect(() => {
    deliveryAPI
      .getDeleteAccountRequestStatus()
      .then((res) => setDeleteRequestStatus(res?.data?.data?.request || null))
      .catch(() => setDeleteRequestStatus(null));
  }, []);

  const handleSubmit = async () => {
    if (form.subject.length < 3) return toast.error("Subject too short");
    if (form.description.length < 10) return toast.error("Description too short");

    setLoading(true);
    try {
      const response = await deliveryAPI.createSupportTicket(form);
      if (response?.data?.success) {
        toast.success("Ticket raised successfully");
        goBack();
      }
    } catch (e) {
      toast.error("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    const reason = deleteReason.trim();
    if (!reason) return toast.error("Reason is required");
    setDeleteSubmitting(true);
    try {
      const res = await deliveryAPI.requestDeleteAccount(reason);
      setDeleteRequestStatus(res?.data?.data?.request || null);
      setDeleteReason("");
      toast.success("Delete request submitted. Admin approval pending.");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit delete request");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-poppins">
      {/* Header */}
      <div className="bg-white px-4 py-5 flex items-center gap-4 fixed top-0 w-full z-50 shadow-sm border-b border-gray-50">
        <button onClick={goBack} className="p-1 hover:bg-gray-50 rounded-full">
           <ArrowLeft className="w-6 h-6 text-gray-950" />
        </button>
        <h1 className="text-xl font-black text-gray-950 uppercase tracking-tight">Raise Ticket</h1>
      </div>

      <div className="pt-24 px-4 pb-10 space-y-8">
         <div className="space-y-6">
            {/* Subject */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Issue Topic</label>
               <input 
                 type="text"
                 placeholder="Main subject of your concern"
                 value={form.subject}
                 onChange={(e) => setForm({...form, subject: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-950 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none"
               />
            </div>

            {/* Description */}
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detail Description</label>
               <textarea 
                 rows={6}
                 placeholder="Explain your issue here..."
                 value={form.description}
                 onChange={(e) => setForm({...form, description: e.target.value})}
                 className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-950 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none resize-none"
               />
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-black text-gray-800 uppercase tracking-widest outline-none"
                  >
                     <option value="payment">Payment</option>
                     <option value="order">Order</option>
                     <option value="account">Account</option>
                     <option value="technical">Tech Issue</option>
                     <option value="other">Other</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Priority</label>
                  <select 
                    value={form.priority}
                    onChange={(e) => setForm({...form, priority: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-black text-gray-800 uppercase tracking-widest outline-none"
                  >
                     <option value="low">Low</option>
                     <option value="medium">Medium</option>
                     <option value="high">High</option>
                     <option value="urgent">Urgent</option>
                  </select>
               </div>
            </div>
         </div>

         <button 
           onClick={handleSubmit}
           disabled={loading}
           className="w-full bg-primary text-white p-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
         >
           {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
           Submit Ticket
         </button>

         <div className="border border-red-200 bg-red-50/30 rounded-2xl p-4 space-y-3">
            <h2 className="text-sm font-black text-red-700 uppercase tracking-widest">Delete Account Request</h2>
            {deleteRequestStatus && (
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="text-xs font-black uppercase tracking-wider text-gray-700">Status: {deleteRequestStatus.status || "pending"}</p>
                <p className="text-xs text-gray-600 mt-1">Reason: {deleteRequestStatus.reason}</p>
              </div>
            )}
            <textarea
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Delete reason (mandatory)"
              className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium text-gray-900 focus:ring-4 focus:ring-red-500/10 transition-all outline-none resize-none"
              maxLength={500}
            />
            <button
              onClick={handleDeleteRequest}
              disabled={deleteSubmitting}
              className="w-full bg-red-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {deleteSubmitting ? "Submitting..." : "Submit Delete Request"}
            </button>
         </div>
      </div>
    </div>
  );
};
