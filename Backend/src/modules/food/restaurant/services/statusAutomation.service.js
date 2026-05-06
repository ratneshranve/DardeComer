import { FoodRestaurant } from '../models/restaurant.model.js';
import { FoodRestaurantOutletTimings } from '../models/outletTimings.model.js';
import { logger } from '../../../../utils/logger.js';
import { getIO, rooms } from '../../../../config/socket.js';

/**
 * Periodically checks all online restaurants and sets them to offline 
 * if they are outside their scheduled operational hours.
 */
export const autoOfflineRestaurants = async () => {
    try {
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Fetch restaurants that are currently online
        const onlineRestaurants = await FoodRestaurant.find({
            isAcceptingOrders: true,
            status: 'approved',
            isDeleted: false
        }).select('_id restaurantName').lean();

        if (!onlineRestaurants.length) return;

        const restaurantIds = onlineRestaurants.map(r => r._id);
        const allTimings = await FoodRestaurantOutletTimings.find({
            restaurantId: { $in: restaurantIds }
        }).lean();

        const timingsMap = new Map(allTimings.map(t => [String(t.restaurantId), t]));
        const io = getIO();

        let offlineCount = 0;

        for (const restaurant of onlineRestaurants) {
            const timingsDoc = timingsMap.get(String(restaurant._id));
            let isWithinTimings = true;

            if (timingsDoc && Array.isArray(timingsDoc.timings)) {
                const dayTiming = timingsDoc.timings.find(t => t.day === currentDay);
                if (dayTiming) {
                    if (dayTiming.isOpen === false) {
                        isWithinTimings = false;
                    } else if (dayTiming.openingTime && dayTiming.closingTime) {
                        const [openH, openM] = dayTiming.openingTime.split(':').map(Number);
                        const [closeH, closeM] = dayTiming.closingTime.split(':').map(Number);
                        const openMin = openH * 60 + openM;
                        const closeMin = closeH * 60 + closeM;

                        if (closeMin > openMin) {
                            // Standard same-day timings (e.g., 09:00 to 22:00)
                            isWithinTimings = currentTimeInMinutes >= openMin && currentTimeInMinutes < closeMin;
                        } else if (closeMin < openMin) {
                            // Overnight timings (e.g., 18:00 to 02:00)
                            isWithinTimings = currentTimeInMinutes >= openMin || currentTimeInMinutes < closeMin;
                        } else {
                            // 24-hour case (e.g., 00:00 to 00:00 or same)
                            isWithinTimings = true;
                        }
                    }
                } else {
                    // No timing configured for today - default to closed for safety if automation is active?
                    // Or keep current state. User requested dynamic offline, so if no timing, we might stay online.
                    // But usually all days are pre-filled.
                }
            }

            if (!isWithinTimings) {
                await FoodRestaurant.updateOne(
                    { _id: restaurant._id },
                    { $set: { isAcceptingOrders: false } }
                );
                offlineCount++;
                
                logger.info(`[StatusAutomation] Auto-Offline: Restaurant "${restaurant.restaurantName}" (${restaurant._id}) forced offline due to timings.`);
                
                // Emit socket event to the restaurant room
                if (io) {
                    io.to(rooms.restaurant(restaurant._id)).emit('restaurant_status_update', { 
                        isAcceptingOrders: false,
                        reason: 'timings_closed'
                    });
                }
            }
        }

        if (offlineCount > 0) {
            logger.info(`[StatusAutomation] Completed cycle. Forced ${offlineCount} restaurants offline.`);
        }
    } catch (error) {
        logger.error(`[StatusAutomation] Error in autoOfflineRestaurants: ${error.message}`);
    }
};
