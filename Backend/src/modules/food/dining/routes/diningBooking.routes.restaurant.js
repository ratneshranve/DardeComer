import express from 'express';
import {
    listDiningBookingsRestaurantController,
    updateDiningBookingStatusRestaurantController
} from '../controllers/diningBooking.controller.js';

const router = express.Router();

router.get('/', listDiningBookingsRestaurantController);
router.patch('/:bookingId/status', updateDiningBookingStatusRestaurantController);

export default router;
