import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Home, ShoppingBag, Store, Wallet, Menu } from "lucide-react"

export default function BottomNavbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()

  // State to track if keyboard is open
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const viewport = window.visualViewport
    
    const handleResize = () => {
      if (viewport) {
        const isVisible = window.innerHeight - viewport.height > 150
        setKeyboardOpen(isVisible)
      }
    }

    const handleFocusIn = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setKeyboardOpen(true)
      }
    }

    const handleFocusOut = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        setTimeout(() => {
          if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            setKeyboardOpen(false)
          }
        }, 100)
      }
    }

    if (viewport) viewport.addEventListener("resize", handleResize)
    window.addEventListener("focusin", handleFocusIn)
    window.addEventListener("focusout", handleFocusOut)

    return () => {
      if (viewport) viewport.removeEventListener("resize", handleResize)
      window.removeEventListener("focusin", handleFocusIn)
      window.removeEventListener("focusout", handleFocusOut)
    }
  }, [])

  const isActive = (path) => {
    if (path === "/restaurant") {
      return location.pathname === "/restaurant"
    }
    return location.pathname.startsWith(path)
  }

  if (keyboardOpen) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around py-2 px-4">
        <button
          onClick={() => navigate("/restaurant")}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            isActive("/restaurant") ? "text-[#ff8100]" : "text-gray-600"
          }`}
        >
          <Home className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigate("/restaurant/orders/all")}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            isActive("/restaurant/orders/all") ? "text-[#ff8100]" : "text-gray-600"
          }`}
        >
          <ShoppingBag className="w-6 h-6" />
        </button>
        <button
          onClick={() => navigate("/restaurant/details")}
          className={`flex flex-col items-center gap-1 p-2 -mt-8 transition-colors ${
            isActive("/restaurant/details") ? "text-[#ff8100]" : "text-gray-600"
          }`}
        >
          <div
            className={`rounded-full p-3 shadow-lg border-2 transition-colors ${
              isActive("/restaurant/details")
                ? "bg-[#ff8100] border-white"
                : "bg-white border-gray-200"
            }`}
          >
            <Store
              className={`w-6 h-6 ${
                isActive("/restaurant/details") ? "text-white" : "text-gray-600"
              }`}
            />
          </div>
        </button>
        <button
          onClick={() => navigate("/restaurant/wallet")}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            isActive("/restaurant/wallet") ? "text-[#ff8100]" : "text-gray-600"
          }`}
        >
          <Wallet className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            // Always call onMenuClick if provided, never navigate
            if (onMenuClick && typeof onMenuClick === 'function') {
              onMenuClick(e)
              return
            }
            // Fallback: only navigate if onMenuClick is not provided
            navigate("/restaurant/food/all")
          }}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            isActive("/restaurant/food/all") ? "text-[#ff8100]" : "text-gray-600"
          }`}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

