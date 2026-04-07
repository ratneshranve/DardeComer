import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from "framer-motion";
import { Star, Clock, IndianRupee, Heart, MapPin, Bike } from "lucide-react";
import OptimizedImage from "@food/components/OptimizedImage";

const WEBVIEW_SESSION_CACHE_BUSTER = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const RestaurantImageCarousel = React.memo(({ restaurant, priority = false, backendOrigin = "" }) => {
  const webviewSessionKeyRef = useRef(WEBVIEW_SESSION_CACHE_BUSTER);
  const imageElementRef = useRef(null);

  const withCacheBuster = useCallback((url) => {
    if (typeof url !== "string" || !url) return "";
    if (/^data:/i.test(url) || /^blob:/i.test(url)) return url;

    const isRelative = !/^(https?:\/\/|data:|blob:)/i.test(url.trim());
    const resolvedUrl = (backendOrigin && isRelative)
      ? `${backendOrigin.replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`
      : url;

    const hasSignedParams =
      /[?&](X-Amz-|Signature=|Expires=|AWSAccessKeyId=|GoogleAccessId=|token=|sig=|se=|sp=|sv=)/i.test(resolvedUrl);
    if (hasSignedParams) return resolvedUrl;

    try {
      const parsed = new URL(resolvedUrl, window.location.origin);
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
      const isLocalHost = /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname);
      const isSameHost = currentHost && parsed.hostname === currentHost;

      if (isLocalHost || isSameHost) {
        parsed.searchParams.set("_wv", webviewSessionKeyRef.current);
      }
      return parsed.toString();
    } catch {
      return resolvedUrl;
    }
  }, [backendOrigin]);

  const images = React.useMemo(() => {
    const sourceImages = Array.isArray(restaurant.images) && restaurant.images.length > 0
      ? restaurant.images
      : [restaurant.image];

    const validImages = sourceImages
      .filter((img) => typeof img === "string")
      .map((img) => img.trim())
      .filter(Boolean);

    return validImages.map((img) => withCacheBuster(img));
  }, [restaurant.images, restaurant.image, withCacheBuster]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadedBySrc, setLoadedBySrc] = useState({});
  const [, setAttemptedSrcs] = useState({});
  const [showShimmer, setShowShimmer] = useState(true);
  const [lastGoodSrc, setLastGoodSrc] = useState("");
  const touchStartX = useRef(0);
  const isSwiping = useRef(false);

  const safeIndex = images.length > 0 ? (currentIndex % images.length + images.length) % images.length : 0;
  const renderSrc = images[safeIndex] || lastGoodSrc;

  useEffect(() => {
    setCurrentIndex(0);
    setLoadedBySrc({});
    setAttemptedSrcs({});
    setShowShimmer(images.length > 0);
  }, [restaurant?.id, restaurant?.slug, restaurant?.updatedAt, images]);

  useEffect(() => {
    setLastGoodSrc("");
  }, [restaurant?.id, restaurant?.slug]);

  useEffect(() => {
    if (!renderSrc) return;
    const imgEl = imageElementRef.current;
    if (!imgEl) return;

    setShowShimmer(true);
    const shimmerTimeout = setTimeout(() => {
      setShowShimmer(false);
    }, 2500);

    if (imgEl.complete) {
      if (imgEl.naturalWidth > 0) {
        setLoadedBySrc((prev) => (prev[renderSrc] ? prev : { ...prev, [renderSrc]: true }));
        setLastGoodSrc(renderSrc);
        setShowShimmer(false);
      } else {
        setAttemptedSrcs((prev) => ({ ...prev, [renderSrc]: true }));
      }
    }
    return () => clearTimeout(shimmerTimeout);
  }, [renderSrc]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    if (Math.abs(diff) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isSwiping.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipeDistance = 50;
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  return (
    <div
      className="relative w-full h-[185px] sm:h-[200px] overflow-hidden bg-gray-100 dark:bg-gray-800"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <OptimizedImage
        ref={imageElementRef}
        src={renderSrc}
        alt={restaurant.name}
        priority={priority}
        className={`w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700 ease-out ${
          loadedBySrc[renderSrc] ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => {
          setLoadedBySrc((prev) => ({ ...prev, [renderSrc]: true }));
          setLastGoodSrc(renderSrc);
          setShowShimmer(false);
        }}
      />

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {showShimmer && !loadedBySrc[renderSrc] && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-shimmer" />
      )}

      {/* Navigation Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 px-2 pointer-events-none">
          {images.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === safeIndex ? 'w-5 bg-white shadow-md' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      {/* Discount Badge */}
      {restaurant.discount && (
        <div className="absolute top-2.5 left-0 px-3 py-1 bg-gradient-to-r from-[#001A94] to-blue-600 text-white text-[10px] sm:text-[11px] font-black rounded-r-full shadow-lg uppercase tracking-wide flex items-center gap-1">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12.864 2.227l8.909 8.91a2.182 2.182 0 010 3.085l-7.364 7.364a2.182 2.182 0 01-3.085 0l-8.91-8.91A2.182 2.182 0 012 11.137V4.41A2.182 2.182 0 014.182 2.23h6.727a2.182 2.182 0 011.955-.003z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {restaurant.discount}
        </div>
      )}
    </div>
  );
});

const RestaurantCard = ({
  restaurant,
  isFavorite,
  onFavoriteClick,
  onClick,
  backendOrigin
}) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="bg-white dark:bg-[#1a1a1a] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,26,148,0.12)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-shadow duration-300 group relative cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative">
        <RestaurantImageCarousel restaurant={restaurant} backendOrigin={backendOrigin} />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteClick(restaurant.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-full shadow-md hover:bg-red-50 hover:shadow-lg hover:scale-110 transition-all duration-200 z-10"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${
              isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-gray-400 stroke-[2.5]"
            }`}
          />
        </button>

        {/* Rating badge anchored to image bottom-left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm text-gray-900 dark:text-white px-2.5 py-1 rounded-full shadow-md z-10">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[12px] font-bold text-gray-800 dark:text-white">
            {restaurant.rating || "4.2"}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 pt-3 pb-4">
        {/* Name */}
        <h3 className="text-[15px] sm:text-[16px] font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#001A94] dark:group-hover:text-blue-400 transition-colors duration-200 tracking-tight mb-1">
          {restaurant.name}
        </h3>

        {/* Cuisine */}
        <p className="text-[11px] sm:text-[12px] text-gray-400 dark:text-gray-500 line-clamp-1 font-medium mb-3">
          {restaurant.cuisine || "North Indian, Chinese"}
        </p>

        {/* Divider */}
        <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />

        {/* Footer row: Time + Price + Distance */}
        <div className="flex items-center justify-between gap-2">
          {/* Delivery Time */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#001A94] dark:text-blue-400" />
            </div>
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              {restaurant.deliveryTime || "25-30 min"}
            </span>
          </div>

          {/* Dot separator */}
          <span className="text-gray-300 dark:text-gray-700 text-base leading-none select-none">·</span>

          {/* Price */}
          <div className="flex items-center gap-1">
            <IndianRupee className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            <span className="text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {restaurant.avgPrice || "200 for one"}
            </span>
          </div>

          {/* Distance (if available) */}
          {restaurant.distance && (
            <>
              <span className="text-gray-300 dark:text-gray-700 text-base leading-none select-none">·</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-[11px] sm:text-[12px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {restaurant.distance}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(RestaurantCard);
