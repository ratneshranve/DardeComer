import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import useRestaurantBackNavigation from "@food/hooks/useRestaurantBackNavigation"
import Lenis from "lenis"
import {
  ArrowLeft,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@food/components/ui/button"
import { Input } from "@food/components/ui/input"
import { restaurantAPI, uploadAPI } from "@food/api"
import { ImageSourcePicker } from "@food/components/ImageSourcePicker"
import { isFlutterBridgeAvailable } from "@food/utils/imageUploadUtils"
import { toast } from "sonner"

const debugError = (...args) => {}

const GST_NUMBER_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export default function EditGst() {
  const navigate = useNavigate()
  const goBack = useRestaurantBackNavigation()
  
  const [gstData, setGstData] = useState({
    gstRegistered: false,
    gstNumber: "",
    gstLegalName: "",
    gstAddress: "",
    gstImage: null
  })
  
  const [formData, setFormData] = useState({
    gstRegistered: false,
    gstNumber: "",
    gstLegalName: "",
    gstAddress: "",
    gstImage: null
  })
  
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gstImageFile, setGstImageFile] = useState(null)
  const fileInputRef = useRef(null)
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false)

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

  // Fetch restaurant data on mount
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true)
        const response = await restaurantAPI.getCurrentRestaurant()
        const data = response?.data?.data?.restaurant || response?.data?.restaurant
        if (data) {
          const initialData = {
            gstRegistered: data.gstRegistered || false,
            gstNumber: data.gstNumber || "",
            gstLegalName: data.gstLegalName || "",
            gstAddress: data.gstAddress || "",
            gstImage: data.gstImage?.url || data.gstImage || null
          }
          setGstData(initialData)
          setFormData(initialData)
        }
      } catch (error) {
        debugError("Error fetching restaurant data:", error)
        toast.error("Failed to load GST details")
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [])

  // Check for changes
  useEffect(() => {
    const changed = 
      formData.gstRegistered !== gstData.gstRegistered ||
      formData.gstNumber !== gstData.gstNumber ||
      formData.gstLegalName !== gstData.gstLegalName ||
      formData.gstAddress !== gstData.gstAddress ||
      gstImageFile !== null
    setHasChanges(changed)
  }, [formData, gstData, gstImageFile])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhotoClick = () => {
    if (isFlutterBridgeAvailable()) {
      setIsPhotoPickerOpen(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handlePhotoSelect = (file) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size too large. Max 5MB allowed.")
        return
      }
      setGstImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const photoData = e.target?.result
        setFormData(prev => ({
          ...prev,
          gstImage: photoData
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    handlePhotoSelect(file)
  }

  const handleSave = async () => {
    // Validation
    if (formData.gstRegistered) {
      if (!formData.gstNumber?.trim()) {
        toast.error("GST number is required")
        return
      }
      if (!GST_NUMBER_REGEX.test(formData.gstNumber.trim().toUpperCase())) {
        toast.error("Invalid GST number format")
        return
      }
      if (!formData.gstLegalName?.trim()) {
        toast.error("Legal name is required")
        return
      }
    }

    try {
      setSaving(true)

      let gstImageUrl = formData.gstImage
      if (gstImageFile) {
        try {
          const imageResponse = await uploadAPI.uploadMedia(gstImageFile, { folder: "food/restaurants/gst" })
          const imageData = imageResponse?.data?.data?.image || imageResponse?.data?.image || imageResponse?.data
          if (imageData?.url) {
            gstImageUrl = imageData.url
          } else if (typeof imageData === 'string') {
            gstImageUrl = imageData
          }
        } catch (error) {
          debugError("Error uploading GST image:", error)
          toast.error("Failed to upload GST document. Please try again.")
          setSaving(false)
          return
        }
      }

      const updatePayload = {
        gstRegistered: formData.gstRegistered,
        gstNumber: formData.gstRegistered ? formData.gstNumber.trim().toUpperCase() : "",
        gstLegalName: formData.gstRegistered ? formData.gstLegalName.trim() : "",
        gstAddress: formData.gstRegistered ? formData.gstAddress.trim() : "",
        gstImage: formData.gstRegistered ? gstImageUrl : ""
      }

      const response = await restaurantAPI.updateProfile(updatePayload)
      
      if (response?.data?.success) {
        toast.success("GST details updated successfully")
        window.dispatchEvent(new Event("gstDataUpdated"))
        goBack()
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      debugError("Error saving GST data:", error)
      toast.error(error.response?.data?.message || "Failed to save GST details")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white px-4 py-4 flex items-center gap-3 border-b border-slate-200">
        <button
          onClick={goBack}
          className="p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">GST Details</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6 pb-32">
          {/* Registration Status */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Registration Status</h2>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleInputChange("gstRegistered", true)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                  formData.gstRegistered 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                Registered
              </button>
              <button
                onClick={() => handleInputChange("gstRegistered", false)}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                  !formData.gstRegistered 
                    ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                Not Registered
              </button>
            </div>
          </div>

          {formData.gstRegistered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* GST Info Fields */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">GST Number</label>
                  <Input
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange("gstNumber", e.target.value.toUpperCase())}
                    placeholder="27AAAAA0000A1Z5"
                    className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-600 rounded-xl font-semibold uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Legal Name</label>
                  <Input
                    value={formData.gstLegalName}
                    onChange={(e) => handleInputChange("gstLegalName", e.target.value)}
                    placeholder="Enter legal business name"
                    className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-600 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Address</label>
                  <textarea
                    value={formData.gstAddress}
                    onChange={(e) => handleInputChange("gstAddress", e.target.value)}
                    placeholder="Enter registered business address"
                    className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:outline-none rounded-xl font-semibold text-sm resize-none"
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">GST Certificate</h2>
                  {formData.gstImage && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>

                <div 
                  onClick={handlePhotoClick}
                  className="relative group cursor-pointer"
                >
                  {formData.gstImage ? (
                    <div className="aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-blue-400 transition-colors">
                      <img 
                        src={formData.gstImage} 
                        alt="GST Certificate" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white px-4 py-2 rounded-full text-xs font-bold text-slate-900 shadow-lg">
                          Change Document
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center group-hover:bg-slate-100 transition-colors">
                      <div className="p-3 bg-blue-50 rounded-full mb-3">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">Upload GST Certificate</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </motion.div>
          )}

          {!formData.gstRegistered && (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Important Note</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  If your business is not GST registered, you may still be required to provide tax-related declarations as per local regulations.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white p-4 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`w-full py-6 rounded-2xl font-bold text-base transition-all ${
            hasChanges 
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200" 
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>Updating...</span>
            </div>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <ImageSourcePicker
        isOpen={isPhotoPickerOpen}
        onClose={() => setIsPhotoPickerOpen(false)}
        onFileSelect={handlePhotoSelect}
        title="Upload GST Document"
        description="Select source to upload your GST certificate"
        fileNamePrefix="gst-certificate"
        galleryInputRef={fileInputRef}
      />
    </div>
  )
}
