/**
 * Politique de pagination partagee par les listings (User, et a venir Shop).
 * Centralise les bornes pour que le clamp applicatif et la validation HTTP
 * referencent la meme source de verite.
 */
export const DEFAULT_ITEMS_PER_PAGE = 30;
export const MAX_ITEMS_PER_PAGE = 100;
