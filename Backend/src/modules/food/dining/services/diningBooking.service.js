import mongoose from 'mongoose';
import { ValidationError, NotFoundError } from '../../../../core/auth/errors.js';
import { FoodDiningBooking } from '../models/diningBooking.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';
import { FoodUser } from '../../../../core/users/user.model.js';
import { notifyOwnerSafely } from '../../../../core/notifications/firebase.service.js';

const ALLOWED_STATUSES = new Set([
    'pending',
    'confirmed',
    'accepted',
    'checked-in',
    'completed',
    'cancelled'
]);

const buildDisplayBookingId = () => `TB${Date.now().toString().slice(-8)}`;

const ensureObjectId = (value, label) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new ValidationError(`${label} is invalid`);
    }
    return new mongoose.Types.ObjectId(value);
};

const parseDate = (value) => {
    const parsed = new Date(value || Date.now());
    if (Number.isNaN(parsed.getTime())) {
        return new Date();
    }
    return parsed;
};

const mapRestaurantSnapshot = (restaurant) => {
    if (!restaurant) return null;
    const name = restaurant.restaurantName || restaurant.name || 'Restaurant';
    const normalized = restaurant.restaurantNameNormalized || '';
    return {
        _id: restaurant._id,
        id: restaurant._id,
        restaurantId: restaurant._id,
        restaurantNameNormalized: normalized,
        slug: restaurant.slug || normalized,
        name,
        restaurantName: restaurant.restaurantName || name,
        profileImage: restaurant.profileImage || '',
        coverImages: Array.isArray(restaurant.coverImages) ? restaurant.coverImages : [],
        menuImages: Array.isArray(restaurant.menuImages) ? restaurant.menuImages : [],
        location: restaurant.location || null
    };
};

const mapUserSnapshot = (user) => {
    if (!user) return null;
    const name = String(user.name || '').trim() || 'Guest';
    const phone = String(user.phone || '').trim();
    const email = String(user.email || '').trim();
    return {
        _id: user._id,
        id: user._id,
        name,
        phone,
        email
    };
};

const mapBooking = (doc) => ({
    _id: doc._id,
    id: doc._id,
    bookingId: doc.bookingId,
    restaurantId: doc.restaurantId,
    restaurant: doc.restaurant || null,
    userId: doc.userId,
    user: doc.user || null,
    guests: doc.guests,
    date: doc.date,
    timeSlot: doc.timeSlot,
    specialRequest: doc.specialRequest,
    status: doc.status,
    review: doc.review || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
});

const buildStatusNotification = (booking) => {
    const status = String(booking?.status || '').trim().toLowerCase();
    const restaurantName = booking?.restaurant?.restaurantName || booking?.restaurant?.name || 'restaurant';

    let title = 'Table booking update';
    let body = `Your booking at ${restaurantName} was updated.`;

    if (status === 'accepted' || status === 'confirmed') {
        title = 'Table booking accepted';
        body = `Your table booking at ${restaurantName} has been accepted.`;
    } else if (status === 'cancelled') {
        title = 'Table booking declined';
        body = `Your table booking at ${restaurantName} was declined.`;
    } else if (status === 'checked-in') {
        title = 'Table booking checked-in';
        body = `You are checked in at ${restaurantName}.`;
    } else if (status === 'completed') {
        title = 'Table booking completed';
        body = `Thanks for visiting ${restaurantName}.`;
    }

    return { title, body, status };
};

const extractRestaurantId = (payload = {}) =>
    String(
        payload?.restaurantId ||
        payload?.restaurant ||
        payload?.restaurantRef?._id ||
        payload?.restaurantRef?.id ||
        payload?.restaurant?.restaurant?._id ||
        payload?.restaurant?.restaurant?.id ||
        payload?.restaurant?._id ||
        payload?.restaurant?.id ||
        ''
    ).trim();

