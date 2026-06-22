/** Centralized API constants for endpoints and default headers. */
export const API_PATHS = {
  login: '/auth/login',
  me: '/auth/me',
  refresh: '/auth/refresh',
  locations: '/locations',
  services: '/services',
  serviceCategories: '/service-categories',
  serviceSlots: '/service-slots',
  bookings: '/bookings',
  contacts: '/contacts',
  tags: '/tags',
  eventPackages: '/event-packages',
  schedulingOccasions: '/scheduling-occasions',
  plans: '/plans',
  privateHire: '/private-hire',
  orders: '/orders',
  subscriptions: '/subscriptions',
  reports: '/reports',
  modifierGroups: '/modifier-groups',
  attributeGroups: '/attribute-groups',
  rotationGroups: '/rotation-groups',
} as const

export const API_HEADERS = {
  accept: 'application/json',
  ngrokBypass: '69420',
} as const

export const LANGUAGE_STORAGE_KEY = 'language'
