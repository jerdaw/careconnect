/**
 * Search Library Entry Point
 *
 * Modularized architecture:
 * - data: Loading and caching
 * - scoring: Keyword matching logic
 * - vector: Semantic matching logic
 * - geo: Distance calculation and re-ranking
 * - fuzzy: Query suggestions
 * - utils: Shared normalization/tokenization
 */

export * from "./search/index"
export * from "./search/types"
export { getSuggestion } from "./search/fuzzy"
export { loadServices } from "./search/data"
export { tokenize, normalize } from "./search/utils"
