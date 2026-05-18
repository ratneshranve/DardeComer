import mongoose from "mongoose";

const accountDeletionRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    role: {
      type: String,
      enum: ["USER", "RESTAURANT", "DELIVERY_PARTNER"],
      required: true,
      index: true,
    },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    adminNote: { type: String, trim: true, maxlength: 1000, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "FoodAdmin", default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "account_deletion_requests" },
);

accountDeletionRequestSchema.index(
  { userId: 1, role: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

export const AccountDeletionRequest = mongoose.model(
  "AccountDeletionRequest",
  accountDeletionRequestSchema,
);

