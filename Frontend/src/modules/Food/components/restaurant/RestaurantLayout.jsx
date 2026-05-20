import { Outlet, useLocation } from "react-router-dom"

export default function RestaurantLayout() {
  const location = useLocation()

  // Check if we should show bottom navigation (and thus need the extra bottom padding)
  // Exclude auth routes and other full-screen pages
  const isAuthRoute =
    location.pathname.includes("/login") ||
    location.pathname.includes("/signup") ||
    location.pathname.includes("/forgot-password") ||
    location.pathname.includes("/otp") ||
    location.pathname.includes("/welcome") ||
    location.pathname.includes("/pending-verification")

  const showBottomNav = !isAuthRoute && ![
    "/food/restaurant/onboarding",
    "/food/restaurant/support",
  ].some(p => location.pathname.startsWith(p))

  return (
    <main className={`pt-6 pb-12 ${showBottomNav ? "pb-28 md:pb-0" : "md:pb-0"}`}>
      <Outlet />
    </main>
  )
}
