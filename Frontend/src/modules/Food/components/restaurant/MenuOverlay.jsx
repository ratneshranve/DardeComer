import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { 
  User,
  Utensils,
  Megaphone,
  Settings,
  Monitor,
  Plus,
  Grid3x3,
  Tag,
  FileText,
  MessageSquare,
  Shield,
  Globe,
  MessageCircle,
  CheckSquare,
  LogOut,
  LogIn,
  Trash2,
  UserPlus
} from "lucide-react"
import { restaurantAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { toast } from "sonner"

export default function MenuOverlay({ showMenu, setShowMenu }) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("restaurant_authenticated") === "true"
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // Listen for authentication state changes
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(localStorage.getItem("restaurant_authenticated") === "true")
    }

    // Check on mount
    checkAuth()

    // Listen for storage changes
    window.addEventListener('storage', checkAuth)
    
    // Custom event for same-tab updates
    window.addEventListener('restaurantAuthChanged', checkAuth)

    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('restaurantAuthChanged', checkAuth)
    }
  }, [])

  // Get menu options based on authentication state
  const getMenuOptions = () => {
    const baseOptions = [
      { id: 4, name: "All Food", icon: Utensils, route: "/restaurant/food/all" },

      { id: 7, name: "Advertisements", icon: Monitor, route: "/restaurant/advertisements" },
      { id: 9, name: "Categories", icon: Grid3x3, route: "/restaurant/categories" },
      { id: 10, name: "Coupon", icon: Tag, route: "/restaurant/coupon" },
      { id: 11, name: "My Business Plan", icon: FileText, route: "/restaurant/business-plan" },
      { id: 12, name: "Reviews", icon: MessageSquare, route: "/restaurant/reviews" },
      { id: 14, name: "Wallet Method", icon: Settings, route: "/restaurant/wallet" },
      { id: 16, name: "Settings", icon: Settings, route: "/restaurant/settings" },
      { id: 17, name: "Conversation", icon: MessageCircle, route: "/restaurant/conversation" },
      { id: 18, name: "Privacy Policy", icon: Shield, route: "/restaurant/privacy" },
      { id: 19, name: "Terms & Condition", icon: CheckSquare, route: "/restaurant/terms" },
    ]

    if (isAuthenticated) {
      // If authenticated, show logout at the end
      return [
        ...baseOptions,
        { id: 20, name: "Logout", icon: LogOut, route: "/logout", isLogout: true },
        { id: 21, name: "Delete Account", icon: Trash2, route: "/delete-account", isDeleteAccount: true },
      ]
    } else {
      // If not authenticated, show only login at the top
      return [
        { id: 1, name: "Login", icon: LogIn, route: "/restaurant/login" },
        ...baseOptions
      ]
    }
  }

  const menuOptions = getMenuOptions()

  const handleRestaurantLogout = async () => {
    try {
      let fcmToken = null
      let platform = "web"
      try {
        if (typeof window !== "undefined" && window.flutter_inappwebview) {
          platform = "mobile"
          const handlerNames = [
            "getFcmToken",
            "getFCMToken",
            "getPushToken",
            "getFirebaseToken",
          ]
          for (const handlerName of handlerNames) {
            try {
              const t = await window.flutter_inappwebview.callHandler(handlerName, {
                module: "restaurant",
              })
              if (t && typeof t === "string" && t.length > 20) {
                fcmToken = t.trim()
                break
              }
            } catch (e) {}
          }
        } else {
          fcmToken = localStorage.getItem("fcm_web_registered_token_restaurant") || null
        }
      } catch (e) {}
      await restaurantAPI.logout(null, fcmToken, platform)
    } catch (_) {}
    clearModuleAuth("restaurant")
    setIsAuthenticated(false)
    window.dispatchEvent(new Event("restaurantAuthChanged"))
    localStorage.removeItem("fcm_web_registered_token_restaurant")
    toast.success("Logged out successfully")
    navigate("/restaurant/login", { replace: true })
  }

  const handleRestaurantDeleteAccount = async () => {
    if (isDeleting) return
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)
    try {
      await restaurantAPI.deleteAccount()
      clearModuleAuth("restaurant")
      setIsAuthenticated(false)
      window.dispatchEvent(new Event("restaurantAuthChanged"))
      toast.success("Account deleted successfully")
      navigate("/restaurant/login", { replace: true })
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete account")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setShowMenu(false)
    }
  }

  return (
    <>
      <AnimatePresence mode="wait">
      {showMenu && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setShowMenu(false)}
            className="fixed inset-0 bg-primary/40 z-[100] backdrop-blur-sm"
          />
          
          {/* Menu Sheet - Full bottom slide */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              mass: 0.8
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-[110] max-h-[90vh] overflow-hidden"
          >
            {/* Drag Handle */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="flex justify-center pt-3 pb-3"
            >
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </motion.div>

            {/* Menu Grid - Improved Layout */}
            <div className="px-4 pb-20 md:pb-6 pt-2 overflow-y-auto max-h-[calc(90vh-60px)] scrollbar-hide scroll-smooth">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="grid grid-cols-3 gap-3 md:gap-4"
              >
                {menuOptions.map((option, index) => {
                  const IconComponent = option.icon
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: 0.2 + (index * 0.02),
                        type: "spring",
                        stiffness: 200,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setShowMenu(false)
                        if (option.isLogout) {
                          // Handle logout
                          if (window.confirm("Are you sure you want to logout?")) {
                            handleRestaurantLogout()
                          }
                        } else if (option.isDeleteAccount) {
                          // Handle delete account
                          setDeleteConfirmationText("")
                          setShowDeleteConfirm(true)
                        } else {
                          navigate(option.route)
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl transition-all shadow-md hover:shadow-lg ${
                        option.isLogout || option.isDeleteAccount
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-gradient-to-br from-[#ff8100] to-[#ff9500] hover:from-[#e67300] hover:to-[#e68500] text-white"
                      }`}
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: 0.25 + (index * 0.02),
                          type: "spring",
                          stiffness: 200,
                          damping: 15
                        }}
                        className="flex items-center justify-center"
                      >
                        <IconComponent className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0" />
                      </motion.div>
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 + (index * 0.02), duration: 0.2 }}
                        className="text-[10px] md:text-[11px] font-semibold text-white text-center leading-tight px-1"
                        style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {option.name}
                      </motion.span>
                    </motion.button>
                  )
                })}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* Delete Account Confirmation Dialog */}
    <AnimatePresence>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Account?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block">
                    Type <span className="text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestaurantDeleteAccount}
                    disabled={isDeleting || deleteConfirmationText !== "DELETE"}
                    className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                  >
                    {isDeleting ? "Deleting..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </>
  )
}

