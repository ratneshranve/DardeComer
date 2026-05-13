import mongoose from 'mongoose';

const supportFaqSchema = new mongoose.Schema(
    {
        question: { type: String, default: '' },
        answer: { type: String, default: '' }
    },
    { _id: false }
);

const supportSettingsSchema = new mongoose.Schema(
    {
        appType: {
            type: String,
            required: true,
            unique: true,
            index: true,
            enum: ['user', 'restaurant', 'delivery']
        },
        supportEmail: { type: String, default: '' },
        supportPhone: { type: String, default: '' },
        supportTitle: { type: String, default: '' },
        supportDescription: { type: String, default: '' },
        footerText: { type: String, default: '' },
        faq: { type: [supportFaqSchema], default: [] },
        isActive: { type: Boolean, default: true }
    },
    { collection: 'food_support_settings', timestamps: true }
);

export const FoodSupportSettings = mongoose.model('FoodSupportSettings', supportSettingsSchema);
