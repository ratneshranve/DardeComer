import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { deliveryAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import loginBanner from "@food/assets/loginbanner.png"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

export default function DeliverySignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91",
  })
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

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

  const validatePhone = (phone) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required"
    }

    const digitsOnly = phone.replace(/\D/g, "")

    if (digitsOnly.length !== 10) {
      return "Phone number must be exactly 10 digits"
    }

    return ""
  }

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault()
    setError("")

    const phoneError = validatePhone(formData.phone)
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

  const isValid = !validatePhone(formData.phone)

  return (
    <div className="h-[100dvh] bg-white dark:bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Left side: Branding / Banner (Desktop) & Top half (Mobile) */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 h-[30vh] md:h-screen flex-shrink-0 bg-[#001A94] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img src={loginBanner} alt="Food Banner" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#00157A] via-[#001A94]/80 to-transparent md:bg-gradient-to-r" />
        </div>
        
        {/* Animated decorative shapes */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[80px]" />
           <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-400/20 blur-[100px]" />
        </div>

        {/* Branding content */}
        <div className="relative z-10 flex flex-col justify-end md:justify-center h-full p-6 sm:p-8 md:p-12 lg:p-16 text-white">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden md:block"
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl overflow-hidden p-1.5">
               <span className="text-[#001A94] text-4xl font-black">D</span>
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Deliver with <br/>
              <span className="text-blue-300">Dar De Comer.</span>
            </h1>
            <p className="text-blue-100 text-lg lg:text-xl max-w-md font-medium leading-relaxed">
              Join our delivery fleet and start earning today.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden text-center pb-6 flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden p-1">
               <span className="text-[#001A94] text-3xl font-black">D</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>Dar De Comer <span className="font-medium text-blue-200">Delivery</span></h1>
            <p className="text-blue-100/90 text-sm mt-1.5 font-medium tracking-wide">Taste the best, forget the rest</p>
          </motion.div>
        </div>
      </div>

      {/* Right side: Form Container */}
      <div className="flex-1 relative -mt-6 md:mt-0 z-10 bg-white dark:bg-[#0a0a0a] rounded-t-[32px] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none min-h-0 overflow-y-auto block">
        
        {/* Mobile drag handle indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full md:hidden" />

        <div className="w-full max-w-[420px] mx-auto min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 md:px-0 space-y-8 md:space-y-10 mt-6 md:mt-0">
          
          <div className="hidden md:block text-center md:text-left space-y-2.5">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Welcome Back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              Login or signup to continue
            </p>
          </div>

          {/* Mobile Heading */}
          <div className="md:hidden text-center space-y-1.5 mb-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              Login / Signup
            </h2>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="space-y-2.5 relative group">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 block">Phone Number</label>
                <div className={`relative flex items-center shadow-sm rounded-2xl bg-gray-50 dark:bg-[#151515] border-2 transition-all duration-300 overflow-hidden ${error ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10' : 'border-gray-200 dark:border-gray-800 focus-within:border-[#001A94] focus-within:ring-4 focus-within:ring-[#001A94]/10'}`}>
                  <div className="flex items-center justify-center px-4 md:px-5 h-14 bg-gray-100/80 dark:bg-black/40 text-gray-700 dark:text-gray-300 font-bold border-r border-gray-200 dark:border-gray-800">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel" required autoFocus
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className="flex-1 h-14 text-lg bg-transparent border-none shadow-none focus-visible:ring-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 placeholder:font-medium pl-4"
                    placeholder="Enter 10-digit number"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 font-semibold pl-2"
                >
                  {error}
                </motion.div>
              )}
            </motion.div>

            <button
              type="submit"
              disabled={!isValid || isSending}
              className="w-full h-14 bg-gradient-to-r from-[#001A94] to-[#0026D1] hover:from-[#00157A] hover:to-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_8px_25px_-5px_rgba(0,26,148,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(0,26,148,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-8"
            >
              {isSending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-[#107C41] dark:text-[#63E297] mb-8 font-bold bg-[#F2FCF5] dark:bg-[#132819] border border-emerald-100 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-full shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
            
            <div className="text-center text-[11px] md:text-xs text-gray-500 dark:text-gray-400 mb-8">
              <p className="mb-2">By continuing, you agree to our</p>
              <div className="flex justify-center gap-3 flex-wrap font-bold">
                <Link to="/food/delivery/terms" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <Link to="/food/delivery/privacy" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>

            <Link
              to="/food/delivery/support"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-[#151515] px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700"
            >
              Need help? Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
