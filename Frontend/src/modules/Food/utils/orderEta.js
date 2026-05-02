/**
 * Order ETA Utility Functions
 * Centralized logic for calculating order arrival times across the app.
 */

export const normalizeLookupId = (value) => {
  if (value == null) return ""
  const raw = String(value).trim()
  if (!raw || raw === "undefined" || raw === "null") return ""
  return raw
}

export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateOrderEta = (order) => {
  if (!order) return null;

  const status = String(order.status || order.orderStatus || "").toLowerCase();
  
  // 1. Distance-based for en-route orders
  if (
    (status === "picked_up" || status === "reached_drop" || status === "out_for_delivery") &&
    order.deliveryState?.currentLocation?.lat &&
    (order.address?.coordinates || (order.location?.coordinates))
  ) {
    const coords = order.address?.coordinates || order.location?.coordinates;
    const [userLng, userLat] = coords;
    const dist = haversineDistance(
      order.deliveryState.currentLocation.lat,
      order.deliveryState.currentLocation.lng,
      userLat,
      userLng
    );
    return Math.ceil(dist * 3) || 1;
  }

  // 2. Status-based buffers (Priority over countdown)
  if (status === "ready_for_pickup" || status === "reached_pickup" || status === "at_pickup") return 3;
  if (status === "ready") return 4;

  // 3. Countdown-based calculation
  const orderTimeStr = order.createdAt || order.orderDate || order.created_at || order.date;
  const orderTime = orderTimeStr ? new Date(orderTimeStr) : new Date();
  
  const restaurant = order.restaurantId || order.restaurant || {};
  const estimatedMinutes =
    order.estimatedDeliveryTime ||
    order.estimatedTime ||
    restaurant.estimatedDeliveryTimeMinutes ||
    (typeof restaurant.estimatedDeliveryTime === 'string' ? parseInt(restaurant.estimatedDeliveryTime) : 0) ||
    35;

  const deliveryTime = new Date(orderTime.getTime() + estimatedMinutes * 60000);
  const diffMs = deliveryTime - new Date();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins > 0) return diffMins;
  
  // 4. Late order buffers
  if (["confirmed", "preparing", "created", "pending"].includes(status)) return 5;
  
  return 1;
};
