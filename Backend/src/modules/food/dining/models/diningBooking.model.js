import mongoose from 'mongoose';

const bookingUserSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', default: null },
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodUser', default: null },
        name: { type: String, default: 'Guest', trim: true },
        phone: { type: String, default: '', trim: true },
        email: { type: String, default: '', trim: true }
    },
    { _id: false }
);

const bookingRestaurantSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRestaurant', default: null },
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRestaurant', default: null },
        restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRestaurant', default: null },
        restaurantNameNormalized: { type: String, default: '', trim: true },
        slug: { type: String, default: '', trim: true },
        name: { type: String, default: 'Restaurant', trim: true },
        restaurantName: { type: String, default: 'Restaurant', trim: true },
        profileImage: { type: String, default: '' },
        coverImages: { type: [String], default: [] },
        menuImages: { type: [String], default: [] },
        location: { type: Object, default: null }
    },
    { _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        rating: { type: Number, min: 1, max: 5, default: 0 },
        comment: { type: String, default: '', trim: true },
        createdAt: { type: Date, default: Date.now }
    },
    { _id: false }
);

const diningBookingSchema = new mongoose.Schema(
    {
        bookingId: { type: String, required: true, trim: true },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodRestaurant',
            required: true,
            index: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodUser',
            required: true,
            index: true
        },
        restaurant: { type: bookingRestaurantSchema, default: null },
        user: { type: bookingUserSchema, default: null },
        guests: { type: Number, min: 1, default: 1 },
        date: { type: Date, required: true },
        timeSlot: { type: String, default: '', trim: true },
        specialRequest: { type: String, default: '', trim: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'accepted', 'checked-in', 'completed', 'cancelled'],
            default: 'pending',
            index: true
        },
        review: { type: reviewSchema, default: null }
    },
    {
        collection: 'food_dining_bookings',
        timestamps: true
    }
);

diningBookingSchema.index({ restaurantId: 1, createdAt: -1 });
diningBookingSchema.index({ userId: 1, createdAt: -1 });
diningBookingSchema.index({ bookingId: 1 }, { unique: true });

export const FoodDiningBooking = mongoose.model('FoodDiningBooking', diningBookingSchema);
