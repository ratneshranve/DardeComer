import { sendResponse } from '../../../../utils/response.js';
import * as diningBookingService from '../services/diningBooking.service.js';

export async function createDiningBookingController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const booking = await diningBookingService.createDiningBooking(userId, req.body || {});
        return sendResponse(res, 201, 'Dining booking created successfully', booking);
    } catch (err) {
        next(err);
    }
}

export async function listDiningBookingsUserController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const bookings = await diningBookingService.listDiningBookingsUser(userId, req.query || {});
        return sendResponse(res, 200, 'Dining bookings retrieved', bookings);
    } catch (err) {
        next(err);
    }
}

export async function addDiningBookingReviewController(req, res, next) {
    try {
        const userId = req.user?.userId;
        const bookingId = req.params.bookingId;
        const booking = await diningBookingService.addDiningBookingReview(bookingId, userId, req.body || {});
        return sendResponse(res, 200, 'Review submitted successfully', booking);
    } catch (err) {
        next(err);
    }
}

export async function listDiningBookingsRestaurantController(req, res, next) {
    try {
        const restaurantId = req.user?.userId;
        const bookings = await diningBookingService.listDiningBookingsRestaurant(restaurantId, req.query || {});
        return sendResponse(res, 200, 'Dining bookings retrieved', bookings);
    } catch (err) {
        next(err);
    }
}

export async function updateDiningBookingStatusRestaurantController(req, res, next) {
    try {
        const restaurantId = req.user?.userId;
        const bookingId = req.params.bookingId;
        const status = req.body?.status || req.body?.bookingStatus || '';
        const booking = await diningBookingService.updateDiningBookingStatusRestaurant(bookingId, restaurantId, status);
        return sendResponse(res, 200, 'Dining booking status updated', booking);
    } catch (err) {
        next(err);
    }
}
