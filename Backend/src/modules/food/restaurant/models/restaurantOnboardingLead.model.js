import mongoose from "mongoose";

const restaurantOnboardingLeadSchema = new mongoose.Schema(
  {
    phoneRaw: { type: String, trim: true, required: true },
    phoneDigits: { type: String, trim: true, required: true, index: true },
    phoneLast10: { type: String, trim: true, required: true, unique: true, index: true },
    firstRequestedAt: { type: Date, default: Date.now },
    lastRequestedAt: { type: Date, default: Date.now, index: true },
    requestCount: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

export const RestaurantOnboardingLead = mongoose.model(
  "RestaurantOnboardingLead",
  restaurantOnboardingLeadSchema,
);

