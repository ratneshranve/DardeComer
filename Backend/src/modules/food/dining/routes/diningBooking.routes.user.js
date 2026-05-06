import express from 'express';
import {
    createDiningBookingController,
    listDiningBookingsUserController,
    addDiningBookingReviewController
} from '../controllers/diningBooking.controller.js';

const router = express.Router();

router.get('/', listDiningBookingsUserController);
router.post('/', createDiningBookingController);
router.patch('/:bookingId/review', addDiningBookingReviewController);

export default router;
