import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink } from "lucide-react"

export default function RestaurantDocumentViewer() {
  const location = useLocation()
  const navigate = useNavigate()

  const { title, url, viewerUrl, isPdf } = useMemo(() => {
    const state = location.state || {}
    const rawUrl = String(state.url || "")
    const pdf = rawUrl.toLowerCase().includes(".pdf")
    const resolvedViewerUrl = pdf
      ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(rawUrl)}`
      : rawUrl

    return {
      title: String(state.title || "Document"),
      url: rawUrl,
      viewerUrl: resolvedViewerUrl,
      isPdf: pdf,
    }
  }, [location.state])
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate("/food/restaurant/onboarding", { replace: true })
  }

  const handleOpenExternally = () => {
    if (!url) return
    window.open(isPdf ? viewerUrl : url, "_blank", "noopener,noreferrer")
  }

  if (!url) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          <h1 className="text-sm font-semibold text-slate-900">Document viewer</h1>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <div className="max-w-sm space-y-2">
            <h2 className="text-base font-semibold text-slate-900">PDF unavailable</h2>
            <p className="text-sm text-slate-500">
              This preview is only available right after selecting the file in the app.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-slate-100 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-900" />
          </button>
          <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
        </div>

        <button
          type="button"
          onClick={handleOpenExternally}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Open outside
        </button>
      </div>

      <div className="flex-1 p-3 sm:p-4">
        <div className="h-full min-h-[calc(100vh-88px)] bg-white rounded-xl border border-slate-200 overflow-hidden">
          <iframe
            src={viewerUrl}
            title={title}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  )
}