export async function createDiningBooking(userId, payload = {}) {
    if (!userId) throw new ValidationError('User is required');

    const restaurantIdValue = extractRestaurantId(payload);
    if (!restaurantIdValue) throw new ValidationError('Restaurant is required');

    const restaurantId = ensureObjectId(restaurantIdValue, 'Restaurant');
    const userOid = ensureObjectId(userId, 'User');

    const restaurant = await FoodRestaurant.findById(restaurantId)
        .select('restaurantName restaurantNameNormalized profileImage coverImages menuImages location')
        .lean();
    if (!restaurant) throw new NotFoundError('Restaurant not found');

    const user = await FoodUser.findById(userOid).select('name phone email').lean();

    const booking = await FoodDiningBooking.create({
        bookingId: buildDisplayBookingId(),
        restaurantId,
        userId: userOid,
        restaurant: mapRestaurantSnapshot(restaurant),
        user: mapUserSnapshot(user),
        guests: Math.max(1, Number(payload.guests) || 1),
        date: parseDate(payload.date),
        timeSlot: String(payload.timeSlot || '').trim(),
        specialRequest: String(payload.specialRequest || '').trim(),
        status: 'pending'
    });

    return mapBooking(booking.toObject());
}

export async function listDiningBookingsUser(userId, query = {}) {
    if (!userId) throw new ValidationError('User is required');

    const userOid = ensureObjectId(userId, 'User');
    const filter = { userId: userOid };

    if (query.status) {
        const status = String(query.status || '').trim().toLowerCase();
        if (!ALLOWED_STATUSES.has(status)) {
            throw new ValidationError('Invalid booking status');
        }
        filter.status = status;
    }

    const bookings = await FoodDiningBooking.find(filter)
        .sort({ createdAt: -1 })
        .lean();

    return bookings.map(mapBooking);
}

export async function listDiningBookingsRestaurant(restaurantId, query = {}) {
    if (!restaurantId) throw new ValidationError('Restaurant is required');

    const restaurantOid = ensureObjectId(restaurantId, 'Restaurant');
    const filter = { restaurantId: restaurantOid };

    if (query.status) {
        const status = String(query.status || '').trim().toLowerCase();
        if (!ALLOWED_STATUSES.has(status)) {
            throw new ValidationError('Invalid booking status');
        }
        filter.status = status;
    }

    const bookings = await FoodDiningBooking.find(filter)
        .sort({ createdAt: -1 })
        .lean();

    return bookings.map(mapBooking);
}

export async function updateDiningBookingStatusRestaurant(bookingId, restaurantId, status) {
    if (!bookingId) throw new ValidationError('Booking id is required');
    const normalized = String(status || '').trim().toLowerCase();
    if (!ALLOWED_STATUSES.has(normalized)) {
        throw new ValidationError('Invalid booking status');
    }

    const bookingOid = ensureObjectId(bookingId, 'Booking');
    const restaurantOid = ensureObjectId(restaurantId, 'Restaurant');

    const booking = await FoodDiningBooking.findOneAndUpdate(
        { _id: bookingOid, restaurantId: restaurantOid },
        { $set: { status: normalized } },
        { new: true }
    ).lean();

    if (!booking) throw new NotFoundError('Booking not found');

    const mapped = mapBooking(booking);
    if (mapped?.userId) {
        try {
            const { title, body, status: bookingStatus } = buildStatusNotification(mapped);
            await notifyOwnerSafely(
                { ownerType: 'USER', ownerId: mapped.userId },
                {
                    title,
                    body,
                    data: {
                        type: 'dining_booking_status',
                        bookingId: String(mapped._id || ''),
                        status: bookingStatus,
                        link: '/food/user/bookings'
                    }
                }
            );
        } catch {
            // Notification failure should not block booking update.
        }
    }

    return mapped;
}

export async function addDiningBookingReview(bookingId, userId, payload = {}) {
    if (!bookingId) throw new ValidationError('Booking id is required');
    if (!userId) throw new ValidationError('User is required');

    const bookingOid = ensureObjectId(bookingId, 'Booking');
    const userOid = ensureObjectId(userId, 'User');

    const rating = Number(payload.rating || 0);
    const comment = String(payload.comment || '').trim();

    if (!comment) throw new ValidationError('Review comment is required');

    const booking = await FoodDiningBooking.findOneAndUpdate(
        { _id: bookingOid, userId: userOid },
        {
            $set: {
                review: {
                    rating: Math.max(1, Math.min(5, rating)),
                    comment,
                    createdAt: new Date()
                }
            }
        },
        { new: true }
    ).lean();

    if (!booking) throw new NotFoundError('Booking not found');

    return mapBooking(booking);
}
