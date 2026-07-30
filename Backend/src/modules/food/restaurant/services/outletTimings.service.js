import mongoose from 'mongoose';
import { ValidationError } from '../../../../core/auth/errors.js';
import { FoodRestaurantOutletTimings } from '../models/outletTimings.model.js';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const normalizeDay = (value) => {
    const v = String(value || '').trim();
    if (!v) return null;
    const exact = DAY_NAMES.find((d) => d.toLowerCase() === v.toLowerCase());
    if (exact) return exact;
    const abbr = v.slice(0, 3).toLowerCase();
    const match = DAY_NAMES.find((d) => d.toLowerCase().startsWith(abbr));
    return match || null;
};

const normalizeTime = (value, fallback = '') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return fallback;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return fallback;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
};

const normalizeSlots = (slots, fallbackSlot = null) => {
    const rawSlots = Array.isArray(slots) ? slots : [];
    const normalized = rawSlots
        .map((slot) => ({
            openingTime: normalizeTime(slot?.openingTime, ''),
            closingTime: normalizeTime(slot?.closingTime, '')
        }))
        .filter((slot) => slot.openingTime && slot.closingTime);

    if (normalized.length > 0) return normalized;
    if (fallbackSlot?.openingTime && fallbackSlot?.closingTime) {
        return [{
            openingTime: normalizeTime(fallbackSlot.openingTime, '09:00'),
            closingTime: normalizeTime(fallbackSlot.closingTime, '22:00')
        }];
    }
    return [];
};

const defaultTimings = () =>
    DAY_NAMES.map((day) => ({
        day,
        isOpen: true,
        openingTime: '09:00',
        closingTime: '22:00',
        slots: [{ openingTime: '09:00', closingTime: '22:00' }]
    }));

const toClientDayShape = (found, day) => {
    const isOpen = found ? found.isOpen !== false : true;
    const slots = isOpen
        ? normalizeSlots(found?.slots, {
            openingTime: found?.openingTime,
            closingTime: found?.closingTime
        })
        : [];
    const primarySlot = slots[0] || null;

    return {
        day,
        isOpen,
        openingTime: isOpen ? (primarySlot?.openingTime || '') : '',
        closingTime: isOpen ? (primarySlot?.closingTime || '') : '',
        slots,
    };
};

const toClientShape = (doc) => {
    const timings = Array.isArray(doc?.timings) ? doc.timings : [];
    const map = {};
    for (const day of DAY_NAMES) {
        const found = timings.find((t) => normalizeDay(t?.day) === day);
        map[day] = toClientDayShape(found, day);
    }
    return map;
};

export async function getOutletTimingsForRestaurant(restaurantId) {
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
        throw new ValidationError('Invalid restaurant id');
    }
    const doc = await FoodRestaurantOutletTimings.findOne({ restaurantId }).select('timings updatedAt').lean();
    if (!doc) return { outletTimings: toClientShape({ timings: defaultTimings() }) };
    return { outletTimings: toClientShape(doc) };
}

export async function upsertOutletTimingsForRestaurant(restaurantId, outletTimings) {
    if (!restaurantId || !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
        throw new ValidationError('Invalid restaurant id');
    }
    if (!outletTimings || typeof outletTimings !== 'object' || Array.isArray(outletTimings)) {
        throw new ValidationError('outletTimings must be an object keyed by day name');
    }

    const timings = DAY_NAMES.map((day) => {
        const src = outletTimings[day] && typeof outletTimings[day] === 'object' ? outletTimings[day] : {};
        const isOpen = src.isOpen !== false;
        const slots = isOpen
            ? normalizeSlots(src.slots, {
                openingTime: src.openingTime,
                closingTime: src.closingTime
            })
            : [];
        const fallbackSlots = isOpen && slots.length === 0
            ? [{ openingTime: '09:00', closingTime: '22:00' }]
            : slots;
        const primarySlot = fallbackSlots[0] || null;

        return {
            day,
            isOpen,
            openingTime: isOpen ? (primarySlot?.openingTime || '') : '',
            closingTime: isOpen ? (primarySlot?.closingTime || '') : '',
            slots: fallbackSlots,
        };
    });

    const doc = await FoodRestaurantOutletTimings.findOneAndUpdate(
        { restaurantId },
        { $set: { timings } },
        { upsert: true, new: true, setDefaultsOnInsert: true, projection: 'timings updatedAt' }
    ).lean();

    return { outletTimings: toClientShape(doc) };
}
