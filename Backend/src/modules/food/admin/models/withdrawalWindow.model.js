import mongoose from "mongoose";

const withdrawalWindowSchema = new mongoose.Schema(
  {
    isEnabled: { type: Boolean, default: false },
    dayOfWeek: { type: Number, min: 0, max: 6, default: 1 }, // 0=Sun ... 6=Sat
    startTime: { type: String, default: "10:00" }, // HH:mm
    endTime: { type: String, default: "18:00" },   // HH:mm
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true },
);

export const FoodWithdrawalWindow = mongoose.model(
  "FoodWithdrawalWindow",
  withdrawalWindowSchema,
);

