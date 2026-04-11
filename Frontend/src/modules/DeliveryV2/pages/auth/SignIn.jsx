import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2, Phone } from "lucide-react"
import { deliveryAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


// Common country codes
export default function DeliverySignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })

  // Pre-fill form from sessionStorage if data exists (e.g., when coming back from OTP)
  useEffect(() => {
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.phone) {
          // Extract digits after +91
          const phoneDigits = data.phone.replace("+91", "").trim()
          setFormData(prev => ({
            ...prev,
            phone: phoneDigits
          }))
        }
      } catch (err) {
        debugError("Error parsing stored auth data:", err)
      }
    }
  }, [])
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  const validatePhone = (phone, countryCode) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required"
    }

    const digitsOnly = phone.replace(/\D/g, "")

    if (digitsOnly.length < 8) {
      return "Phone number must be at least 8 digits"
    }
    if (digitsOnly.length > 15) {
      return "Phone number is too long"
    }

    return ""
  }

  const handleSendOTP = async () => {
    setError("")

    const phoneError = validatePhone(formData.phone, formData.countryCode)
    if (phoneError) {
      setError(phoneError)
      return
    }

    const fullPhone = `${formData.countryCode} ${formData.phone}`.trim()

    try {
      setIsSending(true)
      // Start a fresh login flow and prevent stale-token auto redirects.
      clearModuleAuth("delivery")

      // Call backend to send OTP for delivery login
      await deliveryAPI.sendOTP(fullPhone, "login")

      // Store auth data in sessionStorage for OTP page
      const authData = {
        method: "phone",
        phone: fullPhone,
        isSignUp: false,
        purpose: "login",
        module: "delivery",
      }
      sessionStorage.setItem("deliveryAuthData", JSON.stringify(authData))

      // Navigate to OTP page
      navigate("/food/delivery/otp")
    } catch (err) {
      debugError("Send OTP Error:", err)
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send OTP. Please try again."
      setError(message)
    } finally {
      setIsSending(false)
    }
  }

  const handlePhoneChange = (e) => {
    // Only allow digits and limit to 10 digits
    const value = e.target.value.replace(/\D/g, "").slice(0, 10)
    setFormData({
      ...formData,
      phone: value,
    })
  }

  const isValid = !validatePhone(formData.phone, formData.countryCode)

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col pt-0 sm:pt-0">
      <div className="w-full min-h-[180px] bg-[#001A94] dark:bg-[#001166] rounded-b-[2.5rem] p-6 text-center text-white relative overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="absolute inset-0 bg-white/5 opacity-50 blur-3xl rounded-full -top-1/2 -left-1/4 animate-pulse" />
        <div className="absolute right-0 bottom-0 w-32 h-32 md:w-48 md:h-48 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 0C44.8 0 0 44.8 0 100s44.8 100 100 100 100-44.8 100-100S155.2 0 100 0zm0 180c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z"/>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="text-2xl md:text-5xl font-normal tracking-tight mb-1">
            <span className="font-bold">DarDeComer</span>{" "}
            <span className="font-normal">Delivery</span>
          </h1>
          <p className="text-xs md:text-base font-medium text-white/90 tracking-[0.2em] uppercase">
            Taste the best, forget the rest
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-[480px] mx-auto w-full px-6 py-4 flex flex-col justify-center -mt-8 relative z-20">
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-50">
          <div className="text-center mb-6 space-y-2">
            <h2 className="text-2xl font-normal tracking-normal text-gray-900 dark:text-white" style={{ fontFamily: "'Saira Stencil', sans-serif" }}>Login or Signup</h2>
            <div className="h-1 w-12 bg-[#001A94] mx-auto rounded-full" />
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-[#001A94] transition-colors" />
                </div>
                <div className="absolute left-8 inset-y-0 flex items-center pointer-events-none">
                  <span className="text-sm font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800 pr-3">+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  autoComplete="off"
                  autoFocus={false}
                  className="block w-full pl-20 pr-4 py-3 bg-transparent text-gray-900 dark:text-white border-b-2 border-gray-100 dark:border-gray-800 focus:border-[#001A94] outline-none transition-all placeholder:text-gray-300 font-medium text-lg"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              We will send success notifications and order updates via SMS
            </p>

            <button
              onClick={handleSendOTP}
              disabled={!isValid || isSending}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all relative overflow-hidden shadow-xl ${isValid && !isSending
                ? "bg-[#001A94] hover:bg-[#001166] text-white hover:shadow-2xl hover:shadow-[#001A94]/30 active:scale-[0.98] hover:-translate-y-0.5"
                : "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-50 text-gray-500"
                }`}
            >
              {isSending ? <Loader2 className="w-7 h-7 animate-spin mx-auto text-white" /> : "Get Verification Code"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] leading-relaxed">
            By continuing, you agree to our <br />
            <Link to="/food/delivery/terms" className="text-gray-900 underline cursor-pointer hover:text-[#001A94] transition-colors">Terms of Service</Link> & <Link to="/food/delivery/profile/privacy" className="text-gray-900 underline cursor-pointer hover:text-[#001A94] transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}


