import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import { MapPin, Search, Save, Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import RestaurantNavbar from "@food/components/restaurant/RestaurantNavbar"
import { restaurantAPI } from "@food/api"
import { getGoogleMapsApiKey } from "@food/utils/googleMapsApiKey"
import { Loader } from "@googlemaps/js-api-loader"
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}

const parseCoordinate = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const getSavedLocationCoords = (location) => {
  if (!location) return null

  let lat = null
  let lng = null

  if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
    lng = parseCoordinate(location.coordinates[0])
    lat = parseCoordinate(location.coordinates[1])
  }

  if (lat === null || lng === null) {
    lat = parseCoordinate(location.latitude)
    lng = parseCoordinate(location.longitude)
  }

  if (lat === null || lng === null) return null

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    const swappedLat = lng
    const swappedLng = lat

    if (
      swappedLat >= -90 && swappedLat <= 90 &&
      swappedLng >= -180 && swappedLng <= 180
    ) {
      return { lat: swappedLat, lng: swappedLng }
    }

    return null
  }

  return { lat, lng }
}

export default function ZoneSetup() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const autocompleteInputRef = useRef(null)
  const autocompleteRef = useRef(null)
  const vertexMarkersRef = useRef([])
  const zonePolygonsRef = useRef([]) // Store actual polygon objects for detection
  
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("")
  const [mapLoading, setMapLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantData, setRestaurantData] = useState(null)
  const [locationSearch, setLocationSearch] = useState("")
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [selectedAddress, setSelectedAddress] = useState("")
  const [zones, setZones] = useState([])
  const [polygons, setPolygons] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)

  useEffect(() => {
    fetchRestaurantData()
    fetchZones()
    loadGoogleMaps()
  }, [])

  // Initialize Places Autocomplete when map is loaded
  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && autocompleteInputRef.current && window.google?.maps?.places && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInputRef.current, {
        componentRestrictions: { country: 'in' } // Restrict to India
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry && place.geometry.location && mapInstanceRef.current) {
          const location = place.geometry.location
          const lat = location.lat()
          const lng = location.lng()
          
          // Center map on selected location
          mapInstanceRef.current.setCenter(location)
          mapInstanceRef.current.setZoom(17) // Zoom in when location is selected
          
          // Set the search input value
          const address = place.formatted_address || place.name || ""
          setLocationSearch(address)
          setSelectedAddress(address)
          
          // Update marker position
          updateMarker(lat, lng, address)
          
          // Set selected location
          setSelectedLocation({ lat, lng, address })
        }
      })
      
      autocompleteRef.current = autocomplete
    }
  }, [mapLoading])

  // Load existing restaurant location when data is fetched, and detect its zone
  useEffect(() => {
    if (restaurantData?.location && mapInstanceRef.current && !mapLoading && window.google) {
      const location = restaurantData.location
      const savedCoords = getSavedLocationCoords(location)

      if (savedCoords) {
        const { lat, lng } = savedCoords
        const locationObj = new window.google.maps.LatLng(lat, lng)
        mapInstanceRef.current.setCenter(locationObj)
        mapInstanceRef.current.setZoom(17)
        
        const address = location.formattedAddress || location.address || formatAddress(location) || ""
        setLocationSearch(address)
        setSelectedAddress(address)
        setSelectedLocation({ lat, lng, address })
        updateMarker(lat, lng, address)

        // Detect and set the zone for the saved location so the warning is suppressed
        // for valid inside-zone coordinates loaded on page init / after save+reload.
        // We only do this when zones are already loaded (zones.length > 0).
        if (zones.length > 0) {
          const detectedZone = findZoneForLocation(lat, lng)
          setSelectedZone(detectedZone)
        }
      }
    }
  }, [restaurantData, mapLoading, zones])

  const fetchZones = async () => {
    try {
      const response = await restaurantAPI.getZones()
      const data = response?.data?.data?.zones || response?.data?.zones || []
      setZones(data)
    } catch (error) {
      debugError("Error fetching zones:", error)
    }
  }

  const fetchRestaurantData = async () => {
    try {
      const response = await restaurantAPI.getCurrentRestaurant()
      const data = response?.data?.data?.restaurant || response?.data?.restaurant
      if (data) {
        setRestaurantData(data)
      }
    } catch (error) {
      debugError("Error fetching restaurant data:", error)
    }
  }

  const loadGoogleMaps = async () => {
    try {
      // Fetch API key from database
      let apiKey = null
      try {
        apiKey = await getGoogleMapsApiKey()
        if (!apiKey || apiKey.trim() === "") {
          setMapLoading(false)
          alert("Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in frontend .env.")
          return
        }
      } catch (apiKeyError) {
        setMapLoading(false)
        alert("Failed to fetch Google Maps API key. Please check your connection or contact administrator.")
        return
      }

      setGoogleMapsApiKey(apiKey)

      // Always use the Loader — it is idempotent: if Maps is already loaded it
      // resolves immediately without re-loading the script. This eliminates the
      // race condition where window.google exists but window.google.maps is not
      // yet fully initialized on the first page visit.
      const loader = new Loader({
        apiKey: apiKey,
        version: "weekly",
        libraries: ["places", "geometry"]
      })

      const google = await loader.load()

      // Wait for the map container ref to be in the DOM
      let refRetries = 0
      while (!mapRef.current && refRetries < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        refRetries++
      }

      if (!mapRef.current) {
        setMapLoading(false)
        alert("Failed to initialize map container. Please refresh the page.")
        return
      }

      initializeMap(google)
    } catch (error) {
      setMapLoading(false)
      alert(`Failed to load Google Maps: ${error.message}. Please refresh the page.`)
    }
  }

  const initializeMap = (google) => {
    try {
      if (!mapRef.current) {
        debugError("? mapRef.current is null in initializeMap")
        setMapLoading(false)
        return
      }

      debugLog("?? Initializing map...")
      // Initial location (India center)
      const initialLocation = { lat: 20.5937, lng: 78.9629 }

      // Create map
      const map = new google.maps.Map(mapRef.current, {
        center: initialLocation,
        zoom: 5,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE]
        },
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        scrollwheel: true,
        gestureHandling: 'greedy',
        disableDoubleClickZoom: false,
      })

      mapInstanceRef.current = map
      debugLog("? Map initialized successfully")

      // Add click listener to place marker
      map.addListener('click', (event) => {
        const lat = event.latLng.lat()
        const lng = event.latLng.lng()
        handleLocationUpdate(lat, lng)
      })

      setMapLoading(false)
      debugLog("? Map loading complete")
    } catch (error) {
      debugError("? Error in initializeMap:", error)
      setMapLoading(false)
      alert("Failed to initialize map. Please refresh the page.")
    }
  }

  // Pure JS ray-casting point-in-polygon — works directly from zones state,
  // no dependency on Google Maps geometry library or polygon ref timing.
  const pointInPolygon = (lat, lng, polygonCoords) => {
    let inside = false
    const n = polygonCoords.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygonCoords[i].lat, yi = polygonCoords[i].lng
      const xj = polygonCoords[j].lat, yj = polygonCoords[j].lng
      const intersect = ((yi > lng) !== (yj > lng)) &&
        (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi)
      if (intersect) inside = !inside
    }
    return inside
  }

  const findZoneForLocation = (lat, lng) => {
    for (const zone of zones) {
      if (!zone.coordinates || zone.coordinates.length < 3) continue

      const polygonCoords = zone.coordinates
        .map(c => {
          const latVal = Number(c.latitude)
          const lngVal = Number(c.longitude)
          return (Number.isFinite(latVal) && Number.isFinite(lngVal))
            ? { lat: latVal, lng: lngVal }
            : null
        })
        .filter(Boolean)

      if (polygonCoords.length < 3) continue

      if (pointInPolygon(lat, lng, polygonCoords)) {
        return zone
      }
    }
    return null
  }

  const getAddressFromCoords = async (lat, lng) => {
    if (window.google?.maps?.Geocoder) {
      const geocoder = new window.google.maps.Geocoder()
      try {
        const response = await geocoder.geocode({ location: { lat, lng } })
        if (response.results && response.results[0]) {
          return response.results[0].formatted_address
        }
      } catch (error) {
        debugWarn("Geocoding failed:", error)
      }
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const handleLocationUpdate = async (lat, lng) => {
    // 1. Update with coordinates immediately for responsiveness
    const tempAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    const zone = findZoneForLocation(lat, lng)
    
    setLocationSearch(tempAddress)
    setSelectedAddress(tempAddress)
    setSelectedLocation({ lat, lng, address: tempAddress })
    setSelectedZone(zone)
    updateMarker(lat, lng, tempAddress)

    // 2. Fetch real address in background
    const address = await getAddressFromCoords(lat, lng)
    
    // 3. Update with real address if it's different
    if (address !== tempAddress) {
      setLocationSearch(address)
      setSelectedAddress(address)
      setSelectedLocation(prev => prev ? { ...prev, address } : { lat, lng, address })
      updateMarker(lat, lng, address)
    }

    // 4. Re-detect zone after address resolves — zones may have been empty on first click
    //    (API still loading). This prevents false "outside zone" warnings for valid locations.
    const confirmedZone = findZoneForLocation(lat, lng)
    setSelectedZone(confirmedZone)
  }

  // Render zones as polygons when zones or map is ready
  useEffect(() => {
    if (!mapLoading && mapInstanceRef.current && window.google && zones.length > 0) {
      // Clear existing polygons
      polygons.forEach(p => p.setMap(null))
      zonePolygonsRef.current = []
      
      // Clear existing vertex markers
      vertexMarkersRef.current.forEach(m => m.setMap(null))
      vertexMarkersRef.current = []
      
      const newVertexMarkers = []
      const newPolygons = zones.map(zone => {
        if (!zone.coordinates || zone.coordinates.length < 3) return null

        const polygonCoords = zone.coordinates.map(coord => ({
          lat: Number(coord.latitude),
          lng: Number(coord.longitude)
        }))

        // Create the polygon with purple theme
        const polygon = new window.google.maps.Polygon({
          paths: polygonCoords,
          strokeColor: "#9333EA", // Purple-600
          strokeOpacity: 0.9,
          strokeWeight: 3,
          fillColor: "#9333EA",
          fillOpacity: 0.35,
          map: mapInstanceRef.current,
          zIndex: 1,
          clickable: true // Enable clicking to handle it explicitly
        })

        // Store in ref for detection
        zonePolygonsRef.current.push({ zone, polygon })

        // Explicitly handle click on polygon to pinpoint
        polygon.addListener('click', (event) => {
          if (event.latLng) {
            handleLocationUpdate(event.latLng.lat(), event.latLng.lng())
          }
        })

        // Add markers at each vertex (corner)
        polygonCoords.forEach(coord => {
          const marker = new window.google.maps.Marker({
            position: coord,
            map: mapInstanceRef.current,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillColor: "#9333EA",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2
            },
            clickable: false,
            zIndex: 100
          })
          newVertexMarkers.push(marker)
        })

        return polygon
      }).filter(Boolean)
      
      vertexMarkersRef.current = newVertexMarkers
      setPolygons(newPolygons)
    }
  }, [zones, mapLoading])

  const updateMarker = (lat, lng, address) => {
    if (!mapInstanceRef.current || !window.google) return

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null)
    }

    // Create new marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: address || "Restaurant Location",
      zIndex: 1000 // Ensure marker is above polygons
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; max-width: 250px;">
          <strong>Restaurant Location</strong><br/>
          <small>${address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`}</small>
        </div>
      `
    })

    marker.addListener('click', () => {
      infoWindow.open(mapInstanceRef.current, marker)
    })

    // Update location when marker is dragged
    marker.addListener('dragend', (event) => {
      const newLat = event.latLng.lat()
      const newLng = event.latLng.lng()
      handleLocationUpdate(newLat, newLng)
    })

    markerRef.current = marker
  }

  const formatAddress = (location) => {
    if (!location) return ""
    
    if (location.formattedAddress && location.formattedAddress.trim() !== "") {
      return location.formattedAddress.trim()
    }
    
    if (location.address && location.address.trim() !== "") {
      return location.address.trim()
    }
    
    const parts = []
    if (location.addressLine1) parts.push(location.addressLine1.trim())
    if (location.addressLine2) parts.push(location.addressLine2.trim())
    if (location.area) parts.push(location.area.trim())
    if (location.city) parts.push(location.city.trim())
    if (location.state) parts.push(location.state.trim())
    if (location.zipCode || location.pincode) parts.push((location.zipCode || location.pincode).trim())
    
    return parts.length > 0 ? parts.join(", ") : ""
  }

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      alert("Please select a location on the map first")
      return
    }

    if (!selectedZone) {
      alert("Selected location is outside of all delivery zones. Please select a location inside a zone.")
      return
    }

    try {
      setSaving(true)
      
      const { lat, lng, address } = selectedLocation
      
      // Update restaurant location and zone
      const response = await restaurantAPI.updateProfile({
        zoneId: selectedZone?._id || restaurantData?.zoneId,
        location: {
          ...(restaurantData?.location || {}),
          latitude: lat,
          longitude: lng,
          coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
          formattedAddress: address
        }
      })

      if (response?.data?.data?.restaurant) {
        setRestaurantData(response.data.data.restaurant)
        alert("Location saved successfully!")
        
        // Refresh the page to update navbar
        window.location.reload()
      } else {
        throw new Error("Failed to save location")
      }
    } catch (error) {
      debugError("Error saving location:", error)
      alert(error.response?.data?.message || "Failed to save location. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNavbar />
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            {/* Back Button */}
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zone Setup</h1>
              <p className="text-sm text-gray-600">Set your restaurant location on the map</p>
            </div>
          </div>
        </div>

        {/* Pending Notifications */}
        {restaurantData?.pendingUpdate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-amber-800 font-semibold text-sm">Address Update Pending</h3>
              <p className="text-amber-700 text-sm">
                Your request to change address/zone is waiting for admin approval. 
                Your restaurant will continue to show at its <strong>current address</strong> until approved.
              </p>
            </div>
          </div>
        )}

        {restaurantData?.status === 'pending' && !restaurantData?.pendingUpdate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
            <div>
              <h3 className="text-blue-800 font-semibold text-sm">Registration Pending</h3>
              <p className="text-blue-700 text-sm">
                Your restaurant registration is currently under review by our team.
              </p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={autocompleteInputRef}
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search for your restaurant location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSaveLocation}
              disabled={!selectedLocation || !selectedZone || saving}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Location</span>
                </>
              )}
            </button>
          </div>
          {selectedLocation && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Selected Location:</strong> {selectedAddress}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
              {selectedZone ? (
                <p className="text-sm text-purple-700 mt-2 font-semibold">
                  Detected Zone: {selectedZone.name || selectedZone.zoneName}
                </p>
              ) : (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-red-700 text-sm font-semibold">
                  Warning: This location is outside all delivery zones. You cannot save this location.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">How to set your location:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Search for your location using the search bar above, or</li>
            <li>Click anywhere on the map to place a pin at that location</li>
            <li>You can drag the pin to adjust the exact position</li>
            <li><strong>Delivery Zone:</strong> The system will automatically detect which zone you are in</li>
            <li>Click "Save Location" to save your restaurant location and assigned zone</li>
          </ul>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
          {/* Always render the map div, show loading overlay on top */}
          <div ref={mapRef} className="w-full h-[600px]" style={{ minHeight: '600px' }} />
          {mapLoading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading map...</p>
                <p className="text-xs text-gray-400 mt-2">If this takes too long, please refresh the page</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

