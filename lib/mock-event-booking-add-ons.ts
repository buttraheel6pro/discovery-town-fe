/** Events-module booking add-ons — separate evt-addon-* ids (simple vs complex). */
import type {
  AddOn,
  AttributeGroup,
  CafeProduct,
  ModifierGroup,
  Product,
  ServiceType,
} from '@/lib/types'

const TENANT_ID = 'tenant-1'

const APPLICABLE_PARTY: ServiceType[] = [
  'PARTY',
  'CLASS',
  'PLAY_AREA',
  'COURT',
  'SWIMMING',
  'WORKSHOP',
  'CAMP',
  'COACHING',
]

/**
 * Hero images for complex event add-ons (IDs verified against mock-data URLs).
 * @see lib/mock-data.ts gift / facility imageUrl fields
 */
export const EVT_ADDON_IMAGES = {
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
  toppings: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
  tray: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
  snacks: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  drinks: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
  coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
  cupcakes: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800&q=80',
  donuts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
  iceCream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
  diyStation: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&q=80',
  balloons: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
  paperware: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&q=80',
  backdrop: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
  garland: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80',
  banner: 'https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=800&q=80',
  goodieBags: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80',
} as const

/** Map inventory product id → image (for UI when cafe row is missing). */
export const EVT_ADDON_IMAGE_BY_PRODUCT_ID: Record<string, string> = {
  'prod-evt-addon-001': EVT_ADDON_IMAGES.pizza,
  'prod-evt-addon-002': EVT_ADDON_IMAGES.toppings,
  'prod-evt-addon-003': EVT_ADDON_IMAGES.tray,
  'prod-evt-addon-004': EVT_ADDON_IMAGES.snacks,
  'prod-evt-addon-005': EVT_ADDON_IMAGES.drinks,
  'prod-evt-addon-006': EVT_ADDON_IMAGES.coffee,
  'prod-evt-addon-008': EVT_ADDON_IMAGES.cupcakes,
  'prod-evt-addon-009': EVT_ADDON_IMAGES.donuts,
  'prod-evt-addon-010': EVT_ADDON_IMAGES.iceCream,
  'prod-evt-addon-011': EVT_ADDON_IMAGES.diyStation,
  'prod-evt-addon-012': EVT_ADDON_IMAGES.balloons,
  'prod-evt-addon-013': EVT_ADDON_IMAGES.garland,
  'prod-evt-addon-014': EVT_ADDON_IMAGES.banner,
  'prod-evt-addon-015': EVT_ADDON_IMAGES.goodieBags,
  'prod-evt-addon-024': EVT_ADDON_IMAGES.paperware,
  'prod-evt-addon-025': EVT_ADDON_IMAGES.backdrop,
}

function cafeNowIso(): string {
  return new Date().toISOString()
}

const ALL_THEME_OPTION_IDS = [
  'ao-evt-theme-1',
  'ao-evt-theme-2',
  'ao-evt-theme-3',
  'ao-evt-theme-4',
  'ao-evt-theme-5',
  'ao-evt-theme-6',
] as const

const ALL_BALLOON_COLOR_IDS = [
  'ao-evt-bc-1',
  'ao-evt-bc-2',
  'ao-evt-bc-3',
  'ao-evt-bc-4',
] as const

