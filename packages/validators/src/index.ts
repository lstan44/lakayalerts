/**
 * @citadel/validators
 *
 * Zod schemas for validating data at system boundaries.
 * Used by both frontend (form validation) and workers (API input validation).
 *
 * These schemas mirror the ontology types but add runtime validation.
 */

export { ClaimSchema, type ClaimInput } from "./claim.js";
