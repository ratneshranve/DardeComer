import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Building2, ChevronRight, Clock3, MapPin, Plus, Store, TriangleAlert } from "lucide-react"
import { restaurantAPI } from "@food/api"
import { setAuthData, setRestaurantPendingPhone } from "@food/utils/auth"
import { checkOnboardingStatus, isRestaurantOnboardingComplete } from "@food/utils/onboardingUtils"

const OUTLET_SELECTION_KEY = "restaurantOutletSelectionData"
const OUTLET_PREFILL_KEY = "restaurantOutletPrefill"

const normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "").slice(-15)

const formatOutletAddress = (outlet) => {
  const parts = [
    outlet?.addressLine1,
    outlet?.addressLine2,
    outlet?.area,
    outlet?.city,
    outlet?.landmark,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)

  return parts.join(", ") || "Address will appear after onboarding"
}

export default function SelectOutlet() {
  const navigate = useNavigate()
  const [submittingId, setSubmittingId] = useState("")
  const [error, setError] = useState("")

  const selectionData = useMemo(() => {
    try {
      const stored = sessionStorage.getItem(OUTLET_SELECTION_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [])

  const outlets = Array.isArray(selectionData?.outlets) ? selectionData.outlets : []

  useEffect(() => {
    if (!selectionData?.selectionToken) {
      navigate("/food/restaurant/login", { replace: true })
    }
  }, [navigate, selectionData?.selectionToken])

  if (!selectionData?.selectionToken) {
    return null
  }

  const handleOpenOutlet = async (outlet) => {
    if (!outlet?._id || submittingId) return
    setSubmittingId(String(outlet._id))
    setError("")

    try {
      const response = await restaurantAPI.selectOutlet(selectionData.selectionToken, outlet._id)
      const data = response?.data?.data || response?.data
      const accessToken = data?.accessToken
      const refreshToken = data?.refreshToken ?? null
      const restaurant = data?.user ?? data?.restaurant

      if (!accessToken || !restaurant) {
        throw new Error("Unable to start outlet session. Please try again.")
      }

      setAuthData("restaurant", accessToken, restaurant, refreshToken)
      window.dispatchEvent(new Event("restaurantAuthChanged"))
      sessionStorage.removeItem(OUTLET_SELECTION_KEY)

      const onboardingComplete = isRestaurantOnboardingComplete(restaurant)
      if (!onboardingComplete) {
        const incompleteStep = await checkOnboardingStatus()
        if (incompleteStep) {
          navigate(`/food/restaurant/onboarding?step=${incompleteStep}`, { replace: true })
          return
        }
      }

      navigate("/food/restaurant", { replace: true })
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to open outlet. Please try again."
      setError(message)
    } finally {
      setSubmittingId("")
    }
  }

  const handleAddNewOutlet = () => {
    const firstOutlet = outlets[0] || {}
    const phone = selectionData?.phone || firstOutlet?.ownerPhone || ""

    setRestaurantPendingPhone(phone)
    sessionStorage.setItem(
      OUTLET_PREFILL_KEY,
      JSON.stringify({
        ownerName: firstOutlet?.ownerName || "",
        ownerEmail: firstOutlet?.ownerEmail || "",
        ownerPhone: normalizePhoneDigits(phone || firstOutlet?.ownerPhone || ""),
      }),
    )
    navigate("/food/restaurant/onboarding?mode=new", { replace: true })
  }

  const hasOutlets = outlets.length > 0

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-[28px] bg-gradient-to-br from-[#0f172a] via-[#102a73] to-[#1d4ed8] p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-blue-200">Restaurant Access</p>
          <h1 className="text-3xl font-black tracking-tight">Select outlet</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Choose the outlet you want to manage on this device. Orders and notifications will come only for the selected outlet.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          {hasOutlets ? outlets.map((outlet) => {
            const status = String(outlet?.status || "pending").toLowerCase()
            const isApproved = status === "approved"
            const isPending = status === "pending"
            const isRejected = status === "rejected"

            return (
              <div
                key={String(outlet?._id)}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Store className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-950">{outlet?.restaurantName || "Unnamed outlet"}</h2>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-2">{formatOutletAddress(outlet)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                      <span className={`rounded-full px-3 py-1 ${isApproved ? "bg-emerald-100 text-emerald-700" : isPending ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {status}
                      </span>
                      {outlet?.city ? <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{outlet.city}</span> : null}
                    </div>

                    {isRejected && outlet?.rejectionReason ? (
                      <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {outlet.rejectionReason}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:w-[220px]">
                    {isApproved ? (
                      <button
                        type="button"
                        onClick={() => handleOpenOutlet(outlet)}
                        disabled={submittingId === String(outlet?._id)}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {submittingId === String(outlet?._id) ? "Opening..." : "Open outlet"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : isPending ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        <div className="flex items-center gap-2 font-semibold">
                          <Clock3 className="h-4 w-4" />
                          Pending approval
                        </div>
                        <p className="mt-1 text-xs text-amber-700/80">This outlet will appear for login after admin approval.</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <div className="flex items-center gap-2 font-semibold">
                          <TriangleAlert className="h-4 w-4" />
                          Rejected outlet
                        </div>
                        <p className="mt-1 text-xs text-rose-700/80">Create another outlet or update this one later from support/admin flow.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          }) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">
              No outlets found for this phone number yet.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddNewOutlet}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 shadow-[0_14px_35px_rgba(15,23,42,0.05)] transition hover:border-blue-200 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add new outlet
        </button>

        <button
          type="button"
          onClick={() => navigate("/food/restaurant/login", { replace: true })}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-[22px] px-5 py-4 text-sm font-medium text-slate-500 transition hover:text-slate-800"
        >
          <Building2 className="h-4 w-4" />
          Use another phone number
        </button>
      </div>
    </div>
  )
}

