import React, { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom"
import { Phone, Lock, ArrowRight, ShieldCheck, Loader2, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { authAPI, userAPI } from "@food/api"
import { setAuthData } from "@food/utils/auth"
import { getCachedSettings, loadBusinessSettings } from "@food/utils/businessSettings"
import { useCompanyName } from "@food/hooks/useCompanyName"
import loginBanner from "@food/assets/loginbanner.png"

export default function UnifiedOTPFastLogin() {
  const companyName = useCompanyName()
  const [logoUrl, setLogoUrl] = useState(null)
  const RESEND_COOLDOWN_SECONDS = 60
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [pendingAuthData, setPendingAuthData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const navigate = useNavigate()
  const submitting = useRef(false)

  // Load logo for branding
  useEffect(() => {
    const loadLogo = async () => {
      const cached = getCachedSettings()
      if (cached?.logo?.url) {
        setLogoUrl(cached.logo.url)
      } else {
        const settings = await loadBusinessSettings()
        if (settings?.logo?.url) {
          setLogoUrl(settings.logo.url)
        }
      }
    }
    loadLogo()
  }, [])

  const normalizedPhone = () => {
    const digits = String(phoneNumber).replace(/\D/g, "").slice(-15)
    return digits.length >= 8 ? digits : ""
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtpSent(true)
      setOtp("")
      setStep(2)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP sent! Check your phone.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleResendOTP = async () => {
    const phone = normalizedPhone()
    if (phone.length < 8) {
      toast.error("Please enter a valid phone number (at least 8 digits)")
      return
    }
    if (resendTimer > 0 || submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      await authAPI.sendOTP(phoneNumber, "login", null)
      setOtp("")
      setOtpSent(true)
      setResendTimer(RESEND_COOLDOWN_SECONDS)
      toast.success("OTP resent successfully.")
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resend OTP."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleEditNumber = () => {
    setStep(1)
    setOtp("")
    setName("")
    setPendingAuthData(null)
    setResendTimer(0)
  }

  const resolvePushContext = async () => {
    let fcmToken = null
    let platform = "web"
    try {
      if (typeof window !== "undefined") {
        if (window.flutter_inappwebview) {
          platform = "mobile"
          const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"]
          for (const handlerName of handlerNames) {
            try {
              const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "user" })
              if (t && typeof t === "string" && t.length > 20) {
                fcmToken = t.trim()
                break
              }
            } catch (e) {}
          }
        } else {
          fcmToken = localStorage.getItem("fcm_web_registered_token_user") || null
        }
      }
    } catch (e) {
      console.warn("Failed to get FCM token during login", e)
    }
    return { fcmToken, platform }
  }

  const completeLogin = (data) => {
    const accessToken = data?.accessToken || data?.token
    const refreshToken = data.refreshToken || null
    const user = data.user
    const role = data.role || user?.role || "user"

    if (!accessToken || !user) {
      throw new Error("Invalid response from server")
    }

    // Map backend internal role to frontend module key
    let moduleKey = "user"
    let navigatePath = "/food/user"

    if (role === "DELIVERY_PARTNER") {
      moduleKey = "delivery"
      navigatePath = "/food/delivery"
    } else if (role === "RESTAURANT") {
      moduleKey = "restaurant"
      navigatePath = "/food/restaurant"
    } else if (role === "ADMIN") {
      moduleKey = "admin"
      navigatePath = "/food/admin"
    }

    setAuthData(moduleKey, accessToken, user, refreshToken)
    const roleText = role.toUpperCase() === "USER" ? "" : ` Logged in as ${role.toLowerCase().replace('_', ' ')}`
    toast.success(`Login successful!${roleText}`)
    navigate(navigatePath, { replace: true })
  }

  const normalizeAuthPayload = (raw) => {
    const data = raw || {}
    return {
      ...data,
      accessToken: data?.accessToken || data?.token || null,
      refreshToken: data?.refreshToken || null,
      user: data?.user || null,
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    const phone = normalizedPhone()
    const otpDigits = String(otp).replace(/\D/g, "").slice(0, 4)
    if (otpDigits.length !== 4) {
      toast.error("Please enter the 4-digit OTP")
      return
    }
    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      const { fcmToken, platform } = await resolvePushContext()

      const response = await authAPI.verifyOTP(phoneNumber, otpDigits, "login", null, null, "user", null, null, fcmToken, platform)
      const data = normalizeAuthPayload(response?.data?.data || response?.data || {})
      const user = data?.user || {}
      const hasName = typeof user.name === "string" && user.name.trim().length > 0 && user.name.trim().toLowerCase() !== "null"
      const needsName = data?.isNewUser === true || !hasName

      if (needsName) {
        setPendingAuthData(data)
        setStep(3)
        setLoading(false)
        submitting.current = false
        return
      }

      completeLogin(data)
    } catch (err) {
      const status = err?.response?.status
      let msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Invalid OTP. Please try again."
      if (status === 401) {
        if (/deactivat(ed|e)/i.test(String(msg))) {
          msg = "Your account is deactivated. Please contact support."
        } else {
          msg = "Invalid or expired code, or account not active."
        }
      }
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  const handleSubmitName = async (e) => {
    e.preventDefault()
    const trimmedName = String(name || "").trim()
    if (trimmedName.length < 2) {
      toast.error("Please enter your name (min 2 characters)")
      return
    }

    const accessToken = pendingAuthData?.accessToken || pendingAuthData?.token
    if (!accessToken || !pendingAuthData?.user) {
      toast.error("Session expired. Please verify OTP again.")
      setStep(2)
      return
    }

    if (submitting.current) return
    submitting.current = true
    setLoading(true)
    try {
      const refreshToken = pendingAuthData?.refreshToken || null
      // Set tokens first so profile update can use authenticated user context.
      setAuthData("user", accessToken, pendingAuthData.user, refreshToken)

      const updateRes = await userAPI.updateProfile({ name: trimmedName })
      const updatedUser =
        updateRes?.data?.data?.user ||
        updateRes?.data?.user ||
        { ...pendingAuthData.user, name: trimmedName }

      const finalizedData = {
        ...pendingAuthData,
        accessToken,
        token: accessToken,
        user: updatedUser,
      }

      setPendingAuthData(null)
      completeLogin(finalizedData)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to complete signup."
      toast.error(msg)
    } finally {
      setLoading(false)
      submitting.current = false
    }
  }

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return
    const intervalId = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(intervalId)
  }, [step, resendTimer])

  const formatResendTimer = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

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
               {logoUrl ? <img src={logoUrl} alt="Logo" className="w-[90%] h-[90%] object-contain" /> : <span className="text-[#001A94] text-4xl font-black">{companyName?.[0] || "D"}</span>}
            </div>
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
            className="md:hidden text-center pb-6 flex flex-col items-center"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg overflow-hidden p-1">
               {logoUrl ? <img src={logoUrl} alt="Logo" className="w-[90%] h-[90%] object-contain" /> : <span className="text-[#001A94] text-3xl font-black">{companyName?.[0] || "D"}</span>}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>{companyName || "Dar De Comer"}</h1>
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
              {step === 1 ? "Welcome Back" : step === 2 ? "Verify OTP" : "Complete Profile"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">
              {step === 1 ? "Login or signup to continue" : step === 2 ? "Enter the code sent to your phone" : "Please provide your full name"}
            </p>
          </div>

          {/* Mobile Heading */}
          <div className="md:hidden text-center space-y-1.5 mb-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
              {step === 1 ? "Login / Signup" : step === 2 ? "Verify OTP" : "Almost Done!"}
            </h2>
          </div>

          <form onSubmit={step === 1 ? handleSendOTP : step === 2 ? handleVerifyOTP : handleSubmitName} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="space-y-2.5 relative group">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 block">Phone Number</label>
                    <div className="relative flex items-center shadow-sm rounded-2xl bg-gray-50 dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 focus-within:border-[#001A94] focus-within:ring-4 focus-within:ring-[#001A94]/10 transition-all duration-300 overflow-hidden">
                      <div className="flex items-center justify-center px-4 md:px-5 h-14 bg-gray-100/80 dark:bg-black/40 text-gray-700 dark:text-gray-300 font-bold border-r border-gray-200 dark:border-gray-800">
                        <span>+91</span>
                      </div>
                      <input
                        type="tel" required autoFocus
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        maxLength={10}
                        className="flex-1 h-14 text-lg bg-transparent border-none shadow-none focus-visible:ring-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 placeholder:font-medium pl-4"
                        placeholder="Enter 10-digit number"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                   <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#151515] p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
                      <div className="w-10 h-10 bg-[#001A94]/10 rounded-full flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-[#001A94]" />
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest leading-none mb-1">Sent to</p>
                         <p className="text-sm font-bold text-gray-900 dark:text-white">+91 {phoneNumber}</p>
                      </div>
                      <button type="button" onClick={handleEditNumber} className="text-xs text-[#001A94] font-bold underline cursor-pointer hover:text-blue-700">Edit</button>
                   </div>
                   
                   <div className="flex justify-center gap-3 md:gap-4 mt-4">
                    {[0, 1, 2, 3].map((index) => (
                       <input
                         key={index}
                         id={`otp-${index}`}
                         type="tel"
                         inputMode="numeric"
                         required
                         autoFocus={index === 0}
                         value={otp[index] || ""}
                         onChange={(e) => {
                           const val = e.target.value.replace(/\D/g, "").slice(-1);
                           if (!val) return;
                           const newOtp = otp.split("");
                           newOtp[index] = val;
                           const combined = newOtp.join("").slice(0, 4);
                           setOtp(combined);
                           
                           if (index < 3 && val) {
                             document.getElementById(`otp-${index + 1}`)?.focus();
                           }
                         }}
                         onKeyDown={(e) => {
                           if (e.key === "Backspace") {
                             if (!otp[index] && index > 0) {
                               document.getElementById(`otp-${index - 1}`)?.focus();
                             } else {
                               const newOtp = otp.split("");
                               newOtp[index] = "";
                               setOtp(newOtp.join(""));
                             }
                           }
                         }}
                         onPaste={(e) => {
                           e.preventDefault();
                           const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
                           if (pasteData) {
                             setOtp(pasteData);
                             document.getElementById(`otp-${Math.min(pasteData.length, 3)}`)?.focus();
                           }
                         }}
                         className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-black bg-gray-50 dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 focus:border-[#001A94] focus:ring-4 focus:ring-[#001A94]/10 rounded-xl sm:rounded-2xl outline-none transition-all text-gray-900 dark:text-white"
                         placeholder="-"
                       />
                     ))}
                   </div>
                   
                   <div className="text-center mt-6">
                     {resendTimer > 0 ? (
                       <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                         Resend OTP in <span className="text-[#001A94]">{formatResendTimer(resendTimer)}</span>
                       </p>
                     ) : (
                       <button type="button" onClick={handleResendOTP} disabled={loading} className="text-sm font-bold text-[#001A94] underline hover:text-blue-700 disabled:opacity-50 transition-colors">
                         Resend OTP
                       </button>
                     )}
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="space-y-2.5 relative group">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 block">Full Name</label>
                    <div className="relative flex items-center shadow-sm rounded-2xl bg-gray-50 dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 focus-within:border-[#001A94] focus-within:ring-4 focus-within:ring-[#001A94]/10 transition-all duration-300 overflow-hidden px-4 h-14">
                      <UserIcon className="w-5 h-5 text-gray-400 group-focus-within:text-[#001A94] transition-colors mr-3" />
                      <input
                        type="text" required autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 placeholder:font-medium text-lg w-full"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-[#001A94] to-[#0026D1] hover:from-[#00157A] hover:to-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_8px_25px_-5px_rgba(0,26,148,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(0,26,148,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] group flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-8"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {step === 1 ? "Continue" : step === 2 ? "Verify & Proceed" : "Complete Signup"}
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
                <Link to="/food/user/profile/terms" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <Link to="/food/user/profile/privacy" className="hover:text-[#001A94] dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>

            <Link
              to="/user/support"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#001A94]/20 bg-white/80 dark:bg-transparent dark:border-gray-800 px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#001A94] dark:text-blue-400 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            >
              Need help? Support
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
