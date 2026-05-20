import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { useEffect, useState, createContext, useContext } from "react"
import { Loader2 } from "lucide-react"
import { usePaymentRecovery } from "../../hooks/usePaymentRecovery"
import { ProfileProvider } from "@food/context/ProfileContext"
// import LocationPrompt from "./LocationPrompt"
import { CartProvider } from "@food/context/CartContext"
import { OrdersProvider } from "@food/context/OrdersContext"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

import SearchOverlay from "./SearchOverlay"
import BottomNavigation from "./BottomNavigation"
import DesktopNavbar from "./DesktopNavbar"
import { useUserNotifications } from "../../hooks/useUserNotifications"

// Create SearchOverlay context with default value
const SearchOverlayContext = createContext({
  isSearchOpen: false,
  searchValue: "",
  setSearchValue: () => {
    debugWarn("SearchOverlayProvider not available")
  },
  openSearch: () => {
    debugWarn("SearchOverlayProvider not available")
  },
  closeSearch: () => { }
})

export function useSearchOverlay() {
  const context = useContext(SearchOverlayContext)
  // Always return context, even if provider is not available (will use default values)
  return context
}

function SearchOverlayProvider({ children }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const openSearch = () => {
    setIsSearchOpen(true)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchValue("")
  }

  return (
    <SearchOverlayContext.Provider value={{ isSearchOpen, searchValue, setSearchValue, openSearch, closeSearch }}>
      {children}
      {isSearchOpen && (
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={closeSearch}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
      )}
    </SearchOverlayContext.Provider>
  )
}

// Create LocationSelector context with default value
const LocationSelectorContext = createContext({
  isLocationSelectorOpen: false,
  openLocationSelector: () => {
    debugWarn("LocationSelectorProvider not available")
  },
  closeLocationSelector: () => { }
})

export function useLocationSelector() {
  const context = useContext(LocationSelectorContext)
  if (!context) {
    throw new Error("useLocationSelector must be used within LocationSelectorProvider")
  }
  return context
}

function LocationSelectorProvider({ children }) {
  const navigate = useNavigate()

  const openLocationSelector = () => {
    // Navigate to the standalone address selector page
    navigate("/food/user/address-selector")
  }

  const closeLocationSelector = () => { }

  const value = {
    isLocationSelectorOpen: false,
    openLocationSelector,
    closeLocationSelector
  }

  return (
    <LocationSelectorContext.Provider value={value}>
      {children}
    </LocationSelectorContext.Provider>
  )
}

export default function UserLayout() {
  const location = useLocation()
  const [hasAnyActiveZone, setHasAnyActiveZone] = useState(() => {
    try {
      return Boolean(localStorage.getItem("userZoneId"))
    } catch {
      return false
    }
  })
  const [hideHomeBottomNavOutOfZone, setHideHomeBottomNavOutOfZone] = useState(() => {
    try {
      return localStorage.getItem("hideUserBottomNavOutOfZone") === "true"
    } catch {
      return false
    }
  })

  useEffect(() => {
    // Reset scroll to top whenever location changes (pathname, search, or hash)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname, location.search, location.hash])

  useUserNotifications()

  useEffect(() => {
    const syncBottomNavVisibility = () => {
      try {
        setHideHomeBottomNavOutOfZone(localStorage.getItem("hideUserBottomNavOutOfZone") === "true")
        setHasAnyActiveZone(Boolean(localStorage.getItem("userZoneId")))
      } catch {
        setHideHomeBottomNavOutOfZone(false)
        setHasAnyActiveZone(false)
      }
    }
    syncBottomNavVisibility()
    window.addEventListener("storage", syncBottomNavVisibility)
    window.addEventListener("zoneVisibilityChanged", syncBottomNavVisibility)
    window.addEventListener("locationUpdated", syncBottomNavVisibility)
    return () => {
      window.removeEventListener("storage", syncBottomNavVisibility)
      window.removeEventListener("zoneVisibilityChanged", syncBottomNavVisibility)
      window.removeEventListener("locationUpdated", syncBottomNavVisibility)
    }
  }, [])

  // Note: Authentication checks and redirects are handled by ProtectedRoute components
  // UserLayout should not interfere with authentication redirects

  // Show bottom navigation only on home page, dining page, under-250 page, and profile page
  const path = location.pathname.startsWith("/food")
    ? location.pathname.substring(5) || "/"
    : location.pathname
  const normalizedPath =
    path.length > 1 ? path.replace(/\/+$/, "") : path

  const isProfileRoot =
    normalizedPath === "/profile" ||
    normalizedPath === "/user/profile"
  const isHomeRoot =
    normalizedPath === "/" ||
    normalizedPath === "/user" ||
    normalizedPath === ""

  const showBottomNav = (normalizedPath === "/" ||
    normalizedPath === "/user" ||
    normalizedPath === "/dining" ||
    normalizedPath === "/user/dining" ||
    normalizedPath === "/under-250" ||
    normalizedPath === "/user/under-250" ||
    normalizedPath === "/home-kitchens" ||
    normalizedPath === "/user/home-kitchens" ||
    isProfileRoot ||
    normalizedPath === "") &&
    hasAnyActiveZone &&
    !(isHomeRoot && hideHomeBottomNavOutOfZone) // Handle empty string case for root relative to /food

  const isUnder250 = normalizedPath === "/under-250" || normalizedPath === "/user/under-250"

  const { isVerifying } = usePaymentRecovery()

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a] transition-colors duration-200">
      {/* Payment Recovery Overlay */}
      {isVerifying && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-[80%] border border-blue-50 dark:border-blue-900/30">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-[#001A94] animate-spin" />
              <div className="absolute inset-0 blur-xl bg-[#001A94]/20 animate-pulse rounded-full"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verifying Payment</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait while we check your recent transaction status...</p>
            </div>
          </div>
        </div>
      )}
      <CartProvider>
        <ProfileProvider>
          <OrdersProvider>
            <SearchOverlayProvider>
              <LocationSelectorProvider>
                {/* <Navbar /> */}
                {/* Desktop Navbar - Hidden on mobile, visible on medium+ screens */}
                <div className="hidden md:block">
                  {showBottomNav && <DesktopNavbar showLogo={!isUnder250} />}
                </div>
                {/* <LocationPrompt /> */}
                <main className={showBottomNav ? "md:pt-40" : ""}>
                  <Outlet />
                </main>
                {showBottomNav && <BottomNavigation />}
              </LocationSelectorProvider>
            </SearchOverlayProvider>
          </OrdersProvider>
        </ProfileProvider>
      </CartProvider>
    </div>
  )
}


