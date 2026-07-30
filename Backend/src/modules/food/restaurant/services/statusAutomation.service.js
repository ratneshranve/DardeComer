import { FoodRestaurant } from '../models/restaurant.model.js';
import { FoodRestaurantOutletTimings } from '../models/outletTimings.model.js';
import { logger } from '../../../../utils/logger.js';
import { getIO, rooms } from '../../../../config/socket.js';

const timeToMinutes = (value) => {
    const raw = String(value || '').trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const hours = Number(m[1]);
    const minutes = Number(m[2]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    return hours * 60 + minutes;
};

const isWithinWindow = (nowMinutes, openMin, closeMin) => {
    if (openMin === null || closeMin === null) return false;
    if (openMin === closeMin) return true;
    if (closeMin > openMin) return nowMinutes >= openMin && nowMinutes < closeMin;
    return nowMinutes >= openMin || nowMinutes < closeMin;
};

const normalizeSlots = (dayTiming) => {
    const explicitSlots = Array.isArray(dayTiming?.slots)
        ? dayTiming.slots.filter((slot) => slot?.openingTime && slot?.closingTime)
        : [];
    if (explicitSlots.length > 0) return explicitSlots;
    if (dayTiming?.openingTime && dayTiming?.closingTime) {
        return [{ openingTime: dayTiming.openingTime, closingTime: dayTiming.closingTime }];
    }
    return [];
};

/**
 * Periodically checks all online restaurants and sets them to offline 
 * if they are outside their scheduled operational hours.
 */
export const autoOfflineRestaurants = async () => {
    try {
        const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(Date.now() + IST_OFFSET_MS);
        const currentDay = istNow.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
        const currentHour = istNow.getUTCHours();
        const currentMinute = istNow.getUTCMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        const automationRestaurants = await FoodRestaurant.find({
            status: 'approved',
            isDeleted: false,
            availabilityAutomationEnabled: { $ne: false }
        }).select('_id restaurantName isAcceptingOrders').lean();

        if (!automationRestaurants.length) return;

        const restaurantIds = automationRestaurants.map(r => r._id);
        const allTimings = await FoodRestaurantOutletTimings.find({
            restaurantId: { $in: restaurantIds }
        }).lean();

        const timingsMap = new Map(allTimings.map(t => [String(t.restaurantId), t]));
        const io = getIO();

        let statusChangedCount = 0;

        for (const restaurant of automationRestaurants) {
            const timingsDoc = timingsMap.get(String(restaurant._id));
            let isWithinTimings = true;

            if (timingsDoc && Array.isArray(timingsDoc.timings)) {
                const dayTiming = timingsDoc.timings.find(t => t.day === currentDay);
                if (dayTiming) {
                    if (dayTiming.isOpen === false) {
                        isWithinTimings = false;
                    } else {
                        const slots = normalizeSlots(dayTiming);
                        if (slots.length > 0) {
                            isWithinTimings = slots.some((slot) => {
                                const openMin = timeToMinutes(slot.openingTime);
                                const closeMin = timeToMinutes(slot.closingTime);
                                return isWithinWindow(currentTimeInMinutes, openMin, closeMin);
                            });
                        }
                    }
                }
            }

            const shouldAcceptOrders = Boolean(isWithinTimings);
            if (Boolean(restaurant.isAcceptingOrders) !== shouldAcceptOrders) {
                await FoodRestaurant.updateOne(
                    { _id: restaurant._id },
                    { $set: { isAcceptingOrders: shouldAcceptOrders } }
                );
                statusChangedCount++;
                
                logger.info(`[StatusAutomation] Auto status sync: Restaurant "${restaurant.restaurantName}" (${restaurant._id}) set to ${shouldAcceptOrders ? 'online' : 'offline'} by timings.`);
                
                if (io) {
                    io.to(rooms.restaurant(restaurant._id)).emit('restaurant_status_update', { 
                        isAcceptingOrders: shouldAcceptOrders,
                        reason: shouldAcceptOrders ? 'timings_open' : 'timings_closed'
                    });
                }
            }
        }

        if (statusChangedCount > 0) {
            logger.info(`[StatusAutomation] Completed cycle. Synced ${statusChangedCount} restaurants by timings.`);
        }
    } catch (error) {
        logger.error(`[StatusAutomation] Error in autoOfflineRestaurants: ${error.message}`);
    }
};
