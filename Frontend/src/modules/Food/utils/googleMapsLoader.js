/**
 * Shared Google Maps Loader configuration.
 *
 * IMPORTANT: @react-google-maps/api throws if useJsApiLoader is called more
 * than once with DIFFERENT options (different library order, apiKey mismatch,
 * etc.). All components MUST import these constants and use them unchanged.
 *
 * Rules:
 *  - Never inline a new `libraries` array inside a component.
 *  - Always import GOOGLE_MAPS_LIBRARIES from here.
 *  - Always use GOOGLE_MAPS_API_KEY from here so apiKey is consistent.
 */

// Single, stable library array — order is fixed and must never change.
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry'];

// Single, consistent API key. Falls back to empty string (not undefined).
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
