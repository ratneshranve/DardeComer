import { FoodSupportSettings } from '../models/supportSettings.model.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';

const APP_TYPES = ['user', 'restaurant', 'delivery'];

const normalizeAppType = (value) => String(value || '').trim().toLowerCase();

const getDefaultContent = (appType) => {
    if (appType === 'restaurant') {
        return {
            supportTitle: 'Restaurant Partner Support',
            supportDescription: 'Get help with listings, orders, payouts, and app access.',
            supportEmail: 'dardecomer7@gmail.com',
            supportPhone: '878 728 2388',
            footerText: 'We respond within 24 hours. Thanks for partnering with us!',
            faq: [
                { question: 'How do I update menu items?', answer: 'Go to Menu > Edit Items from your restaurant dashboard.' },
                { question: 'When are payouts processed?', answer: 'Payouts are processed weekly and visible in your Wallet.' },
                { question: 'How can I reach delivery support?', answer: 'Call the support number listed here for urgent delivery issues.' }
            ]
        };
    }

    if (appType === 'delivery') {
        return {
            supportTitle: 'Delivery Partner Support',
            supportDescription: 'Quick help for login, orders, payouts, and safety assistance.',
            supportEmail: 'dardecomer7@gmail.com',
            supportPhone: '878 728 2388',
            footerText: 'We are here for you. Typical response time is under 12 hours.',
            faq: [
                { question: 'I cannot log in, what should I do?', answer: 'Recheck your phone number and request a new OTP.' },
                { question: 'How do I see my earnings?', answer: 'Go to Pocket > Earnings to review your payouts.' },
                { question: 'Can I report a safety issue?', answer: 'Use the safety help option in your app or call support.' }
            ]
        };
    }

    return {
        supportTitle: 'Customer Support',
        supportDescription: 'We are here to help with orders, payments, and account issues.',
        supportEmail: 'dardecomer7@gmail.com',
        supportPhone: '878 728 2388',
        footerText: 'Thanks for choosing Dar De Comer. We reply within 24 hours.',
        faq: [
            { question: 'Where is my order?', answer: 'Track your order status in the Orders section of the app.' },
            { question: 'How can I change my phone number?', answer: 'Go to Profile > Edit Profile to update your number.' },
            { question: 'How do I request a refund?', answer: 'Open your order details and choose Request Refund.' }
        ]
    };
};

const isValidEmail = (value) => {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
};

const isValidPhone = (value) => {
    if (!value) return false;
    const cleaned = String(value).replace(/[^0-9+]/g, '');
    return /^\+?[0-9]{7,15}$/.test(cleaned);
};

const sanitizeFaq = (faq) => {
    if (!Array.isArray(faq)) return [];
    return faq
        .map((item) => ({
            question: String(item?.question || '').trim(),
            answer: String(item?.answer || '').trim()
        }))
        .filter((item) => item.question.length > 0 || item.answer.length > 0)
        .slice(0, 25);
};

const ensureAppType = (value) => {
    const appType = normalizeAppType(value);
    if (!APP_TYPES.includes(appType)) {
        throw new ValidationError('Invalid app type');
    }
    return appType;
};

const upsertSupportSettings = async (appType, payload = {}) => {
    const defaults = getDefaultContent(appType);
    const supportEmail = String(payload.supportEmail ?? defaults.supportEmail ?? '').trim();
    const supportPhone = String(payload.supportPhone ?? defaults.supportPhone ?? '').trim();
    const supportTitle = String(payload.supportTitle ?? defaults.supportTitle ?? '').trim();
    const supportDescription = String(payload.supportDescription ?? defaults.supportDescription ?? '').trim();
    const footerText = String(payload.footerText ?? defaults.footerText ?? '').trim();
    const isActive = payload.isActive === undefined ? true : Boolean(payload.isActive);
    const faq = sanitizeFaq(payload.faq ?? defaults.faq ?? []);

    if (supportEmail && !isValidEmail(supportEmail)) {
        throw new ValidationError('Invalid support email');
    }
    if (supportPhone && !isValidPhone(supportPhone)) {
        throw new ValidationError('Invalid support phone');
    }

    const doc = await FoodSupportSettings.findOneAndUpdate(
        { appType },
        {
            $set: {
                appType,
                supportEmail,
                supportPhone,
                supportTitle,
                supportDescription,
                footerText,
                faq,
                isActive
            }
        },
        { upsert: true, new: true }
    ).lean();

    return doc;
};

export const getPublicSupportSettingsController = async (req, res, next) => {
    try {
        const appType = ensureAppType(req.params?.appType);
        let doc = await FoodSupportSettings.findOne({ appType }).lean();
        if (!doc) {
            doc = await upsertSupportSettings(appType, getDefaultContent(appType));
        }
        return sendResponse(res, 200, 'Support settings fetched successfully', doc);
    } catch (error) {
        next(error);
    }
};

export const getAdminSupportSettingsController = async (req, res, next) => {
    try {
        const appType = ensureAppType(req.params?.appType);
        let doc = await FoodSupportSettings.findOne({ appType }).lean();
        if (!doc) {
            doc = await upsertSupportSettings(appType, getDefaultContent(appType));
        }
        return sendResponse(res, 200, 'Support settings fetched successfully', doc);
    } catch (error) {
        next(error);
    }
};

export const updateSupportSettingsController = async (req, res, next) => {
    try {
        const appType = ensureAppType(req.params?.appType);
        const doc = await upsertSupportSettings(appType, req.body ?? {});
        return sendResponse(res, 200, 'Support settings updated successfully', doc);
    } catch (error) {
        next(error);
    }
};
