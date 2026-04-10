import React, { useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Bookmark, Star, Clock } from "lucide-react";
import { Card, CardContent } from "@food/components/ui/card";
import { Badge } from "@food/components/ui/badge";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import { getSourceMeta } from "@food/utils/sourceType";
import RestaurantImageCarousel from "@food/components/user/restaurantImage"; // assuming this is where it's correctly from, wait, I need to check exports

const HomeRestaurantCard = React.memo(({ 
  restaurant, 
  index,
  fallbackSlugSource,
  availabilityTick,
  favorite,
  onToggleFavorite,
  BACKEND_ORIGIN
}) => {
  const isOutOfService = false; // from original code
  const restaurantSlug =
    typeof restaurant?.slug === "string" && restaurant.slug.trim()
      ? restaurant.slug.trim()
      : fallbackSlugSource.toLowerCase().replace(/\s+/g, "-");

  const availability = getRestaurantAvailabilityStatus(
    restaurant,
    new Date(availabilityTick),
    { ignoreOperationalStatus: true }
  );
  const sourceMeta = getSourceMeta(restaurant);

  const handleToggleFavorite = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(restaurantSlug, restaurant, favorite);
  }, [favorite, onToggleFavorite, restaurantSlug, restaurant]);

  // Framer Motion staggered entry
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: "easeOut",
        delay: index * 0.05 // staggered entry based on index
      } 
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="h-full"
    >
      <div className="relative h-full group">
        {/* Favorite Button Overlay */}
        <div className="absolute top-3 right-3 z-[15] pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.8 }}
            type="button"
            onClick={handleToggleFavorite}
            className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              favorite
                ? "bg-gradient-to-tr from-[#001A94] to-blue-600 text-white scale-110 shadow-blue-500/30"
                : "bg-white/90 backdrop-blur-md text-gray-400 hover:text-[#001A94] shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-110 hover:shadow-[0_8px_20px_rgba(0,26,148,0.15)]"
            }`}
          >
            <Bookmark
              className={`h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 ${favorite ? "fill-white drop-shadow-md" : "stroke-[2]"}`}
            />
          </motion.button>
        </div>

        <Link
          to={`/user/restaurants/${restaurantSlug}`}
          className="h-full w-full flex"
        >
          <motion.div
            className="h-full w-full flex flex-col"
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            initial="rest"
            variants={{
              rest: {
                y: 0,
                scale: 1,
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
              },
              hover: {
                y: -8,
                scale: 1.02,
                boxShadow: "0 25px 35px -10px rgba(0,26,148,0.15), 0 15px 15px -10px rgba(0,0,0,0.08)",
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8
                }
              }
            }}
          >
            <Card className={`overflow-hidden gap-0 cursor-pointer border border-transparent hover:border-blue-100 dark:border-gray-800 group bg-white dark:bg-[#1a1a1a] shadow-sm transition-all duration-500 py-0 rounded-2xl h-full flex flex-col w-full relative ${
              isOutOfService || !availability.isOpen ? "grayscale opacity-85" : ""
            }`}>
              {/* Image Section */}
              <div className="relative h-48 sm:h-56 md:h-60 w-full overflow-hidden rounded-t-2xl flex-shrink-0 bg-gray-100">
                <motion.div
                  className="absolute inset-0"
                  variants={{
                    rest: { scale: 1 },
                    hover: { scale: 1.08 }
                  }}
                  transition={{ duration: 0.7, ease: [0.33, 1, 0.68, 1] }} // smooth custom cubic-bezier
                >
                  <RestaurantImageCarousel
                    restaurant={restaurant}
                    priority={index < 4}
                    backendOrigin={BACKEND_ORIGIN}
                    className="h-full"
                    roundedClass="rounded-t-2xl"
                  />
                </motion.div>

                {/* Rich Gradient Overlay on Hover for premium feel */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 mix-blend-multiply"
                  variants={{
                    rest: { opacity: 0.2 },
                    hover: { opacity: 0.6 }
                  }}
                  transition={{ duration: 0.4 }}
                />

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
                  variants={{
                    rest: { x: "-100%" },
                    hover: {
                      x: "200%",
                      transition: { duration: 1, ease: "easeInOut", delay: 0.1 }
                    }
                  }}
                />

                {/* Ad Badge */}
                {restaurant.isPromoted && (
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-gradient-to-r from-neutral-900 to-neutral-800 backdrop-blur-md text-white border border-white/10 py-1.5 px-3.5 text-[10px] font-bold tracking-widest uppercase shadow-lg">
                      Ad
                    </Badge>
                  </div>
                )}

                {/* Availability Overlay */}
                {(!availability.isOpen || isOutOfService) && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center p-4"
                  >
                    <div className="bg-white/95 px-5 py-2.5 rounded-xl border-l-4 border-[#001A94] shadow-2xl transform -rotate-1">
                      <span className="text-[#001A94] font-bold uppercase tracking-tighter text-sm italic">
                        {isOutOfService ? "Currently Unavailable" : availability.message || "Opening Soon"}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Offer / Pre-book strip at bottom of image */}
                {restaurant.offer && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-[#001A94]/95 to-transparent backdrop-blur-sm" 
                    style={{ height: '40%' }}
                    variants={{
                      rest: { y: 2, opacity: 0.95 },
                      hover: { y: 0, opacity: 1 }
                    }}
                  >
                    <div className="h-full flex flex-col justify-end pl-5 pb-3">
                      <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1 drop-shadow-md">Promoted Offer</p>
                      <div className="h-0.5 bg-white mb-1.5 w-12 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                      <p className="text-white text-sm sm:text-base font-black line-clamp-1 drop-shadow-lg">{restaurant.offer}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Content Section */}
              <motion.div
                variants={{
                  rest: { y: 0 },
                  hover: { y: -4 }
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <CardContent className="p-4 sm:p-5 pt-4 sm:pt-5 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-[#121212]/50">
                  {/* Name & Rating */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <motion.h3
                        className="text-lg font-black text-gray-900 dark:text-white line-clamp-1 tracking-tight"
                        variants={{
                          rest: { color: "inherit" },
                          hover: { color: "#001A94" }
                        }}
                        transition={{ duration: 0.3 }}
                      >
                        {restaurant.name}
                      </motion.h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold line-clamp-1 mt-1 tracking-wide uppercase">
                        {restaurant.cuisine}
                      </p>
                      <div className="mt-2">
                        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[10px] font-semibold">
                          {sourceMeta.sourceLabel}
                        </Badge>
                      </div>
                    </div>
                    <motion.div
                      className="flex-shrink-0 bg-gradient-to-tr from-green-600 to-green-500 shadow-md shadow-green-600/30 text-white px-2.5 py-1.5 rounded-[10px] flex items-center gap-1.5"
                      variants={{
                        rest: { scale: 1, rotate: 0 },
                        hover: { scale: 1.05, rotate: 3 }
                      }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
                    >
                      <span className="text-sm font-black tracking-tight">
                        {Number(restaurant.rating) > 0 ? Number(restaurant.rating).toFixed(1) : "NEW"}
                      </span>
                      <Star className="h-3.5 w-3.5 fill-white text-white drop-shadow-sm" />
                    </motion.div>
                  </div>

                  {/* Time & Distance */}
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50/80 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Clock className="h-3.5 w-3.5 text-[#001A94] dark:text-blue-400" strokeWidth={2.5} />
                    </div>
                    <span className="font-bold tracking-tight">{restaurant.deliveryTime}</span>
                    <span className="mx-1.5 text-gray-300 dark:text-gray-600 font-black">•</span>
                    <span className="font-bold tracking-tight">{restaurant.distance}</span>
                  </div>
                </CardContent>
              </motion.div>
            </Card>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
});

export default HomeRestaurantCard;
