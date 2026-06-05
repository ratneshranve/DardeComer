import { useState, useEffect, useRef } from "react"
import { useNavigate, Link, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2, ArrowRight, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import AnimatedPage from "@food/components/user/AnimatedPage"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { authAPI } from "@food/api"
import loginBanner from "@food/assets/loginbanner.png"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [formData, setFormData] = useState({
    phone: "",
    countryCode: "+91", // required; default +91 for India
  })

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("userAuthData")
    if (!stored) return

    try {
      const data = JSON.parse(stored)
      const fullPhone = String(data.phone || "").trim()
      const phoneDigits = fullPhone.replace(/^\+91\s*/, "").replace(/\D/g, "").slice(0, 10)

      setFormData((prev) => ({
        ...prev,
        phone: phoneDigits || prev.phone,
      }))
    } catch (err) {
      debugError("Error parsing stored auth data:", err)
    }
  }, [])

  const validatePhone = (phone) => {
    if (!phone.trim()) return "Phone number is required"
    const cleanPhone = phone.replace(/\D/g, "")
    if (!/^\d{10}$/.test(cleanPhone)) return "Phone number must be exactly 10 digits"
    return ""
  }

  const handleChange = (e) => {
    const { name } = e.target
    let { value } = e.target

    if (name === "phone") {
      value = value.replace(/\D/g, "").slice(0, 10)
      setError(validatePhone(value))
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const phoneError = validatePhone(formData.phone)
    setError(phoneError)
    if (phoneError) return
    if (submittingRef.current) return
    submittingRef.current = true
    setIsLoading(true)
    setError("")

    try {
      const countryCode = formData.countryCode?.trim() || "+91"
      const phoneDigits = String(formData.phone ?? "").replace(/\D/g, "").slice(0, 10)
      if (phoneDigits.length !== 10) {
        setError("Phone number must be exactly 10 digits")
        setIsLoading(false)
        submittingRef.current = false
        return
      }
      const fullPhone = `${countryCode} ${phoneDigits}`
      await authAPI.sendOTP(fullPhone, "login", null)

      const ref = String(searchParams.get("ref") || "").trim()
      const authData = {
        method: "phone",
        phone: fullPhone,
        email: null,
        name: null,
        referralCode: ref || null,
        isSignUp: false,
        module: "user",
      }

      sessionStorage.setItem("userAuthData", JSON.stringify(authData))
      const redirect = String(searchParams.get("redirect") || "").trim()
      navigate(
        redirect
          ? `/food/user/auth/otp?redirect=${encodeURIComponent(redirect)}`
          : "/food/user/auth/otp"
      )
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.response?.data?.error ||
        "Failed to send OTP. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
      submittingRef.current = false
    }
  }

  return (
    <AnimatedPage className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col md:flex-row overflow-hidden">
      
      {/* Left side: Branding / Banner (Desktop) & Top half (Mobile) */}
      <div className="relative w-full md:w-5/12 lg:w-1/2 h-[35vh] md:h-screen flex-shrink-0 bg-[#001A94] overflow-hidden">
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
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black mb-6 leading-tight tracking-tight">
              Delicious food,<br/>
              <span className="text-blue-300">delivered to you.</span>
            </h1>
            <p className="text-blue-100 text-lg lg:text-xl max-w-md font-medium leading-relaxed">
              Join us to explore the best restaurants around you and enjoy exclusive offers.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden text-center pb-6"
          >
            <h1 className="text-3xl font-black text-white tracking-tight">Welcome Back</h1>
            <p className="text-blue-100/90 text-sm mt-1.5 font-medium">Sign in to continue</p>
          </motion.div>
        </div>
      </div>

      {/* Right side: Form Container */}
      <div className="flex-1 flex items-start md:items-center justify-center p-4 sm:p-6 md:p-12 lg:p-16 relative -mt-8 md:mt-0 z-10 bg-white dark:bg-[#0a0a0a] rounded-t-[32px] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none min-h-[65vh]">
        
        {/* Mobile drag handle indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full md:hidden" />

        <div className="w-full max-w-[420px] space-y-8 md:space-y-10 mt-6 md:mt-0">
          
          <div className="hidden md:block text-center md:text-left space-y-2.5">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Login or Signup
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              Enter your phone number to proceed
            </p>
          </div>

          <form id="user-signin-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2.5 relative group">
              <label htmlFor="phone" className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 block">
                Phone Number
              </label>
              <div className={`relative flex items-center shadow-sm rounded-2xl bg-gray-50 dark:bg-[#151515] border-2 transition-all duration-300 overflow-hidden ${error ? 'border-red-500/50 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10' : 'border-gray-200 dark:border-gray-800 focus-within:border-[#001A94] focus-within:ring-4 focus-within:ring-[#001A94]/10'}`}>
                <div className="flex items-center justify-center px-4 md:px-5 h-14 bg-gray-100/80 dark:bg-black/40 text-gray-700 dark:text-gray-300 font-bold border-r border-gray-200 dark:border-gray-800">
                  <span>+91</span>
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex-1 h-14 text-lg bg-transparent border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 placeholder:font-medium"
                  aria-invalid={error ? "true" : "false"}
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 text-sm text-red-500 font-semibold pl-2 mt-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            <Button
              type="submit"
              form="user-signin-form"
              className="w-full h-14 bg-gradient-to-r from-[#001A94] to-[#0026D1] hover:from-[#00157A] hover:to-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_8px_25px_-5px_rgba(0,26,148,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(0,26,148,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1.5 transition-transform duration-300" />
                </>
              )}
            </Button>
          </form>

          {/* Social login separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-[#0a0a0a] px-4 text-gray-400 dark:text-gray-500 font-bold tracking-widest">
                or
              </span>
            </div>
          </div>

          {/* Social login buttons */}
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-3 w-full h-14 bg-white dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-300 active:scale-[0.98] font-bold text-gray-700 dark:text-gray-200 text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="flex flex-col items-center justify-center pt-8 pb-4">
            <div className="flex items-center gap-1.5 text-xs text-[#107C41] dark:text-[#63E297] mb-6 font-bold bg-[#F2FCF5] dark:bg-[#132819] border border-emerald-100 dark:border-emerald-900/50 px-3.5 py-1.5 rounded-full shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Login</span>
            </div>
            
            <div className="text-center text-[11px] md:text-xs text-gray-500 dark:text-gray-400">
              <p className="mb-2">By continuing, you agree to our</p>
              <div className="flex justify-center gap-3 flex-wrap font-bold">
                <Link to="/profile/terms" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <Link to="/profile/privacy" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <Link to="/profile/refund" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Content Policy
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AnimatedPage>
  )
}
