import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import { 
  ArrowLeft,
  User,
  Bell,
  Shield,
  Globe,
  Info,
  LogOut,
  Trash2,
  Lock,
  Mail,
  Phone,
  CreditCard,
  FileText,
  MessageSquare,
  ChevronRight
} from "lucide-react"
import { Card, CardContent } from "@food/components/ui/card"
import BottomNavbar from "@food/components/restaurant/BottomNavbar"
import MenuOverlay from "@food/components/restaurant/MenuOverlay"
import { restaurantAPI } from "@food/api"
import { clearModuleAuth } from "@food/utils/auth"
import { toast } from "sonner"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}


export default function SettingsPage() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const [showMenu, setShowMenu] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [actionSubmitting, setActionSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("")

  // Lenis smooth scrolling
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

    return () => {
      lenis.destroy()
    }
  }, [])

  const handleRestaurantLogout = async () => {
    if (actionSubmitting) return
    setActionSubmitting(true)
    try {
      await restaurantAPI.logout()
    } catch (_) {}
    clearModuleAuth("restaurant")
    window.dispatchEvent(new Event("restaurantAuthChanged"))
    toast.success("Logged out successfully")
    navigate("/restaurant/login", { replace: true })
    setActionSubmitting(false)
  }

  const handleRestaurantDeleteAccount = async () => {
    if (actionSubmitting) return
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setActionSubmitting(true)
    try {
      await restaurantAPI.deleteAccount()
      clearModuleAuth("restaurant")
      window.dispatchEvent(new Event("restaurantAuthChanged"))
      toast.success("Account deleted successfully")
      navigate("/restaurant/login", { replace: true })
    } catch (error) {
      const msg = error?.response?.data?.message || "Failed to delete account"
      toast.error(msg, {
        description: msg.includes("complete your orders") ? "Please deliver or cancel all active orders first." : undefined
      })
    } finally {
      setActionSubmitting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Settings sections
  const settingsSections = [
    {
      id: "account",
      title: "Account",
      items: [
        { id: "notifications", label: "Notifications", icon: Bell, hasToggle: true, toggleValue: notificationsEnabled, onToggle: setNotificationsEnabled },
        { id: "privacy", label: "Privacy & Security", icon: Shield, route: "/restaurant/privacy" },
      ]
    },
    {
      id: "preferences",
      title: "Preferences",
      items: [
        { id: "language", label: "Language", icon: Globe, route: "/restaurant/language", value: "English" },
      ]
    },
    {
      id: "support",
      title: "Support & Information",
      items: [
        { id: "conversation", label: "Conversation", icon: MessageSquare, route: "/restaurant/conversation" },
        { id: "terms", label: "Terms & Conditions", icon: FileText, route: "/restaurant/terms" },
        { id: "privacy-policy", label: "Privacy Policy", icon: Shield, route: "/restaurant/privacy" },
        { id: "about", label: "About", icon: Info, route: "/restaurant/about" },
      ]
    },
    {
      id: "actions",
      title: "Actions",
      items: [
        { id: "logout", label: "Logout", icon: LogOut, isDestructive: true, action: () => {
          handleRestaurantLogout()
        } },
        { id: "delete_account", label: "Delete Account", icon: Trash2, isDestructive: true, action: () => {
          setDeleteConfirmationText("")
          setShowDeleteConfirm(true)
        } },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#f6e9dc] overflow-x-hidden pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center gap-3">
        <button 
          onClick={goBack}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Settings</h1>
      </div>

      {/* Settings Content */}
      <div className="px-4 py-4 space-y-4">
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: sectionIndex * 0.1 }}
          >
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-0">
                {/* Section Title */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    {section.title}
                  </h2>
                </div>

                {/* Section Items */}
                <div className="divide-y divide-gray-100">
                  {section.items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: sectionIndex * 0.1 + itemIndex * 0.05 }}
                    >
                      <button
                        onClick={() => {
                          if (item.action) {
                            item.action()
                          } else if (item.route) {
                            navigate(item.route)
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors ${
                          item.isDestructive ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex-shrink-0 p-1.5 rounded-lg ${
                            item.isDestructive 
                              ? "bg-red-100" 
                              : "bg-[#ff8100]/10"
                          }`}>
                            <item.icon className={`w-4 h-4 ${
                              item.isDestructive 
                                ? "text-red-600" 
                                : "text-[#ff8100]"
                            }`} />
                          </div>
                          <span className="text-sm font-medium flex-1 text-left">
                            {item.label}
                          </span>
                          {item.value && (
                            <span className="text-xs text-gray-500 mr-2">
                              {item.value}
                            </span>
                          )}
                        </div>

                        {item.hasToggle ? (
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.onToggle) {
                                  item.onToggle(!item.toggleValue)
                                }
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                item.toggleValue ? "bg-[#ff8100]" : "bg-gray-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  item.toggleValue ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                        ) : (
                          !item.isDestructive && (
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Bottom Navigation Bar */}
      <BottomNavbar onMenuClick={() => setShowMenu(true)} />
      
      {/* Menu Overlay */}
      <MenuOverlay showMenu={showMenu} setShowMenu={setShowMenu} />

      {/* Delete Account Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              onClick={() => {
                if (!actionSubmitting) setShowDeleteConfirm(false)
              }}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none"
            >
              <div 
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Delete Account?</h3>
                  <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 mb-6">
                    <p className="text-sm font-semibold text-red-700 text-center leading-tight">
                      Warning: All your earnings, wallet balance, and restaurant data will be permanently lost.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 block text-center">
                        Type <span className="text-red-600">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value.toUpperCase())}
                        placeholder="DELETE"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={actionSubmitting}
                        className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRestaurantDeleteAccount}
                        disabled={actionSubmitting || deleteConfirmationText !== "DELETE"}
                        className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                      >
                        {actionSubmitting ? "Deleting..." : "Confirm"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}


