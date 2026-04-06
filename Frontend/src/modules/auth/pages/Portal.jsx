import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function SuperAppPortal() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate("/food/user", { replace: true })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CB202D]"></div>
    </div>
  )
}
