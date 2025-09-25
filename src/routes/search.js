import express from "express";
import { advancedSearch, getSearchSuggestions, getFilterOptions, getPopularSearches } from "../controllers/searchController.js";

const router = express.Router();

// Advanced search with filters
router.get("/advanced", advancedSearch);

// Search suggestions/autocomplete
router.get("/suggestions", getSearchSuggestions);

// Get filter options for dropdowns
router.get("/filters", getFilterOptions);

// Get popular search terms
router.get("/popular", getPopularSearches);

export default router;
