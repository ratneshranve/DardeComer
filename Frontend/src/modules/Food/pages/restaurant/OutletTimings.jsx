import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Lenis from "lenis"
import { ArrowLeft, ChevronUp, ChevronDown, Clock, Plus, Trash2 } from "lucide-react"
import { Switch } from "@food/components/ui/switch"
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns"
import { useCompanyName } from "@food/hooks/useCompanyName"
import { restaurantAPI } from "@food/api"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const createSlot = (openingTime = "09:00", closingTime = "22:00") => ({
  id: `${Date.now()}-${Math.random()}`,
  openingTime,
  closingTime,
})

const stringToTime = (timeString, fallback = "09:00") => {
  const raw = timeString && timeString.includes(":") ? timeString : fallback
  const [hours, minutes] = String(raw).split(":").map(Number)
  const validHours = Math.max(0, Math.min(23, hours || 9))
  const validMinutes = Math.max(0, Math.min(59, minutes || 0))
  return new Date(2000, 0, 1, validHours, validMinutes)
}

const timeToString = (date, fallback = "09:00") => {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return fallback
  }
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

const formatTime12Hour = (time24) => {
  if (!time24) return ""
  const [hours, minutes] = time24.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const hours12 = hours % 12 || 12
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`
}

const normalizeSlots = (slots = [], fallbackOpening = "09:00", fallbackClosing = "22:00") => {
  const nextSlots = (Array.isArray(slots) ? slots : [])
    .map((slot) => ({
      id: slot?.id || `${Date.now()}-${Math.random()}`,
      openingTime: slot?.openingTime || fallbackOpening,
      closingTime: slot?.closingTime || fallbackClosing,
    }))
    .filter((slot) => slot.openingTime && slot.closingTime)

  return nextSlots.length > 0 ? nextSlots : [createSlot(fallbackOpening, fallbackClosing)]
}

const ensureDayShape = (dayData = {}) => {
  const isOpen = dayData?.isOpen !== false
  const fallbackOpening = dayData?.openingTime || "09:00"
  const fallbackClosing = dayData?.closingTime || "22:00"
  const slots = isOpen ? normalizeSlots(dayData?.slots, fallbackOpening, fallbackClosing) : []

  return {
    isOpen,
    openingTime: isOpen ? (slots[0]?.openingTime || fallbackOpening) : "",
    closingTime: isOpen ? (slots[0]?.closingTime || fallbackClosing) : "",
    slots,
  }
}

const getDefaultDays = () =>
  Object.fromEntries(
    DAY_NAMES.map((day) => [day, ensureDayShape()]),
  )

const toApiPayload = (days) =>
  Object.fromEntries(
    DAY_NAMES.map((day) => {
      const dayData = ensureDayShape(days?.[day] || {})
      return [day, {
        isOpen: dayData.isOpen,
        openingTime: dayData.isOpen ? (dayData.slots[0]?.openingTime || "") : "",
        closingTime: dayData.isOpen ? (dayData.slots[0]?.closingTime || "") : "",
        slots: dayData.isOpen
          ? dayData.slots.map((slot) => ({
              openingTime: slot.openingTime,
              closingTime: slot.closingTime,
            }))
          : [],
      }]
    }),
  )

export default function OutletTimings() {
  const companyName = useCompanyName()
  const navigate = useNavigate()
  const [expandedDay, setExpandedDay] = useState("Monday")
  const [days, setDays] = useState(getDefaultDays)
  const [loading, setLoading] = useState(true)
  const saveTimerRef = useRef(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await restaurantAPI.getOutletTimings()
        const outletTimings = res?.data?.data?.outletTimings || res?.data?.outletTimings
        if (mounted && outletTimings && typeof outletTimings === "object") {
          const merged = { ...getDefaultDays() }
          DAY_NAMES.forEach((day) => {
            merged[day] = ensureDayShape(outletTimings[day] || merged[day])
          })
          setDays(merged)
        }
      } catch (error) {
        debugError("Error loading outlet timings from backend:", error)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      try {
        await restaurantAPI.saveOutletTimings(toApiPayload(days))
        window.dispatchEvent(new Event("outletTimingsUpdated"))
      } catch (error) {
        debugError("Error saving outlet timings to backend:", error)
      }
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [days, loading])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  const toggleDay = (day) => {
    setExpandedDay((prev) => (prev === day ? null : day))
  }

  const toggleDayOpen = (day) => {
    setDays((prev) => {
      const current = ensureDayShape(prev[day])
      const isOpen = !current.isOpen
      const slots = isOpen ? (current.slots.length > 0 ? current.slots : [createSlot()]) : []
      return {
        ...prev,
        [day]: {
          isOpen,
          openingTime: isOpen ? (slots[0]?.openingTime || "09:00") : "",
          closingTime: isOpen ? (slots[0]?.closingTime || "22:00") : "",
          slots,
        },
      }
    })
  }

  const updateSlot = (day, slotId, field, value) => {
    setDays((prev) => {
      const current = ensureDayShape(prev[day])
      const slots = current.slots.map((slot) =>
        slot.id === slotId ? { ...slot, [field]: value } : slot,
      )
      return {
        ...prev,
        [day]: {
          ...current,
          openingTime: slots[0]?.openingTime || "",
          closingTime: slots[0]?.closingTime || "",
          slots,
        },
      }
    })
  }

  const addSlot = (day) => {
    setDays((prev) => {
      const current = ensureDayShape(prev[day])
      const lastSlot = current.slots[current.slots.length - 1]
      const nextSlot = createSlot(lastSlot?.openingTime || "09:00", lastSlot?.closingTime || "22:00")
      const slots = [...current.slots, nextSlot]
      return {
        ...prev,
        [day]: {
          ...current,
          slots,
          openingTime: slots[0]?.openingTime || "",
          closingTime: slots[0]?.closingTime || "",
        },
      }
    })
  }

  const removeSlot = (day, slotId) => {
    setDays((prev) => {
      const current = ensureDayShape(prev[day])
      const slots = current.slots.filter((slot) => slot.id !== slotId)
      const safeSlots = slots.length > 0 ? slots : [createSlot()]
      return {
        ...prev,
        [day]: {
          ...current,
          slots: safeSlots,
          openingTime: safeSlots[0]?.openingTime || "",
          closingTime: safeSlots[0]?.closingTime || "",
        },
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading outlet timings...</div>
      </div>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div className="min-h-screen bg-white overflow-x-hidden">
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/food/restaurant/explore")}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Outlet timings</h1>
          </div>
        </div>

        <div className="px-4 py-6">
          <div className="mb-6">
            <div className="text-center mb-2">
              <h2 className="text-base font-semibold text-blue-600">{companyName} delivery</h2>
            </div>
            <div className="h-0.5 bg-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">
              Add multiple slots in the same day, for example 9:00 AM to 11:00 AM and 1:00 PM to 4:00 PM.
            </p>
          </div>

          <div className="space-y-2">
            {DAY_NAMES.map((day, index) => {
              const dayData = ensureDayShape(days[day])
              const isExpanded = expandedDay === day

              return (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="bg-white border border-gray-200 rounded-sm overflow-hidden"
                >
                  <div className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all ${isExpanded ? "bg-gray-100" : ""}`}>
                    <button onClick={() => toggleDay(day)} className="flex items-center gap-3 flex-1 text-left">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-700" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-700" />
                      )}
                      <div>
                        <div className="text-base font-medium text-gray-900">{day}</div>
                        <div className="text-xs text-gray-500">
                          {dayData.isOpen
                            ? `${dayData.slots.length} slot${dayData.slots.length > 1 ? "s" : ""}`
                            : "Closed"}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-700">{dayData.isOpen ? "Open" : "Close"}</span>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={dayData.isOpen}
                          onCheckedChange={() => toggleDayOpen(day)}
                          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
                        />
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 space-y-4 border-t border-gray-100">
                          {dayData.isOpen ? (
                            <>
                              {dayData.slots.map((slot, slotIndex) => (
                                <div key={slot.id} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-900">
                                      Slot {slotIndex + 1}
                                    </div>
                                    {dayData.slots.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeSlot(day, slot.id)}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove
                                      </button>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Opening time
                                      </label>
                                      <div className="border border-gray-200 rounded-md px-3 py-2 bg-white">
                                        <MobileTimePicker
                                          value={stringToTime(slot.openingTime, "09:00")}
                                          onChange={(newValue) => {
                                            if (newValue) {
                                              updateSlot(day, slot.id, "openingTime", timeToString(newValue, slot.openingTime || "09:00"))
                                            }
                                          }}
                                          slotProps={{
                                            textField: {
                                              variant: "outlined",
                                              size: "small",
                                              placeholder: "Select opening time",
                                              sx: {
                                                "& .MuiOutlinedInput-root": {
                                                  height: "36px",
                                                  fontSize: "12px",
                                                  backgroundColor: "white",
                                                  "& fieldset": { borderColor: "#e5e7eb" },
                                                  "&:hover fieldset": { borderColor: "#d1d5db" },
                                                  "&.Mui-focused fieldset": { borderColor: "#000" },
                                                },
                                                "& .MuiInputBase-input": {
                                                  padding: "8px 12px",
                                                  fontSize: "12px",
                                                },
                                              },
                                            },
                                          }}
                                          format="hh:mm a"
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500">Current: {formatTime12Hour(slot.openingTime)}</p>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Closing time
                                      </label>
                                      <div className="border border-gray-200 rounded-md px-3 py-2 bg-white">
                                        <MobileTimePicker
                                          value={stringToTime(slot.closingTime, "22:00")}
                                          onChange={(newValue) => {
                                            if (newValue) {
                                              updateSlot(day, slot.id, "closingTime", timeToString(newValue, slot.closingTime || "22:00"))
                                            }
                                          }}
                                          slotProps={{
                                            textField: {
                                              variant: "outlined",
                                              size: "small",
                                              placeholder: "Select closing time",
                                              sx: {
                                                "& .MuiOutlinedInput-root": {
                                                  height: "36px",
                                                  fontSize: "12px",
                                                  backgroundColor: "white",
                                                  "& fieldset": { borderColor: "#e5e7eb" },
                                                  "&:hover fieldset": { borderColor: "#d1d5db" },
                                                  "&.Mui-focused fieldset": { borderColor: "#000" },
                                                },
                                                "& .MuiInputBase-input": {
                                                  padding: "8px 12px",
                                                  fontSize: "12px",
                                                },
                                              },
                                            },
                                          }}
                                          format="hh:mm a"
                                        />
                                      </div>
                                      <p className="text-xs text-gray-500">Current: {formatTime12Hour(slot.closingTime)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => addSlot(day)}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 bg-blue-50 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                              >
                                <Plus className="w-4 h-4" />
                                Add another slot
                              </button>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 pl-1">This day is closed</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </LocalizationProvider>
  )
}
