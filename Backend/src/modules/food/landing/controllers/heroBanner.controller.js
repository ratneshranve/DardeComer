import {
    listHeroBanners,
    createHeroBannersFromFiles,
    deleteHeroBanner,
    updateHeroBannerOrder,
    toggleHeroBannerStatus,
    linkRestaurantsToBanner
} from '../services/heroBanner.service.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { FoodHeroBanner } from '../models/heroBanner.model.js';

export const listHeroBannersController = async (req, res, next) => {
    try {
        const data = await listHeroBanners();
        // Wrap in { banners } to match LandingPageManagement.jsx expectations
        return sendResponse(res, 200, 'Hero banners fetched successfully', { banners: data });
    } catch (error) {
        next(error);
    }
};

export const uploadHeroBannersController = async (req, res, next) => {
    try {
        if (!req.files || !req.files.length) {
            throw new ValidationError('No files uploaded');
        }

        const meta = {
            title: req.body.title,
            ctaText: req.body.ctaText,
            ctaLink: req.body.ctaLink
        };

        const results = await createHeroBannersFromFiles(req.files, meta);
        return sendResponse(res, 201, 'Hero banners uploaded', { results });
    } catch (error) {
        next(error);
    }
};

export const deleteHeroBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Banner id is required');
        }
        const result = await deleteHeroBanner(id);
        return sendResponse(res, 200, result.deleted ? 'Hero banner deleted' : 'Hero banner not found', result);
    } catch (error) {
        next(error);
    }
};

export const updateHeroBannerOrderController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sortOrder, order } = req.body;
        const finalOrder = typeof sortOrder === 'number' ? sortOrder : order;
        
        if (!id || typeof finalOrder !== 'number') {
            throw new ValidationError('id and numeric order/sortOrder are required');
        }
        const updated = await updateHeroBannerOrder(id, finalOrder);
        return sendResponse(res, 200, 'Hero banner order updated', updated);
    } catch (error) {
        next(error);
    }
};

export const toggleHeroBannerStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        let { isActive } = req.body;
        
        if (!id) {
            throw new ValidationError('Banner id is required');
        }

        // If isActive is not provided, fetch current and toggle
        if (typeof isActive !== 'boolean') {
            const banner = await FoodHeroBanner.findById(id);
            if (!banner) throw new ValidationError('Banner not found');
            isActive = !banner.isActive;
        }

        const updated = await toggleHeroBannerStatus(id, isActive);
        return sendResponse(res, 200, 'Hero banner status updated', updated);
    } catch (error) {
        next(error);
    }
};

export const linkRestaurantsToBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { restaurantIds } = req.body;
        if (!id || !Array.isArray(restaurantIds)) {
            throw new ValidationError('id and array of restaurantIds are required');
        }
        const updated = await linkRestaurantsToBanner(id, restaurantIds);
        return sendResponse(res, 200, 'Restaurants linked to banner successfully', updated);
    } catch (error) {
        next(error);
    }
};
