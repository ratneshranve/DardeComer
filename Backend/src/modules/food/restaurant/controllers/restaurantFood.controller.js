import { createRestaurantFood, updateRestaurantFood, deleteRestaurantFood } from '../services/restaurantFood.service.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

export const createRestaurantFoodController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const food = await createRestaurantFood(restaurantId, req.body || {});
        return sendResponse(res, 201, 'Food created successfully', { food });
    } catch (error) {
        next(error);
    }
};

export const updateRestaurantFoodController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const food = await updateRestaurantFood(restaurantId, req.params.id, req.body || {});
        if (!food) return sendError(res, 404, 'Food not found');
        return sendResponse(res, 200, 'Food updated successfully', { food });
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurantFoodController = async (req, res, next) => {
    try {
        const restaurantId = req.user?.userId;
        const success = await deleteRestaurantFood(restaurantId, req.params.id);
        if (!success) return sendError(res, 404, 'Food not found or already deleted');
        return sendResponse(res, 200, 'Food deleted successfully');
    } catch (error) {
        next(error);
    }
};