/** Modifier / attribute groups for complex event add-ons (base + deltas match pricingLabel ranges). */
export const EVENT_MODULE_ADDON_MODIFIER_GROUPS: ModifierGroup[] = [
  {
    id: 'mg-evt-pizza-size',
    name: 'Pizza Size',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-ps-1', name: 'Large (14") — included', priceDelta: 0, isDefault: true },
      { id: 'm-evt-ps-2', name: 'Extra-large (16")', priceDelta: 6, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-pizza-topping',
    name: 'Premium Pizza Toppings',
    isRequired: false,
    maxSelect: 3,
    modifiers: [
      { id: 'm-evt-pt-1', name: 'BBQ Chicken', priceDelta: 5, isDefault: false },
      { id: 'm-evt-pt-2', name: 'Specialty Veggie', priceDelta: 5, isDefault: false },
      { id: 'm-evt-pt-3', name: 'Extra Cheese', priceDelta: 6, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-topping-tier',
    name: 'Topping Style',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-tt-1', name: 'Classic (1 topping)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-tt-2', name: 'Gourmet specialty', priceDelta: 2, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-tray-type',
    name: 'Tray Selection',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-tray-1', name: 'Fresh Fruit', priceDelta: 0, isDefault: true },
      { id: 'm-evt-tray-2', name: 'Veggie & Dip', priceDelta: 0, isDefault: false },
      { id: 'm-evt-tray-3', name: 'Cheese & Crackers', priceDelta: 5, isDefault: false },
      { id: 'm-evt-tray-4', name: 'Deluxe Combo', priceDelta: 10, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-snack-pack',
    name: 'Snack Basket Size',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-sn-1', name: 'Classic mix (10 kids)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-sn-2', name: 'Premium mix (10 kids)', priceDelta: 4, isDefault: false },
      { id: 'm-evt-sn-3', name: 'Deluxe mix (15 kids)', priceDelta: 7, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-drink-tier',
    name: 'Drink Package Level',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      {
        id: 'm-evt-dr-1',
        name: 'Lemonade & iced tea (standard)',
        priceDelta: 0,
        isDefault: true,
      },
      {
        id: 'm-evt-dr-2',
        name: 'Premium flavored drinks',
        priceDelta: 10,
        isDefault: false,
      },
      {
        id: 'm-evt-dr-3',
        name: 'Ultimate beverage bar',
        priceDelta: 15,
        isDefault: false,
      },
    ],
  },
  {
    id: 'mg-evt-coffee-tier',
    name: 'Coffee Bar Level',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-cf-1', name: 'Drip coffee & tea', priceDelta: 0, isDefault: true },
      { id: 'm-evt-cf-2', name: 'Espresso & specialty drinks', priceDelta: 12, isDefault: false },
      { id: 'm-evt-cf-3', name: 'Full barista station', priceDelta: 20, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-cupcake-qty',
    name: 'Cupcake Package',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-cc-1', name: '1 dozen standard', priceDelta: 0, isDefault: true },
      { id: 'm-evt-cc-2', name: '1 dozen custom design', priceDelta: 8, isDefault: false },
      { id: 'm-evt-cc-3', name: '2 dozen themed', priceDelta: 15, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-donut-wall',
    name: 'Donut Wall Size',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-dw-1', name: '2 dozen display', priceDelta: 0, isDefault: true },
      { id: 'm-evt-dw-2', name: '3 dozen display', priceDelta: 12, isDefault: false },
      { id: 'm-evt-dw-3', name: 'Premium gourmet assortment', priceDelta: 20, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-ice-cream',
    name: 'Ice Cream Package',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-ic-1', name: 'Standard cups (12)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-ic-2', name: 'Premium brand (12)', priceDelta: 10, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-diy-station',
    name: 'Station Type',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-diy-1', name: 'Cookie decorating', priceDelta: 0, isDefault: true },
      { id: 'm-evt-diy-2', name: 'Cupcake decorating', priceDelta: 2, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-bouquet-upgrade',
    name: 'Bouquet Style',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-bq-1', name: 'Standard helium (6)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-bq-2', name: 'Foil accent upgrade', priceDelta: 5, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-paperware-tier',
    name: 'Paperware Set',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-pw-1', name: 'Standard set (up to 20)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-pw-2', name: 'Premium themed set (up to 30)', priceDelta: 10, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-backdrop-tier',
    name: 'Backdrop Style',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-bd-1', name: 'Standard fabric', priceDelta: 0, isDefault: true },
      { id: 'm-evt-bd-2', name: 'Deluxe double-sided', priceDelta: 15, isDefault: false },
      { id: 'm-evt-bd-3', name: 'Custom printed premium', priceDelta: 25, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-garland-length',
    name: 'Garland Length',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-gl-1', name: '6 ft (standard)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-gl-2', name: '8 ft', priceDelta: 30, isDefault: false },
      { id: 'm-evt-gl-3', name: '10 ft premium', priceDelta: 55, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-banner-style',
    name: 'Banner Style',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-bn-1', name: '"ONE" standard', priceDelta: 0, isDefault: true },
      { id: 'm-evt-bn-2', name: 'Custom name banner', priceDelta: 5, isDefault: false },
    ],
  },
  {
    id: 'mg-evt-goodie-tier',
    name: 'Goodie Bag Level',
    isRequired: true,
    maxSelect: 1,
    modifiers: [
      { id: 'm-evt-gb-1', name: 'Basic (3 items)', priceDelta: 0, isDefault: true },
      { id: 'm-evt-gb-2', name: 'Deluxe (5 items)', priceDelta: 2, isDefault: false },
    ],
  },
]

export const EVENT_MODULE_ADDON_ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    id: 'ag-evt-theme',
    name: 'Party Theme',
    selectionType: 'single',
    isVariantDimension: true,
    isRequired: true,
    options: [
      { id: 'ao-evt-theme-1', label: 'Unicorns', emoji: '🦄', color: 'pink' },
      { id: 'ao-evt-theme-2', label: 'Dinosaurs', emoji: '🦕', color: 'green' },
      { id: 'ao-evt-theme-3', label: 'Princess', emoji: '👑', color: 'purple' },
      { id: 'ao-evt-theme-4', label: 'Superhero', emoji: '🦸', color: 'blue' },
      { id: 'ao-evt-theme-5', label: 'Sports', emoji: '⚽', color: 'orange' },
      { id: 'ao-evt-theme-6', label: 'Rainbow', emoji: '🌈', color: 'yellow' },
    ],
  },
  {
    id: 'ag-evt-balloon-colors',
    name: 'Balloon Colors (pick 3)',
    selectionType: 'multiple',
    isVariantDimension: false,
    isRequired: true,
    maxSelect: 3,
    options: [
      { id: 'ao-evt-bc-1', label: 'Pink', emoji: '', color: 'pink' },
      { id: 'ao-evt-bc-2', label: 'Blue', emoji: '', color: 'blue' },
      { id: 'ao-evt-bc-3', label: 'Gold', emoji: '', color: 'yellow' },
      { id: 'ao-evt-bc-4', label: 'White', emoji: '', color: 'white' },
    ],
  },
]

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6] as const

function complexCafeProduct(
  productId: string,
  name: string,
  basePrice: number,
  description: string,
  options: {
    modifierGroupIds?: string[]
    attributeGroups?: CafeProduct['attributeGroups']
    category?: CafeProduct['category']
    imageUrl?: string
  } = {},
): CafeProduct {
  const now = cafeNowIso()
  return {
    id: productId,
    name,
    category: options.category ?? 'Snacks',
    basePrice,
    description,
    preparationTimeMinutes: 0,
    printNotesOnTicket: false,
    modifierGroupIds: options.modifierGroupIds ?? [],
    attributeGroups: options.attributeGroups ?? {},
    imageUrl: options.imageUrl,
    availableDaysOfWeek: [...ALL_DAYS],
    isAvailable: true,
    rotatable: false,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const EVENT_MODULE_ADDON_CAFE_PRODUCTS: CafeProduct[] = [
  complexCafeProduct(
    'prod-evt-addon-001',
    'Additional Pizza',
    22,
    'Large 1-topping pizza. $22 - $28',
    {
      category: 'Pizza',
      imageUrl: EVT_ADDON_IMAGES.pizza,
      modifierGroupIds: ['mg-evt-pizza-size', 'mg-evt-pizza-topping'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-002',
    'Premium Pizza Toppings',
    5,
    'Gourmet options per pizza. $5 - $7 / pizza',
    {
      category: 'Pizza',
      imageUrl: EVT_ADDON_IMAGES.toppings,
      modifierGroupIds: ['mg-evt-topping-tier', 'mg-evt-pizza-topping'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-003',
    'Adult Appetizer Tray',
    35,
    'Fresh Fruit, Veggie & Dip, or Cheese/Cracker tray. $35 - $45 / tray',
    {
      category: 'Salads',
      imageUrl: EVT_ADDON_IMAGES.tray,
      modifierGroupIds: ['mg-evt-tray-type'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-004',
    'Snack Basket',
    18,
    'Individual bags of chips, pretzels, or goldfish. $18 - $25',
    {
      category: 'Snacks',
      imageUrl: EVT_ADDON_IMAGES.snacks,
      modifierGroupIds: ['mg-evt-snack-pack'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-005',
    'Premium Drink Package',
    45,
    'Unlimited lemonade and flavored iced tea for all guests. $45 - $60',
    {
      category: 'Cold Drinks',
      imageUrl: EVT_ADDON_IMAGES.drinks,
      modifierGroupIds: ['mg-evt-drink-tier'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-006',
    'Specialty Coffee Bar',
    65,
    'Premium coffee, espresso, syrups, and flavored creamer station. $65 - $85',
    {
      category: 'Coffee',
      imageUrl: EVT_ADDON_IMAGES.coffee,
      modifierGroupIds: ['mg-evt-coffee-tier', 'mg-003'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-008',
    'Custom Cupcakes',
    40,
    'Dozen custom-colored or themed cupcakes from a local bakery. $40 - $55',
    {
      category: 'Sweets',
      imageUrl: EVT_ADDON_IMAGES.cupcakes,
      modifierGroupIds: ['mg-evt-cupcake-qty'],
      attributeGroups: { 'ag-evt-theme': [...ALL_THEME_OPTION_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-009',
    'Gourmet Donut Wall',
    55,
    'Rental of a decorative donut wall with 2-3 dozen donuts. $55 - $75',
    {
      category: 'Sweets',
      imageUrl: EVT_ADDON_IMAGES.donuts,
      modifierGroupIds: ['mg-evt-donut-wall'],
      attributeGroups: { 'ag-evt-theme': [...ALL_THEME_OPTION_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-010',
    'Ice Cream Cups',
    30,
    'Individual servings of premium ice cream cups or popsicles (per 12). $30 - $40',
    {
      category: 'Frozen Treats',
      imageUrl: EVT_ADDON_IMAGES.iceCream,
      modifierGroupIds: ['mg-evt-ice-cream'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-011',
    'Make Your Own Station',
    6,
    'Cookie or Cupcake Decorating Station (includes supplies). $6 - $8 / child',
    {
      category: 'Sweets',
      imageUrl: EVT_ADDON_IMAGES.diyStation,
      modifierGroupIds: ['mg-evt-diy-station'],
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-012',
    'Simple Balloon Bouquet',
    15,
    '6 Helium balloons, 3 colors, tied to the table. $15 - $20',
    {
      category: 'Snacks',
      imageUrl: EVT_ADDON_IMAGES.balloons,
      modifierGroupIds: ['mg-evt-bouquet-upgrade'],
      attributeGroups: { 'ag-evt-balloon-colors': [...ALL_BALLOON_COLOR_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-024',
    'Themed Paperware',
    30,
    'Plates, napkins, cups, etc., to match a specific theme. $30 - $40',
    {
      imageUrl: EVT_ADDON_IMAGES.paperware,
      modifierGroupIds: ['mg-evt-paperware-tier'],
      attributeGroups: { 'ag-evt-theme': [...ALL_THEME_OPTION_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-025',
    'Premium Backdrop',
    50,
    'Themed fabric or plastic backdrop for photos/cake table. $50 - $75',
    {
      imageUrl: EVT_ADDON_IMAGES.backdrop,
      modifierGroupIds: ['mg-evt-backdrop-tier'],
      attributeGroups: { 'ag-evt-theme': [...ALL_THEME_OPTION_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-013',
    'Standard Balloon Garland',
    120,
    'A small, 6-foot, 3-color air-filled balloon garland. $120 - $175',
    {
      imageUrl: EVT_ADDON_IMAGES.garland,
      modifierGroupIds: ['mg-evt-garland-length'],
      attributeGroups: { 'ag-evt-balloon-colors': [...ALL_BALLOON_COLOR_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-014',
    'High Chair Banner',
    15,
    '"ONE" or themed banner for the birthday child\'s high chair. $15 - $20',
    {
      imageUrl: EVT_ADDON_IMAGES.banner,
      modifierGroupIds: ['mg-evt-banner-style'],
      attributeGroups: { 'ag-evt-theme': [...ALL_THEME_OPTION_IDS] },
    },
  ),
  complexCafeProduct(
    'prod-evt-addon-015',
    'Goodie Bags',
    5,
    'Pre-assembled bags with 3-4 simple toys/treats. $5 - $7 / child',
    {
      category: 'Kids Corner',
      imageUrl: EVT_ADDON_IMAGES.goodieBags,
      modifierGroupIds: ['mg-evt-goodie-tier'],
    },
  ),
]

function partyProduct(
  id: string,
  categoryId: string,
  name: string,
  price: number,
  description: string,
  linkedAddOnId: string,
  imageUrl?: string,
): Product {
  const now = cafeNowIso()
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return {
    id,
    tenantId: TENANT_ID,
    categoryId,
    name,
    slug: slug || id,
    description,
    price,
    memberPrice: price,
    stockCount: 999,
    lowStockThreshold: 10,
    allowBackorders: false,
    imageUrl,
    isActive: true,
    availableOnline: true,
    isFeatured: false,
    canBeAddOn: true,
    linkedAddOnId,
    createdAt: now,
    updatedAt: now,
  }
}

export const EVENT_MODULE_ADDON_PRODUCTS: Product[] = [
  partyProduct(
    'prod-evt-addon-001',
    'pcat-cafe-pizza',
    'Additional Pizza',
    22,
    'Large 1-topping pizza. $22 - $28',
    'evt-addon-001',
    EVT_ADDON_IMAGES.pizza,
  ),
  partyProduct(
    'prod-evt-addon-002',
    'pcat-cafe-pizza',
    'Premium Pizza Toppings',
    5,
    'Gourmet options (e.g., BBQ Chicken, specialty veggie). $5 - $7 / pizza',
    'evt-addon-002',
    EVT_ADDON_IMAGES.toppings,
  ),
  partyProduct(
    'prod-evt-addon-003',
    'pcat-cafe-salads',
    'Adult Appetizer Tray',
    35,
    'Fresh Fruit, Veggie & Dip, or Cheese/Cracker tray. $35 - $45 / tray',
    'evt-addon-003',
    EVT_ADDON_IMAGES.tray,
  ),
  partyProduct(
    'prod-evt-addon-004',
    'pcat-cafe-snacks',
    'Snack Basket',
    18,
    'Individual bags of chips, pretzels, or goldfish (serves 10 kids). $18 - $25',
    'evt-addon-004',
    EVT_ADDON_IMAGES.snacks,
  ),
  partyProduct(
    'prod-evt-addon-005',
    'pcat-cafe-cold-drinks',
    'Premium Drink Package',
    45,
    'Unlimited Lemonade & Flavored Iced Tea for all guests. $45 - $60',
    'evt-addon-005',
    EVT_ADDON_IMAGES.drinks,
  ),
  partyProduct(
    'prod-evt-addon-006',
    'pcat-cafe-hot-drinks',
    'Specialty Coffee Bar',
    65,
    'Premium coffee, espresso, syrups, and flavored creamer station. $65 - $85',
    'evt-addon-006',
    EVT_ADDON_IMAGES.coffee,
  ),
  partyProduct(
    'prod-evt-addon-008',
    'pcat-cafe-sweets-treats',
    'Custom Cupcakes',
    40,
    'Dozen custom-colored or themed cupcakes from a local bakery. $40 - $55',
    'evt-addon-008',
    EVT_ADDON_IMAGES.cupcakes,
  ),
  partyProduct(
    'prod-evt-addon-009',
    'pcat-cafe-sweets-treats',
    'Gourmet Donut Wall',
    55,
    'Rental of a decorative donut wall with 2-3 dozen donuts. $55 - $75',
    'evt-addon-009',
    EVT_ADDON_IMAGES.donuts,
  ),
  partyProduct(
    'prod-evt-addon-010',
    'pcat-cafe-frozen-treats',
    'Ice Cream Cups',
    30,
    'Individual servings of premium ice cream cups or popsicles (per 12). $30 - $40',
    'evt-addon-010',
    EVT_ADDON_IMAGES.iceCream,
  ),
  partyProduct(
    'prod-evt-addon-011',
    'pcat-cafe-sweets-treats',
    'Make Your Own Station',
    6,
    'Cookie or Cupcake Decorating Station (includes supplies). $6 - $8 / child',
    'evt-addon-011',
    EVT_ADDON_IMAGES.diyStation,
  ),
  partyProduct(
    'prod-evt-addon-012',
    'pcat-cafe-snacks',
    'Simple Balloon Bouquet',
    15,
    '6 Helium balloons, 3 colors, tied to the table. $15 - $20',
    'evt-addon-012',
    EVT_ADDON_IMAGES.balloons,
  ),
  partyProduct(
    'prod-evt-addon-024',
    'pcat-cafe-snacks',
    'Themed Paperware',
    30,
    'Plates, napkins, cups, etc., to match a specific theme. $30 - $40',
    'evt-addon-024',
    EVT_ADDON_IMAGES.paperware,
  ),
  partyProduct(
    'prod-evt-addon-025',
    'pcat-cafe-snacks',
    'Premium Backdrop',
    50,
    'Themed fabric or plastic backdrop for photos/cake table. $50 - $75',
    'evt-addon-025',
    EVT_ADDON_IMAGES.backdrop,
  ),
  partyProduct(
    'prod-evt-addon-013',
    'pcat-cafe-snacks',
    'Standard Balloon Garland',
    120,
    'A small, 6-foot, 3-color air-filled balloon garland. $120 - $175',
    'evt-addon-013',
    EVT_ADDON_IMAGES.garland,
  ),
  partyProduct(
    'prod-evt-addon-014',
    'pcat-cafe-snacks',
    'High Chair Banner',
    15,
    '"ONE" or themed banner for the birthday child\'s high chair. $15 - $20',
    'evt-addon-014',
    EVT_ADDON_IMAGES.banner,
  ),
  partyProduct(
    'prod-evt-addon-015',
    'pcat-cafe-kids-corner',
    'Goodie Bags',
    5,
    'Pre-assembled bags with 3-4 simple toys/treats. $5 - $7 / child',
    'evt-addon-015',
    EVT_ADDON_IMAGES.goodieBags,
  ),
]

function complexAddOn(
  id: string,
  name: string,
  description: string,
  price: number,
  productId: string,
  pricingType: AddOn['pricingType'] = 'FLAT',
): AddOn {
  return {
    id,
    tenantId: TENANT_ID,
    name,
    description,
    pricingType,
    price,
    memberPrice: null,
    referenceType: 'PRODUCT',
    inventoryProductId: productId,
    structureType: 'COMPLEX',
    applicableServiceTypes: APPLICABLE_PARTY,
    isActive: true,
  }
}

function simpleAddOn(
  id: string,
  name: string,
  description: string,
  price: number,
  pricingType: AddOn['pricingType'] = 'FLAT',
  services: ServiceType[] = APPLICABLE_PARTY,
): AddOn {
  return {
    id,
    tenantId: TENANT_ID,
    name,
    description,
    pricingType,
    price,
    memberPrice: null,
    referenceType: 'ALL',
    inventoryProductId: null,
    structureType: 'SIMPLE',
    applicableServiceTypes: services,
    isActive: true,
  }
}

/** Events private-party optional add-ons (evt-addon-001 … evt-addon-025). */
export const EVENT_MODULE_BOOKING_ADDONS: AddOn[] = [
  complexAddOn(
    'evt-addon-001',
    'Additional Pizza',
    'Large 1-topping pizza. $22 - $28',
    22,
    'prod-evt-addon-001',
  ),
  complexAddOn(
    'evt-addon-002',
    'Premium Pizza Toppings',
    'Gourmet options (e.g., BBQ Chicken, specialty veggie). $5 - $7 / pizza',
    5,
    'prod-evt-addon-002',
  ),
  complexAddOn(
    'evt-addon-003',
    'Adult Appetizer Tray',
    'Fresh Fruit, Veggie & Dip, or Cheese/Cracker tray. $35 - $45 / tray',
    35,
    'prod-evt-addon-003',
  ),
  complexAddOn(
    'evt-addon-004',
    'Snack Basket',
    'Individual bags of chips, pretzels, or goldfish (serves 10 kids). $18 - $25',
    18,
    'prod-evt-addon-004',
  ),
  complexAddOn(
    'evt-addon-005',
    'Premium Drink Package',
    'Unlimited Lemonade & Flavored Iced Tea for all guests. $45 - $60',
    45,
    'prod-evt-addon-005',
  ),
  complexAddOn(
    'evt-addon-006',
    'Specialty Coffee Bar',
    'Premium coffee, espresso, syrups, and flavored creamer station. $65 - $85',
    65,
    'prod-evt-addon-006',
  ),
  simpleAddOn(
    'evt-addon-007',
    'Outside Food/Catering Fee',
    'If you allow outside food beyond birthday cake/dessert. $40 - $60',
    40,
  ),
  complexAddOn(
    'evt-addon-008',
    'Custom Cupcakes',
    'Dozen custom-colored or themed cupcakes from a local bakery. $40 - $55',
    40,
    'prod-evt-addon-008',
  ),
  complexAddOn(
    'evt-addon-009',
    'Gourmet Donut Wall',
    'Rental of a decorative donut wall with 2-3 dozen donuts. $55 - $75',
    55,
    'prod-evt-addon-009',
  ),
  complexAddOn(
    'evt-addon-010',
    'Ice Cream Cups',
    'Individual servings of premium ice cream cups or popsicles (per 12). $30 - $40',
    30,
    'prod-evt-addon-010',
  ),
  complexAddOn(
    'evt-addon-011',
    'Make Your Own Station',
    'Cookie or Cupcake Decorating Station (includes supplies). $6 - $8 / child',
    6,
    'prod-evt-addon-011',
    'PER_PERSON',
  ),
  complexAddOn(
    'evt-addon-012',
    'Simple Balloon Bouquet',
    '6 Helium balloons, 3 colors, tied to the table. $15 - $20',
    15,
    'prod-evt-addon-012',
  ),
  complexAddOn(
    'evt-addon-024',
    'Themed Paperware',
    'Plates, napkins, cups, etc., to match a specific theme. $30 - $40',
    30,
    'prod-evt-addon-024',
  ),
  complexAddOn(
    'evt-addon-025',
    'Premium Backdrop',
    'Themed fabric or plastic backdrop for photos/cake table. $50 - $75',
    50,
    'prod-evt-addon-025',
  ),
  complexAddOn(
    'evt-addon-013',
    'Standard Balloon Garland',
    'A small, 6-foot, 3-color air-filled balloon garland. $120 - $175',
    120,
    'prod-evt-addon-013',
  ),
  complexAddOn(
    'evt-addon-014',
    'High Chair Banner',
    '"ONE" or themed banner for the birthday child\'s high chair. $15 - $20',
    15,
    'prod-evt-addon-014',
  ),
  complexAddOn(
    'evt-addon-015',
    'Goodie Bags',
    'Pre-assembled bags with 3-4 simple toys/treats. $5 - $7 / child',
    5,
    'prod-evt-addon-015',
    'PER_PERSON',
  ),
  simpleAddOn(
    'evt-addon-016',
    'Themed Craft Activity',
    'A 30-minute staff-led craft (e.g., coloring, simple painting, bracelet making). $50 - $75 + $3 / child',
    50,
  ),
  simpleAddOn(
    'evt-addon-017',
    'Face Painter / Balloon Artist',
    '1 Hour professional service. $150 - $200',
    150,
  ),
  simpleAddOn(
    'evt-addon-018',
    'Character Appearance',
    'A costumed character (Princess, Superhero, Mascot) for 30 minutes. $125 - $175',
    125,
  ),
  simpleAddOn(
    'evt-addon-019',
    'Digital Invitations',
    'Professionally designed, customizable digital file. $25 - $35',
    25,
  ),
  simpleAddOn(
    'evt-addon-020',
    'Additional 30 Minutes',
    'Extends the private room time slot. $75 - $100',
    75,
  ),
  simpleAddOn(
    'evt-addon-021',
    'Additional Party Host',
    'Extra host for a larger or more involved party. $50 - $65',
    50,
  ),
  simpleAddOn(
    'evt-addon-022',
    'Extra Child Guest',
    'Per child over the package limit. $15 - $20 / child',
    15,
    'PER_PERSON',
  ),
  simpleAddOn(
    'evt-addon-023',
    'Grip Socks',
    'Branded non-slip socks for children and/or adults. $3 - $4 / pair. Often a safety requirement.',
    3,
    'PER_PERSON',
  ),
]
