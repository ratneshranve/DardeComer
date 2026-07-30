import mongoose from "mongoose";

const timingSlotSchema = new mongoose.Schema(
  {
    openingTime: { type: String, trim: true }, // "HH:mm"
    closingTime: { type: String, trim: true }, // "HH:mm"
  },
  { _id: false },
);

const dayTimingSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, trim: true },
    isOpen: { type: Boolean, default: true },
    openingTime: { type: String, trim: true }, // legacy first-slot mirror
    closingTime: { type: String, trim: true }, // legacy first-slot mirror
    slots: {
      type: [timingSlotSchema],
      default: [],
    },
  },
  { _id: false },
);

const outletTimingsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodRestaurant",
      required: true,
      unique: true,
      index: true,
    },
    timings: {
      type: [dayTimingSchema],
      default: [],
    },
  },
  {
    collection: "food_restaurant_outlet_timings",
    timestamps: true,
  },
);

export const FoodRestaurantOutletTimings = mongoose.model(
  "FoodRestaurantOutletTimings",
  outletTimingsSchema,
);
