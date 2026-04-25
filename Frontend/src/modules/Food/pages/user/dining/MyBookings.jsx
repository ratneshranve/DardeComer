import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Calendar, Clock, Users, MapPin, ChevronRight, Utensils, Info } from "lucide-react"
import { diningAPI } from "@food/api"
import Loader from "@food/components/Loader"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Badge } from "@food/components/ui/badge"
import { Star, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@food/components/ui/button"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


function ReviewModal({ booking, onClose, onSubmit }) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!comment.trim()) {
            toast.error("Please add a comment")
            return
        }
        setSubmitting(true)
        await onSubmit({ bookingId: booking._id, rating, comment })
        setSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Review your experience</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-slate-500 mb-3">How was your visit to {booking.restaurant?.name}?</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className="p-1 transition-transform active:scale-90"
                                >
                                    <Star
                                        className={`w-10 h-10 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Share your feedback</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Write about the food, service, and atmosphere..."
                            className="w-full h-32 p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#001A94] transition-all text-sm resize-none"
                        />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full bg-[#001A94] hover:bg-[#00147A] text-white font-bold h-12 rounded-2xl shadow-lg shadow-[#001A94]/20"
                    >
                        {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default function MyBookings() {
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedBooking, setSelectedBooking] = useState(null)

    const getStatusLabel = (status) => {
        const key = String(status || "").toLowerCase()
        if (key === "pending") return "Pending"
        if (key === "confirmed" || key === "accepted") return "Accepted"
        if (key === "checked-in") return "Checked-in"
        if (key === "completed") return "Completed"
        if (key === "cancelled") return "Cancelled"
        return String(status || "unknown")
    }

    const getStatusBadgeClass = (status) => {
        const key = String(status || "").toLowerCase()
        if (key === "pending") return "bg-amber-100 text-amber-700"
        if (key === "confirmed" || key === "accepted") return "bg-green-100 text-green-700"
        if (key === "checked-in") return "bg-[#E6ECFF] text-[#001A94]"
        if (key === "completed") return "bg-[#E6ECFF] text-[#001A94]"
        if (key === "cancelled") return "bg-[#E6ECFF] text-[#001A94]"
        return "bg-slate-100 text-slate-700"
    }

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const response = await diningAPI.getBookings()
                if (response.data.success) {
                    setBookings(response.data.data)
                }
            } catch (error) {
                debugError("Error fetching bookings:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchBookings()
    }, [])

    const handleReviewSubmit = async (reviewData) => {
        try {
            const response = await diningAPI.createReview(reviewData)
            if (response.data.success) {
                toast.success("Review submitted! Thank you for your feedback.")
                // Update booking list to mark it as reviewed if we had a reviewed flag
                // For now just close the modal
                setSelectedBooking(null)
            }
        } catch (error) {
            debugError("Error submitting review:", error)
            toast.error(error.response?.data?.message || "Failed to submit review")
        }
    }

    if (loading) return <Loader />

    return (
        <AnimatedPage className="bg-slate-50 min-h-screen pb-10">
            {/* Header */}
            <div className="bg-white p-4 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate("/")}>
                    <ArrowLeft className="w-6 h-6 text-gray-700 cursor-pointer" />
                </button>
                <h1 className="ml-4 text-xl font-semibold text-gray-800">My Table Bookings</h1>
            </div>

            <div className="max-w-4xl mx-auto p-4 space-y-4">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-5 transition-all hover:shadow-md">
                            <div className="w-16 h-16 rounded-2xl flex-shrink-0 bg-[#F0F4FF] flex items-center justify-center border border-[#001A94]/10">
                                <Utensils className="w-8 h-8 text-[#001A94]" />
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-lg text-slate-900 truncate">
                                            {booking.restaurant?.name || "Your reservations"}
                                        </h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">
                                                {typeof booking.restaurant?.location === 'string'
                                                    ? booking.restaurant.location
                                                    : (booking.restaurant?.location?.formattedAddress || booking.restaurant?.location?.address || `${booking.restaurant?.location?.city || ''}${booking.restaurant?.location?.area ? ', ' + booking.restaurant.location.area : ''}`)}
                                            </span>
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusBadgeClass(booking.status)} ml-2 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full`}>
                                        {getStatusLabel(booking.status)}
                                    </Badge>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-700">
                                            {new Date(booking.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-700">{booking.timeSlot}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-700">{booking.guests} Guests</span>
                                    </div>
                                </div>

                                {booking.specialRequest && (
                                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 flex items-start gap-2">
                                        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-blue-700 font-medium leading-relaxed italic">
                                            "{booking.specialRequest}"
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                    {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'accepted') && (
                                        <>
                                            <button 
                                                onClick={() => navigate(`/food/user/dining/book/${booking.restaurant?.slug || ""}`)}
                                                className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Utensils className="w-4 h-4 text-[#001A94]" />
                                                    <span className="text-[11px] font-bold">Modification available</span>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                            <button 
                                                onClick={() => navigate("/food/user/profile/cancellation")}
                                                className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-slate-700">
                                                    <Info className="w-4 h-4 text-[#001A94]" />
                                                    <span className="text-[11px] font-bold">Cancellation available</span>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                        </>
                                    )}
                                    
                                    {booking.status === 'completed' && (
                                        <button
                                            onClick={() => setSelectedBooking(booking)}
                                            className="w-full py-3 bg-[#001A94] text-white text-xs font-black rounded-xl shadow-lg shadow-[#001A94]/20 hover:bg-[#00147A] transition-all uppercase tracking-widest"
                                        >
                                            Rate & Review your visit
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Utensils className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No bookings yet</h3>
                        <p className="text-gray-500 text-sm mt-2">Book your favorite restaurant for a great dining experience!</p>
                        <Link to="/dining">
                            <button className="mt-6 bg-[#001A94] text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-[#001A94]/20">
                                Book a table
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {selectedBooking && (
                <ReviewModal
                    booking={selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    onSubmit={handleReviewSubmit}
                />
            )}
        </AnimatedPage>
    )
}

