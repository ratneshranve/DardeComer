import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Loader2, ShieldCheck, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { deliveryAPI } from "@food/api"
import { setAuthData as storeAuthData } from "@food/utils/auth"
import loginBanner from "@food/assets/loginbanner.png"

const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

export default function DeliveryOTP() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [authData, setAuthData] = useState(null)
  const [showNameInput, setShowNameInput] = useState(false)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [verifiedOtp, setVerifiedOtp] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")
  const [isRejected, setIsRejected] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [deviceToken, setDeviceToken] = useState(null)
  const [activePlatform, setActivePlatform] = useState("web")
  const inputRefs = useRef([])

  useEffect(() => {
    // Get auth data from sessionStorage (delivery module key)
    const stored = sessionStorage.getItem("deliveryAuthData")
    if (stored) {
      const data = JSON.parse(stored)
      setAuthData(data)
    } else {
      // No active OTP flow: if already authenticated, go to delivery home
      const token = localStorage.getItem("delivery_accessToken")
      const authenticated = localStorage.getItem("delivery_authenticated") === "true"
      if (token && authenticated) {
        try {
          const parts = token.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
            const now = Math.floor(Date.now() / 1000)
            if (payload.exp && payload.exp > now) {
              navigate("/food/delivery", { replace: true })
              return
            }
          }
        } catch (e) {
          // Ignore token parse errors and continue to sign-in redirect
        }
      }

      // No auth data, redirect to sign in
      navigate("/food/delivery/login", { replace: true })
      return
    }

    // OTP field should be empty - delivery boy needs to enter it manually
    // Start resend timer (60 seconds)
    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Focus first input only if all fields are empty
    if (inputRefs.current[0] && otp.every(digit => digit === "")) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [otp])

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) {
      return
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (!showNameInput && newOtp.every((digit) => digit !== "") && newOtp.length === 4) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp]
        newOtp[index] = ""
        setOtp(newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        const newOtp = [...otp]
        newOtp[index - 1] = ""
        setOtp(newOtp)
      }
    }
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 4).split("")
        const newOtp = [...otp]
        digits.forEach((digit, i) => {
          if (i < 4) {
            newOtp[i] = digit
          }
        })
        setOtp(newOtp)
        if (digits.length === 4) {
          handleVerify(newOtp.join(""))
        } else {
          inputRefs.current[digits.length]?.focus()
        }
      })
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text")
    const digits = pastedData.replace(/\D/g, "").slice(0, 4).split("")
    const newOtp = [...otp]
    digits.forEach((digit, i) => {
      if (i < 4) {
        newOtp[i] = digit
      }
    })
    setOtp(newOtp)
    if (!showNameInput && digits.length === 4) {
      handleVerify(newOtp.join(""))
      return
    }
    inputRefs.current[digits.length]?.focus()
  }

  const handleVerify = async (otpValue = null) => {
    if (showNameInput) {
      return
    }

    const code = otpValue || otp.join("")

    if (code.length !== 4) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      const providedName = authData?.isSignUp ? authData?.name || null : null
      if (!phone) {
        setError("Phone number not found. Please try again.")
        setIsLoading(false)
        return
      }

      let fcmToken = null;
      let platform = "web";
      try {
        if (typeof window !== "undefined") {
          if (window.flutter_inappwebview) {
            platform = "mobile";
            const handlerNames = ["getFcmToken", "getFCMToken", "getPushToken", "getFirebaseToken"];
            for (const handlerName of handlerNames) {
              try {
                const t = await window.flutter_inappwebview.callHandler(handlerName, { module: "delivery" });
                if (t && typeof t === "string" && t.length > 20) {
                  fcmToken = t.trim();
                  break;
                }
              } catch (e) {}
            }
          } else {
            fcmToken = localStorage.getItem("fcm_web_registered_token_delivery") || null;
          }
        }
      } catch (e) {
        debugWarn("Failed to get FCM token during login", e);
      }

      setDeviceToken(fcmToken);
      setActivePlatform(platform);

      const response = await deliveryAPI.verifyOTP(phone, code, purpose, providedName, fcmToken, platform)
      debugLog("Delivery OTP Response:", response)
      const data = response?.data?.data || response?.data || {}
      debugLog("Parsed Delivery OTP Data:", data)

      if (data.pendingApproval === true) {
        sessionStorage.removeItem("deliveryAuthData")
        setIsLoading(false)
        setError("")
        setPendingMessage(data.message || "Your account is pending admin verification. You will be notified once approved.")
        setIsRejected(data.isRejected || false)
        setRejectionReason(data.rejectionReason || "")
        return
      }

      const needsRegistration = data.needsRegistration === true

      if (needsRegistration) {
        sessionStorage.removeItem("deliveryAuthData")
        sessionStorage.setItem("deliveryNeedsRegistration", "true")
        const digits = String(phone || "").replace(/\D/g, "")
        const details = {
          name: "",
          phone: digits.slice(-10),
          countryCode: "+91",
        }
        sessionStorage.setItem("deliverySignupDetails", JSON.stringify(details))
        setIsLoading(false)
        navigate("/food/delivery/signup/details", { replace: true })
        return
      }

      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      sessionStorage.removeItem("deliveryAuthData")

      try {
        storeAuthData("delivery", accessToken, user, refreshToken)
      } catch (storageError) {
        setError("Failed to save authentication. Please try again or clear your browser storage.")
        setIsLoading(false)
        return
      }

      window.dispatchEvent(new Event("deliveryAuthChanged"))

      setSuccess(true)
      setIsLoading(false)

      let retryCount = 0
      const maxRetries = 10
      const verifyAndNavigate = () => {
        const storedToken = localStorage.getItem("delivery_accessToken")
        const storedAuth = localStorage.getItem("delivery_authenticated")

        if (storedToken && storedAuth === "true") {
          navigate("/food/delivery", { replace: true })
        } else if (retryCount < maxRetries) {
          retryCount++
          setTimeout(verifyAndNavigate, 100)
        } else {
          setError("Failed to save authentication. Please try again.")
          setIsLoading(false)
        }
      }
      setTimeout(verifyAndNavigate, 200)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to verify OTP. Please try again."
      setError(message)
      setIsLoading(false)
    }
  }

  const handleSubmitName = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Name is required")
      return
    }

    if (!verifiedOtp) {
      setError("OTP verification step missing. Please request a new OTP.")
      return
    }

    setIsLoading(true)
    setError("")
    setNameError("")

    try {
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      if (!phone) {
        setError("Phone number not found. Please try again.")
        return
      }

      const response = await deliveryAPI.verifyOTP(phone, verifiedOtp, purpose, trimmedName, deviceToken, activePlatform)
      const data = response?.data?.data || response?.data || {}

      const accessToken = data.accessToken
      const refreshToken = data.refreshToken || null
      const user = data.user

      if (!accessToken || !user) {
        throw new Error("Invalid response from server")
      }

      sessionStorage.removeItem("deliveryAuthData")

      try {
        storeAuthData("delivery", accessToken, user, refreshToken)
      } catch (storageError) {
        setError("Failed to save authentication. Please try again or clear your browser storage.")
        setIsLoading(false)
        return
      }

      window.dispatchEvent(new Event("deliveryAuthChanged"))

      setSuccess(true)
      setIsLoading(false)

      let retryCount = 0
      const maxRetries = 10
      const verifyAndNavigate = () => {
        const storedToken = localStorage.getItem("delivery_accessToken")
        const storedAuth = localStorage.getItem("delivery_authenticated")

        if (storedToken && storedAuth === "true") {
          navigate("/food/delivery", { replace: true })
        } else if (retryCount < maxRetries) {
          retryCount++
          setTimeout(verifyAndNavigate, 100)
        } else {
          setError("Failed to save authentication. Please try again.")
          setIsLoading(false)
        }
      }

      setTimeout(verifyAndNavigate, 200)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to complete registration. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return

    setIsLoading(true)
    setError("")

    try {
      const phone = authData?.phone
      const purpose = authData?.purpose || "login"
      if (!phone) {
        setError("Phone number not found. Please go back and try again.")
        return
      }

      await deliveryAPI.sendOTP(phone, purpose)
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resend OTP. Please try again."
      setError(message)
    } finally {
      setIsLoading(false)
    }

    setResendTimer(60)
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    setOtp(["", "", "", ""])
    setShowNameInput(false)
    setName("")
    setNameError("")
    setVerifiedOtp("")
    inputRefs.current[0]?.focus()
  }

  const getPhoneNumber = () => {
    if (!authData) return ""
    if (authData.method === "phone") {
      const phone = authData.phone || ""
      const cleaned = phone.replace(/\s/g, "")
      if (cleaned.startsWith("+91") && cleaned.length > 3) {
        return cleaned.slice(0, 3) + "-" + cleaned.slice(3)
      }
      return cleaned
    }
    return authData.email || ""
  }

  if (!authData) {
    return null
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
          <button
            onClick={() => navigate("/food/delivery/login", { replace: true })}
            className="absolute top-6 left-6 md:top-8 md:left-8 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center transition-colors text-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

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
          </motion.div>
        </div>
      </div>

      {/* Right side: Form Container */}
      <div className="flex-1 relative -mt-6 md:mt-0 z-10 bg-white dark:bg-[#0a0a0a] rounded-t-[32px] md:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none min-h-0 overflow-y-auto block">
        
        {/* Mobile drag handle indicator */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full md:hidden" />

        <div className="w-full max-w-[420px] mx-auto min-h-full flex flex-col justify-center pt-6 pb-10 md:py-12 px-4 sm:px-6 md:px-0 space-y-6 md:space-y-10">
          
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight" style={{ fontFamily: "'Google Sans', sans-serif" }}>
               {pendingMessage ? "Verification" : showNameInput ? "Almost Done!" : "Verify OTP"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-base md:text-lg">
               {pendingMessage ? "Your account status" : showNameInput ? "Please tell us your name to complete registration." : "Enter the code sent to your phone"}
            </p>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
               {pendingMessage && (
                  <motion.div key="pending" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                     <div className={`rounded-2xl border-2 p-6 text-center space-y-4 shadow-sm ${isRejected ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-900/50" : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-900/50"}`}>
                        <div className="space-y-3">
                           <p className={`text-lg font-black ${isRejected ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                              {isRejected ? "Application Rejected" : "Pending Verification"}
                           </p>
                           <p className={`text-sm font-semibold leading-relaxed ${isRejected ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300"}`}>
                              {pendingMessage}
                           </p>
                           {isRejected && rejectionReason && (
                              <div className="mt-4 p-4 bg-white/60 dark:bg-black/20 rounded-xl border border-red-100 dark:border-red-900/30 text-left">
                                 <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-1.5">Reason</p>
                                 <p className="text-sm font-bold text-red-800 dark:text-red-200">"{rejectionReason}"</p>
                              </div>
                           )}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                           {isRejected ? (
                              <button
                                 type="button"
                                 onClick={() => {
                                    const phone = authData?.phone
                                    const digits = String(phone || "").replace(/\D/g, "")
                                    sessionStorage.setItem("deliveryNeedsRegistration", "true")
                                    const details = {
                                       name: "",
                                       phone: digits.slice(-10),
                                       countryCode: "+91",
                                    }
                                    sessionStorage.setItem("deliverySignupDetails", JSON.stringify(details))
                                    navigate("/food/delivery/signup/details", { replace: true })
                                 }}
                                 className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
                              >
                                 Re-apply Now
                              </button>
                           ) : null}
                           <button
                              type="button"
                              onClick={() => navigate("/food/delivery/login", { replace: true })}
                              className={`text-sm font-bold underline transition-colors ${isRejected ? "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" : "text-amber-700 hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-400"}`}
                           >
                              Back to login
                           </button>
                        </div>
                     </div>
                  </motion.div>
               )}

               {!showNameInput && !pendingMessage && (
                  <motion.div key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                     <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#151515] p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 bg-[#001A94]/10 rounded-full flex items-center justify-center">
                           <ShieldCheck className="w-5 h-5 text-[#001A94]" />
                        </div>
                        <div className="flex-1">
                           <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest leading-none mb-1">Sent to</p>
                           <p className="text-sm font-bold text-gray-900 dark:text-white">{getPhoneNumber()}</p>
                        </div>
                     </div>

                     <div className="flex justify-center gap-3 md:gap-4 mt-6">
                        {otp.map((digit, index) => (
                           <input
                              key={index}
                              ref={(el) => (inputRefs.current[index] = el)}
                              type="tel"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onPaste={index === 0 ? handlePaste : undefined}
                              disabled={isLoading}
                              autoComplete="off"
                              autoFocus={false}
                              className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-black bg-gray-50 dark:bg-[#151515] border-2 border-gray-200 dark:border-gray-800 focus:border-[#001A94] focus:ring-4 focus:ring-[#001A94]/10 rounded-xl sm:rounded-2xl outline-none transition-all text-gray-900 dark:text-white"
                              placeholder="-"
                           />
                        ))}
                     </div>

                     <div className="text-center mt-6">
                        {resendTimer > 0 ? (
                           <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                              Resend OTP in <span className="text-[#001A94]">{resendTimer}s</span>
                           </p>
                        ) : (
                           <button type="button" onClick={handleResend} disabled={isLoading} className="text-sm font-bold text-[#001A94] underline hover:text-blue-700 disabled:opacity-50 transition-colors">
                              Resend SMS
                           </button>
                        )}
                     </div>
                  </motion.div>
               )}

               {showNameInput && !pendingMessage && (
                  <motion.div key="name" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                     <div className="space-y-2.5 relative group">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 block">Full Name</label>
                        <div className={`relative flex items-center shadow-sm rounded-2xl bg-gray-50 dark:bg-[#151515] border-2 transition-all duration-300 overflow-hidden px-4 h-14 ${nameError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10' : 'border-gray-200 dark:border-gray-800 focus-within:border-[#001A94] focus-within:ring-4 focus-within:ring-[#001A94]/10'}`}>
                           <input
                              type="text" required autoFocus
                              value={name}
                              onChange={(e) => {
                                 setName(e.target.value)
                                 if (nameError) setNameError("")
                              }}
                              disabled={isLoading}
                              className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 focus:ring-0 focus:outline-none text-gray-900 dark:text-white font-semibold placeholder:text-gray-400 placeholder:font-medium text-lg w-full"
                              placeholder="Enter your name"
                           />
                        </div>
                        {nameError && (
                           <p className="text-sm text-red-500 font-semibold pl-2 mt-2">{nameError}</p>
                        )}
                     </div>

                     <button
                        type="button"
                        onClick={handleSubmitName}
                        disabled={isLoading}
                        className="w-full h-14 bg-gradient-to-r from-[#001A94] to-[#0026D1] hover:from-[#00157A] hover:to-blue-700 text-white font-bold text-lg rounded-2xl transition-all shadow-[0_8px_25px_-5px_rgba(0,26,148,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(0,26,148,0.5)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                     >
                        {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Continue"}
                     </button>
                  </motion.div>
               )}
            </AnimatePresence>

            {error && (
               <div className="text-sm text-red-500 font-semibold text-center mt-2">
                  {error}
               </div>
            )}
            
            {isLoading && !showNameInput && !pendingMessage && (
               <div className="flex justify-center pt-4">
                  <Loader2 className="h-8 w-8 text-[#001A94] animate-spin" />
               </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center pt-6 pb-2">
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
