import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Navigation, Search } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@food/components/ui/card"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { useLocation } from "@food/hooks/useLocation"
import { useProfile } from "@food/context/ProfileContext"
import { toast } from "sonner"

const DEFAULT_LABEL = "Home"

export default function LocationPrompt() {
  const navigate = useNavigate()
  const { location, loading, permissionGranted, requestLocation } = useLocation()
  const { addAddress, setDefaultAddress } = useProfile()
  const [showPrompt, setShowPrompt] = useState(false)
  const cardRef = useRef(null)
  const [manualMode, setManualMode] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    additionalDetails: "",
    label: DEFAULT_LABEL,
  })
  const [coords, setCoords] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Check if location permission was already granted
    const storedLocation = localStorage.getItem("userLocation")
    const promptDismissed = localStorage.getItem("locationPromptDismissed")

    // The useLocation hook will automatically try to get location on app start
    // We only show the prompt if:
    // 1. No location is stored (first time user)
    // 2. Prompt hasn't been dismissed
    // 3. Location permission was denied (we'll detect this after a delay)
    
    if (!storedLocation && !promptDismissed) {
      // Wait a bit to let the hook try to get location automatically
      // If it fails, we'll show the prompt
      const timer = setTimeout(() => {
        // Check again if location was set (hook might have succeeded)
        const currentLocation = localStorage.getItem("userLocation")
        if (!currentLocation && !permissionGranted) {
          setShowPrompt(true)
          // Prevent body scroll when popup is open
          document.body.style.overflow = "hidden"
          // CSS animation will handle the fade-in
          if (cardRef.current) {
            cardRef.current.style.opacity = '0'
            cardRef.current.style.transform = 'translateY(20px)'
            requestAnimationFrame(() => {
              if (cardRef.current) {
                cardRef.current.style.opacity = '1'
                cardRef.current.style.transform = 'translateY(0)'
              }
            })
          }
        }
      }, 2000) // Wait 2 seconds for automatic location request to complete

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ""
      }
    }
  }, [permissionGranted])

  // Close prompt when location is successfully obtained
  useEffect(() => {
    if (location && showPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(false)
        document.body.style.overflow = ""
        localStorage.setItem("locationPromptDismissed", "true")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [location, showPrompt])

  const handleAllow = async () => {
    await requestLocation()
    // Wait a bit for location to be set
    setTimeout(() => {
      setShowPrompt(false)
      document.body.style.overflow = ""
      localStorage.setItem("locationPromptDismissed", "true")
    }, 500)
  }

  const handleManualEntry = () => {
    setManualMode(true)
  }

  const handleDetectManual = async () => {
    try {
      toast.loading("Detecting location...", { id: "manual-geo" })
      const loc = await requestLocation(true, true)
      if (!loc?.latitude || !loc?.longitude) {
        toast.error("Unable to detect location", { id: "manual-geo" })
        return
      }
      setCoords({ lat: loc.latitude, lng: loc.longitude })
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${loc.latitude}&lon=${loc.longitude}`
      const res = await fetch(url, { headers: { Accept: "application/json" } })
      const json = await res.json()
      const addr = json?.address || {}
      const street = [addr.road, addr.suburb, addr.neighbourhood, addr.house_number].filter(Boolean).slice(0, 2).join(", ")
      const city = addr.city || addr.town || addr.village || addr.county || ""
      const state = addr.state || ""
      const zipCode = addr.postcode || ""
      setAddressForm((prev) => ({
        ...prev,
        street: street || prev.street,
        city: city || prev.city,
        state: state || prev.state,
        zipCode: zipCode || prev.zipCode,
        additionalDetails: json?.display_name || prev.additionalDetails,
      }))
      setSearchValue(json?.display_name || "")
      toast.success("Location detected", { id: "manual-geo" })
    } catch (_) {
      toast.error("Failed to detect location", { id: "manual-geo" })
    }
  }

  const handleSaveManual = async () => {
    if (!addressForm.street || !addressForm.city || !coords?.lat || !coords?.lng) {
      toast.error("Please select a location and fill street + city")
      return
    }
    const payload = {
      ...addressForm,
      label: addressForm.label === "Work" ? "Office" : addressForm.label,
      location: { type: "Point", coordinates: [coords.lng, coords.lat] },
      latitude: coords.lat,
      longitude: coords.lng,
    }
    const accessToken = localStorage.getItem("user_accessToken")
    const isAuthenticated = !!(accessToken && String(accessToken).trim())
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingUserAddressSave", JSON.stringify(payload))
      navigate(`/food/user/auth/login?redirect=${encodeURIComponent("/food/user")}`)
      return
    }
    try {
      setSaving(true)
      const created = await addAddress(payload)
      const id = created?.id || created?._id
      if (id) {
        await setDefaultAddress(id)
        localStorage.setItem("deliveryAddressMode", "saved")
      }
      localStorage.setItem("locationPromptDismissed", "true")
      setShowPrompt(false)
      document.body.style.overflow = ""
      toast.success("Address saved")
    } catch (_) {
      toast.error("Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  const addressSuggestions = useMemo(() => suggestions, [suggestions])

    useEffect(() => {
      if (!manualMode) return
      const q = String(searchValue || "").trim()
      if (q.length < 3) {
        setSuggestions([])
        setIsSearching(false)
        return
      }
      const t = setTimeout(async () => {
        try {
          setIsSearching(true)
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(q)}`
          const res = await fetch(url, { headers: { Accept: "application/json" } })
          const json = await res.json()
          const list = Array.isArray(json) ? json : []
          const mapped = list.map((r) => ({
            id: r.place_id || r.osm_id || `${r.lat},${r.lon}`,
            display: r.display_name || "",
            lat: Number(r.lat),
            lng: Number(r.lon),
            address: r.address || {},
          }))
          setSuggestions(mapped.slice(0, 4))
        } catch (_) {
          setSuggestions([])
        } finally {
          setIsSearching(false)
        }
      }, 350)
      return () => clearTimeout(t)
    }, [manualMode, searchValue])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Card
        ref={cardRef}
        className="w-full max-w-md border-2 border-gray-200 shadow-2xl mx-auto my-auto"
      >
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="h-6 w-6 text-primary-orange" />
            </div>
            <div>
              <CardTitle>Enable Location Services</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Get faster delivery and better recommendations
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We use your location to show nearby restaurants and provide accurate
            delivery times. Your location data is stored locally and never
            shared.
          </p>

          {!manualMode ? (
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleAllow}
                className="w-full bg-primary-orange hover:opacity-90 text-white"
                disabled={loading}
              >
                {loading ? "Getting location..." : "Allow Location"}
              </Button>
              <Button
                onClick={handleManualEntry}
                variant="ghost"
                className="w-full"
              >
                Enter Manually
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search area, street, landmark..."
                  className="pl-9"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#001A94] border-t-transparent" />
                  </div>
                )}
                {addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30">
                    {addressSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setCoords({ lat: s.lat, lng: s.lng })
                          const a = s.address || {}
                          const city = a.city || a.town || a.village || a.county || ""
                          const state = a.state || ""
                          const zipCode = a.postcode || ""
                          setAddressForm((prev) => ({
                            ...prev,
                            street: s.display || prev.street,
                            city: city || prev.city,
                            state: state || prev.state,
                            zipCode: zipCode || prev.zipCode,
                            additionalDetails: s.display || prev.additionalDetails,
                          }))
                          setSearchValue(s.display)
                          setSuggestions([])
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none"
                      >
                        <p className="text-sm font-semibold text-gray-900 truncate">{s.display}</p>
                        <p className="text-xs text-gray-500 truncate">{s.address?.city || s.address?.state}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Input
                placeholder="Street / Area"
                value={addressForm.street}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, street: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))}
                />
                <Input
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Pincode"
                value={addressForm.zipCode}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, zipCode: e.target.value }))}
              />

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleDetectManual}
                  variant="outline"
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Detect Location
                </Button>
                <Button
                  onClick={handleSaveManual}
                  className="w-full bg-primary-orange hover:opacity-90 text-white"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Address"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

