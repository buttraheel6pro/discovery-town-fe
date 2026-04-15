// ── SECTION 1: MOCK DATA FILE ───────────────────────────────────────────────
// Create: src/mocks/discovery-town.mock.ts
// This is the single source of truth for all mock data.

// ════════════════════════════════════════════════════════════════════════════
// 1.1 CONTACTS (Families)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CONTACTS = [
  {
    id: 'contact-001',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(317) 555-0142',
    contactType: 'INDIVIDUAL',
    tags: ['VIP', 'Member'],
    hasActiveMembership: true,
    planName: '1 Child Membership — Monthly',
    memberSince: '2024-01-15',
    totalVisits: 24,
    totalSpend: 1284.50,
    children: [
      { id: 'child-001a', firstName: 'Emma', lastName: 'Johnson', dob: '2019-03-14', ageYears: 5, relationship: 'PARENT_CHILD' },
      { id: 'child-001b', firstName: 'Liam', lastName: 'Johnson', dob: '2021-08-22', ageYears: 3, relationship: 'PARENT_CHILD' },
    ],
    address: '4821 Oak Tree Blvd, Carmel, IN 46032',
    notes: ['Liam has a peanut allergy — EpiPen on file at front desk.', 'Prefers morning sessions.'],
    creditBalance: 3,
  },
  {
    id: 'contact-002',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'mchen@techcorp.com',
    phone: '(317) 555-0287',
    contactType: 'INDIVIDUAL',
    tags: ['Regular'],
    hasActiveMembership: false,
    totalVisits: 8,
    totalSpend: 320.00,
    children: [
      { id: 'child-002a', firstName: 'Sophia', lastName: 'Chen', dob: '2018-11-05', ageYears: 6, relationship: 'PARENT_CHILD' },
    ],
    address: '1203 Maple Grove Dr, Fishers, IN 46038',
    notes: [],
    creditBalance: 5, // owns a Multi-Pass
  },
  {
    id: 'contact-003',
    firstName: 'Priya',
    lastName: 'Patel',
    email: 'priya.patel@gmail.com',
    phone: '(317) 555-0398',
    contactType: 'INDIVIDUAL',
    tags: ['New Customer'],
    hasActiveMembership: false,
    totalVisits: 1,
    totalSpend: 36.00,
    children: [
      { id: 'child-003a', firstName: 'Arjun', lastName: 'Patel', dob: '2020-06-18', ageYears: 4, relationship: 'PARENT_CHILD' },
      { id: 'child-003b', firstName: 'Ananya', lastName: 'Patel', dob: '2022-12-01', ageYears: 2, relationship: 'PARENT_CHILD' },
    ],
    address: '892 Willow Creek Ln, Westfield, IN 46074',
    notes: ['Referred by Sarah Johnson.'],
    creditBalance: 0,
  },
  {
    id: 'contact-004',
    firstName: 'Amanda',
    lastName: 'Williams',
    email: 'awilliams@email.com',
    phone: '(317) 555-0451',
    contactType: 'INDIVIDUAL',
    tags: ['VIP', 'Member', 'Frequent'],
    hasActiveMembership: true,
    planName: '2 Children Membership — Annual',
    memberSince: '2023-09-01',
    totalVisits: 47,
    totalSpend: 3890.00,
    children: [
      { id: 'child-004a', firstName: 'Olivia', lastName: 'Williams', dob: '2017-04-20', ageYears: 7, relationship: 'PARENT_CHILD' },
      { id: 'child-004b', firstName: 'Noah', lastName: 'Williams', dob: '2019-09-12', ageYears: 5, relationship: 'PARENT_CHILD' },
    ],
    address: '3344 Sunrise Court, Carmel, IN 46033',
    notes: ['Olivia is in the Bronze Gymnastics class every Tuesday.'],
    creditBalance: 0,
  },
  {
    id: 'contact-005',
    firstName: 'Discovery Town',
    lastName: 'Corporate',
    email: 'events@carmelchamber.org',
    phone: '(317) 555-0500',
    contactType: 'CORPORATE',
    companyName: 'Carmel Chamber of Commerce',
    tags: ['Corporate', 'Events'],
    hasActiveMembership: false,
    totalVisits: 3,
    totalSpend: 12500.00,
    children: [],
    address: '40 W Main St, Carmel, IN 46032',
    notes: ['Annual corporate kids day event — book every June.'],
    creditBalance: 0,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.2 SERVICE CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_SERVICE_CATEGORIES = [
  {
    id: 'cat-001',
    name: 'Open Play',
    description: 'Drop-in or pre-booked 2-hour play sessions for children.',
    bookingMode: 'OPEN',
    allowFamilyMember: true,
    requireCheckInBeforeRebook: true,
    freeInfantMonths: 6,
    isActive: true,
    serviceCount: 2,
    linkedAddOns: [
      { name: 'Additional Adult Guest', isFree: false, price: 10.00 },
      { name: 'Grip Socks', isFree: false, price: 4.00 },
    ],
    tags: ['Play', 'Family'],
  },
  {
    id: 'cat-002',
    name: 'Preschool Play Date',
    description: 'Structured play sessions for children ages 3–5. Snack and drink included.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: true,
    requireCheckInBeforeRebook: false,
    freeInfantMonths: 0,
    ageMin: 3,
    ageMax: 5,
    isActive: true,
    serviceCount: 1,
    linkedAddOns: [
      { name: 'Juice Box', isFree: true, price: 0 },
      { name: 'Snack Pack', isFree: false, price: 2.00 },
    ],
    tags: ['Preschool', 'Structured'],
  },
  {
    id: 'cat-003',
    name: 'Gym — Preschool (3–5 years)',
    description: 'KinderGym, Lil\' Ninjas, PeeWee Sports, Interactive Story-Move.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    ageMin: 3,
    ageMax: 5,
    isActive: true,
    serviceCount: 4,
    linkedAddOns: [],
    tags: ['Gym', 'Fitness'],
  },
  {
    id: 'cat-004',
    name: 'Gym — Grade School (6–12 years)',
    description: 'Gymnastics, Ninja Warrior, Speed & Agility, Exer-Gaming.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    ageMin: 6,
    ageMax: 12,
    isActive: true,
    serviceCount: 6,
    linkedAddOns: [],
    tags: ['Gym', 'Fitness'],
  },
  {
    id: 'cat-005',
    name: 'Gym — Adults (18–65 years)',
    description: 'HIIT, Cardio Kickboxing, Power Yoga, Barre, Functional Strength.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    ageMin: 18,
    ageMax: 65,
    isActive: true,
    serviceCount: 6,
    linkedAddOns: [],
    tags: ['Gym', 'Adult'],
  },
  {
    id: 'cat-006',
    name: 'Party & Events',
    description: 'Private party room bookings and exclusive venue events.',
    bookingMode: 'OPEN',
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    isActive: true,
    serviceCount: 2,
    linkedAddOns: [
      { name: 'Additional Pizza (1-topping)', isFree: false, price: 22.00 },
      { name: 'Custom Cupcakes (1 Dozen)', isFree: false, price: 40.00 },
      { name: 'Face Painter (1hr)', isFree: false, price: 150.00 },
      { name: 'Grip Socks', isFree: false, price: 3.00 },
      { name: 'Goodie Bags', isFree: false, price: 6.00 },
      { name: 'Additional Party Host', isFree: false, price: 50.00 },
    ],
    tags: ['Events', 'Party'],
  },
  {
    id: 'cat-007',
    name: 'Parents Night Out',
    description: 'Saturday evening supervised play while parents enjoy a night off.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: true,
    requireCheckInBeforeRebook: false,
    ageMin: 0,
    ageMax: 7,
    isActive: true,
    serviceCount: 1,
    linkedAddOns: [],
    tags: ['Play', 'Evening'],
  },
  {
    id: 'cat-008',
    name: 'Learn — Tutoring',
    description: 'Academic tutoring K–12, test prep, and enrichment programs.',
    bookingMode: 'SCHEDULED',
    allowFamilyMember: false,
    requireCheckInBeforeRebook: false,
    isActive: true,
    serviceCount: 8,
    linkedAddOns: [],
    tags: ['Learn', 'Tutoring'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.3 SERVICES
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_SERVICES = [
  {
    id: 'svc-001',
    categoryId: 'cat-001',
    name: '2-Hour Play Pass',
    description: 'Open play access for 2 hours. Children explore all play areas with full facility access.',
    bookingMode: 'OPEN',
    basePrice: 12.00,
    memberPrice: 0.00,
    siblingPrice: 10.00,
    freeAdultCount: 2,
    additionalAdultPrice: 10.00,
    minSeats: 1,
    maxChildSeats: null,
    maxAdultSeats: null,
    minAdvanceHours: 0,
    maxAdvanceHours: 168,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-002',
    categoryId: 'cat-001',
    name: 'Multi-Pass (5 Sessions)',
    description: '5 open play admissions to use at any time within 12 months.',
    bookingMode: 'OPEN',
    basePrice: 50.00,
    memberPrice: 40.00,
    isPackageService: false,
    isActive: true,
    isCreditPack: true,
    credits: 5,
    validityDays: 365,
  },
  {
    id: 'svc-003',
    categoryId: 'cat-002',
    name: 'Preschool Play Date — Thursdays 11am',
    description: 'Weekly structured play session for preschoolers ages 3–5. Includes snack and juice box.',
    bookingMode: 'SCHEDULED',
    basePrice: 12.00,
    memberPrice: 0.00,
    minSeats: 1,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-004',
    categoryId: 'cat-003',
    name: 'KinderGym',
    description: 'Introduction to basic gymnastics shapes and junior equipment for ages 3–5.',
    bookingMode: 'SCHEDULED',
    basePrice: 18.00,
    memberPrice: 14.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-005',
    categoryId: 'cat-003',
    name: "Lil' Ninjas (Strength & Agility)",
    description: 'High-energy obstacle courses for ages 3–5. Jump, land, swing, and climb!',
    bookingMode: 'SCHEDULED',
    basePrice: 18.00,
    memberPrice: 14.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-006',
    categoryId: 'cat-004',
    name: 'Bronze Gymnastics',
    description: 'Cartwheel, handstand, bridge, and bar pullover for beginners ages 6–12.',
    bookingMode: 'SCHEDULED',
    basePrice: 22.00,
    memberPrice: 17.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-007',
    categoryId: 'cat-004',
    name: 'Warrior Zone',
    description: 'Parkour-style training: wall runs, vaulting, grip challenges, and timed courses.',
    bookingMode: 'SCHEDULED',
    basePrice: 22.00,
    memberPrice: 17.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-008',
    categoryId: 'cat-005',
    name: 'Burn & Firm HIIT',
    description: '45 minutes of high-intensity intervals alternating cardio and resistance.',
    bookingMode: 'SCHEDULED',
    basePrice: 20.00,
    memberPrice: 15.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-009',
    categoryId: 'cat-005',
    name: 'Power Yoga',
    description: 'Vigorous vinyasa flow to build heat, flexibility, and core stability.',
    bookingMode: 'SCHEDULED',
    basePrice: 18.00,
    memberPrice: 13.00,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-010',
    categoryId: 'cat-006',
    name: 'Party & Event Booking',
    description: 'Choose from 6 party packages — from intimate play room parties to exclusive venue hire.',
    bookingMode: 'OPEN',
    basePrice: 0,
    isPackageService: true,
    isActive: true,
  },
  {
    id: 'svc-011',
    categoryId: 'cat-007',
    name: 'Parents Night Out',
    description: 'Saturday evenings 4–7pm. Ages 6 months to 7 years. Supervised play while you enjoy your evening.',
    bookingMode: 'SCHEDULED',
    basePrice: 50.00,
    siblingPrice: 40.00,
    memberPrice: 40.00,
    minSeats: 1,
    minAdvanceHours: 24,
    isPackageService: false,
    isActive: true,
  },
  {
    id: 'svc-012',
    categoryId: 'cat-008',
    name: 'Pre-Algebra & Algebra I Tutoring',
    description: 'One-on-one or small group math tutoring for grades 6–8.',
    bookingMode: 'SCHEDULED',
    basePrice: 65.00,
    memberPrice: 55.00,
    minSeats: 1,
    maxChildSeats: 4,
    isPackageService: false,
    isActive: true,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.4 SERVICE SLOTS (upcoming sessions for the next 4 weeks)
// ════════════════════════════════════════════════════════════════════════════
// Generate relative to today so dates are always "upcoming" for the demo.
// Use a helper: addDays(today, n) to keep dates dynamic.

export const MOCK_SERVICE_SLOTS = [
  // Preschool Play Date — 8 Thursdays
  { id: 'slot-001', serviceId: 'svc-003', day: 'Thursday', time: '11:00 AM', duration: 90, capacity: 20, bookedCount: 14, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-002', serviceId: 'svc-003', day: 'Thursday', time: '11:00 AM', duration: 90, capacity: 20, bookedCount: 18, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 1 },
  { id: 'slot-003', serviceId: 'svc-003', day: 'Thursday', time: '11:00 AM', duration: 90, capacity: 20, bookedCount: 20, checkInCount: 0, isActive: true, status: 'FULL', weekOffset: 2 },
  { id: 'slot-004', serviceId: 'svc-003', day: 'Thursday', time: '11:00 AM', duration: 90, capacity: 20, bookedCount: 8, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 3 },

  // KinderGym — Mon/Wed/Fri mornings
  { id: 'slot-005', serviceId: 'svc-004', day: 'Monday', time: '9:30 AM', duration: 45, capacity: 12, bookedCount: 10, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-006', serviceId: 'svc-004', day: 'Wednesday', time: '9:30 AM', duration: 45, capacity: 12, bookedCount: 7, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-007', serviceId: 'svc-004', day: 'Friday', time: '9:30 AM', duration: 45, capacity: 12, bookedCount: 12, checkInCount: 0, isActive: true, status: 'FULL', weekOffset: 0 },

  // Warrior Zone — Tue/Thu afternoons
  { id: 'slot-008', serviceId: 'svc-007', day: 'Tuesday', time: '4:00 PM', duration: 60, capacity: 15, bookedCount: 9, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-009', serviceId: 'svc-007', day: 'Thursday', time: '4:00 PM', duration: 60, capacity: 15, bookedCount: 13, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },

  // Burn & Firm HIIT — Mon/Wed/Fri early morning
  { id: 'slot-010', serviceId: 'svc-008', day: 'Monday', time: '5:30 AM', duration: 45, capacity: 20, bookedCount: 18, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-011', serviceId: 'svc-008', day: 'Wednesday', time: '5:30 AM', duration: 45, capacity: 20, bookedCount: 11, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },

  // Power Yoga — Tue/Thu evening
  { id: 'slot-012', serviceId: 'svc-009', day: 'Tuesday', time: '6:00 PM', duration: 60, capacity: 18, bookedCount: 15, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },

  // Parents Night Out — Saturdays
  { id: 'slot-013', serviceId: 'svc-011', day: 'Saturday', time: '4:00 PM', duration: 180, capacity: 25, bookedCount: 19, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 0 },
  { id: 'slot-014', serviceId: 'svc-011', day: 'Saturday', time: '4:00 PM', duration: 180, capacity: 25, bookedCount: 4, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 1 },
  { id: 'slot-015', serviceId: 'svc-011', day: 'Saturday', time: '4:00 PM', duration: 180, capacity: 25, bookedCount: 0, checkInCount: 0, isActive: true, status: 'SCHEDULED', weekOffset: 2 },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.5 MEMBERSHIP PLANS
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_PLANS = [
  {
    id: 'plan-001',
    name: '1 Child Membership — Monthly',
    billingPeriod: 'MONTHLY',
    price: 45.00,
    monthlyPrice: 45.00,
    annualPrice: 450.00,
    allowFamilyMember: true,
    isHouseholdOnly: false,
    maxChildren: 1,
    isActive: true,
    subscriberCount: 38,
    features: [
      'Unlimited open play sessions',
      'Discounted birthday party packages',
      '2 pairs of complimentary grip socks per year',
      '10% off all shop purchases',
      '1 free specialty coffee per month',
    ],
    linkedAddOns: [
      { name: 'Grip Socks', isIncluded: true, discountPercent: null },
    ],
    linkedCoupons: [
      { code: 'MEMBER10', description: '10% off all orders', discountValue: 10, discountType: 'PERCENTAGE' },
    ],
  },
  {
    id: 'plan-002',
    name: '1 Child Membership — Annual',
    billingPeriod: 'ANNUAL',
    price: 450.00,
    monthlyPrice: 45.00,
    annualPrice: 450.00,
    allowFamilyMember: true,
    isHouseholdOnly: false,
    maxChildren: 1,
    isActive: true,
    subscriberCount: 22,
    features: [
      'Unlimited open play sessions',
      'Discounted birthday party packages',
      '2 pairs of complimentary grip socks per year',
      '10% off all shop purchases',
      '1 free specialty coffee per month',
      'Save $90 vs monthly billing',
    ],
    linkedAddOns: [
      { name: 'Grip Socks', isIncluded: true, discountPercent: null },
    ],
    linkedCoupons: [
      { code: 'MEMBER10', description: '10% off all orders', discountValue: 10, discountType: 'PERCENTAGE' },
    ],
  },
  {
    id: 'plan-003',
    name: '2 Children Membership — Monthly',
    billingPeriod: 'MONTHLY',
    price: 80.00,
    monthlyPrice: 80.00,
    annualPrice: 800.00,
    allowFamilyMember: true,
    isHouseholdOnly: false,
    maxChildren: 2,
    isActive: true,
    subscriberCount: 19,
    features: [
      'Unlimited open play for up to 2 children',
      'Discounted birthday party packages',
      '2 pairs of complimentary grip socks per year',
      '10% off all shop purchases',
      '1 free specialty coffee per month',
    ],
    linkedAddOns: [
      { name: 'Grip Socks', isIncluded: true, discountPercent: null },
    ],
    linkedCoupons: [
      { code: 'MEMBER10', description: '10% off all orders', discountValue: 10, discountType: 'PERCENTAGE' },
      { code: 'MEMBER20', description: '20% off first booking', discountValue: 20, discountType: 'PERCENTAGE' },
    ],
  },
  {
    id: 'plan-004',
    name: '2 Children Membership — Annual',
    billingPeriod: 'ANNUAL',
    price: 800.00,
    monthlyPrice: 80.00,
    annualPrice: 800.00,
    allowFamilyMember: true,
    isHouseholdOnly: false,
    maxChildren: 2,
    isActive: true,
    subscriberCount: 14,
    features: [
      'Unlimited open play for up to 2 children',
      'Discounted birthday party packages',
      '2 pairs of complimentary grip socks per year',
      '10% off all shop purchases',
      '1 free specialty coffee per month',
      'Save $160 vs monthly billing',
    ],
    linkedAddOns: [],
    linkedCoupons: [],
  },
  {
    id: 'plan-005',
    name: 'Seasonal Pass — 1 Child',
    billingPeriod: 'QUARTERLY',
    price: 130.00,
    monthlyPrice: null,
    annualPrice: null,
    allowFamilyMember: true,
    isHouseholdOnly: true,
    maxChildren: 1,
    isActive: true,
    subscriberCount: 9,
    features: [
      'Unlimited play for 3 months',
      'Household children only',
      '10% off all shop purchases',
      '1 free specialty coffee per month',
    ],
    linkedAddOns: [],
    linkedCoupons: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.6 COUPONS
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_COUPONS = [
  {
    id: 'coupon-001',
    code: 'WELCOME10',
    description: '10% off your first booking at Discovery Town',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    isActive: true,
    usageCount: 142,
    usageLimit: null,
    expiresAt: null,
    planRestricted: false,
    applicableTo: ['BOOKING', 'ORDER'],
  },
  {
    id: 'coupon-002',
    code: 'MEMBER10',
    description: '10% off all orders — exclusive to members',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    isActive: true,
    usageCount: 890,
    usageLimit: null,
    expiresAt: null,
    planRestricted: true,
    planIds: ['plan-001', 'plan-002', 'plan-003', 'plan-004'],
    applicableTo: ['BOOKING', 'ORDER', 'SUBSCRIPTION'],
  },
  {
    id: 'coupon-003',
    code: 'MEMBER20',
    description: '20% off your first party booking — members only',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    isActive: true,
    usageCount: 34,
    usageLimit: null,
    expiresAt: null,
    planRestricted: true,
    planIds: ['plan-003', 'plan-004'],
    applicableTo: ['BOOKING'],
  },
  {
    id: 'coupon-004',
    code: 'SUMMER25',
    description: '$25 off any party package',
    discountType: 'FLAT',
    discountValue: 25,
    isActive: true,
    usageCount: 18,
    usageLimit: 50,
    expiresAt: '2025-08-31',
    planRestricted: false,
    applicableTo: ['BOOKING'],
  },
  {
    id: 'coupon-005',
    code: 'BIRTHDAY50',
    description: '$50 off birthday party packages — for members',
    discountType: 'FLAT',
    discountValue: 50,
    isActive: true,
    usageCount: 7,
    usageLimit: null,
    expiresAt: null,
    planRestricted: true,
    planIds: ['plan-001', 'plan-002', 'plan-003', 'plan-004'],
    applicableTo: ['BOOKING'],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.7 EVENT PACKAGES (Party Packages)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_EVENT_PACKAGES = [
  {
    id: 'pkg-001',
    serviceId: 'svc-010',
    name: 'The Mini-Play',
    tier: 'SILVER',
    basePrice: 300.00,
    depositAmount: null,
    depositNonRefundable: false,
    isWholeVenue: false,
    requiresApproval: false,
    minChildSeats: 1,
    maxChildSeats: 8,
    minAdultSeats: 0,
    maxAdultSeats: 16,
    additionalChildPrice: 15.00,
    staffCount: 0,
    partyRoomCount: 1,
    durationMinutes: 120,
    setupMinutes: 20,
    features: [
      '2 hours private party room',
      'General admission for all guests',
      'Room setup and cleanup',
      'Solid-color plates, napkins, cups, and utensils',
      'Ice water pitchers for all guests',
      'Basic table covers',
      '+$15 per extra child (over 8)',
    ],
    includedAddOns: [],
    bookingCount: 12,
  },
  {
    id: 'pkg-002',
    serviceId: 'svc-010',
    name: 'The Classic Fun',
    tier: 'SILVER',
    basePrice: 425.00,
    depositAmount: null,
    depositNonRefundable: false,
    isWholeVenue: false,
    requiresApproval: false,
    minChildSeats: 1,
    maxChildSeats: 12,
    minAdultSeats: 0,
    maxAdultSeats: 24,
    additionalChildPrice: 25.00,
    staffCount: 1,
    partyRoomCount: 1,
    durationMinutes: 120,
    setupMinutes: 20,
    features: [
      '2 hours private party room',
      'Dedicated Party Host',
      'Full general play admission for all guests',
      '1 juice box per child',
      'Unlimited drip coffee & tea for adults',
      'Happy Birthday banner',
      '+$25 per extra child (over 12)',
    ],
    includedAddOns: [],
    bookingCount: 28,
  },
  {
    id: 'pkg-003',
    serviceId: 'svc-010',
    name: 'The VIP Play',
    tier: 'GOLD',
    basePrice: 675.00,
    depositAmount: null,
    depositNonRefundable: false,
    isWholeVenue: false,
    requiresApproval: false,
    minChildSeats: 1,
    maxChildSeats: 18,
    minAdultSeats: 0,
    maxAdultSeats: 36,
    additionalChildPrice: 30.00,
    staffCount: 2,
    partyRoomCount: 1,
    durationMinutes: 120,
    setupMinutes: 20,
    features: [
      '2 hours private party room',
      'Dedicated Host + Runner',
      'Full general play for all guests',
      '2 large 1-topping pizzas',
      'Themed digital invitations',
      '1 juice box per child',
      'Unlimited coffee & tea for adults',
      '+$30 per extra child (over 18)',
    ],
    includedAddOns: [
      { name: '2 Large 1-Topping Pizzas', pricingType: 'FLAT', price: 0 },
      { name: 'Themed Digital Invitations', pricingType: 'FLAT', price: 0 },
    ],
    bookingCount: 19,
  },
  {
    id: 'pkg-004',
    serviceId: 'svc-010',
    name: 'The Midnight Play',
    tier: 'GOLD',
    basePrice: 2095.00,
    depositAmount: 500.00,
    depositNonRefundable: true,
    isWholeVenue: true,
    requiresApproval: true,
    minChildSeats: 0,
    maxChildSeats: null,
    minAdultSeats: 0,
    maxAdultSeats: 50,
    additionalChildPrice: null,
    staffCount: 3,
    partyRoomCount: 2,
    durationMinutes: 150,
    setupMinutes: 30,
    features: [
      'Exclusive access to entire facility',
      '2 private party rooms',
      '2.5 hours party time + 30 min setup',
      '3 dedicated staff (hosts & baristas)',
      'Unlimited ice water',
      'Unlimited drip coffee & tea',
      'Basic paper products for 50 guests',
      'Background music',
      '$500 non-refundable deposit to secure date',
    ],
    includedAddOns: [],
    bookingCount: 4,
  },
  {
    id: 'pkg-005',
    serviceId: 'svc-010',
    name: 'The All-Star Takeover',
    tier: 'PLATINUM',
    basePrice: 3100.00,
    depositAmount: 750.00,
    depositNonRefundable: true,
    isWholeVenue: true,
    requiresApproval: true,
    minChildSeats: 0,
    maxChildSeats: null,
    minAdultSeats: 0,
    maxAdultSeats: 75,
    additionalChildPrice: null,
    staffCount: 4,
    partyRoomCount: 2,
    durationMinutes: 150,
    setupMinutes: 30,
    features: [
      'Exclusive access to entire facility',
      '2 private party rooms',
      '2.5 hours party time + 30 min setup',
      '4 dedicated staff',
      '4 large 1-topping pizzas',
      'Unlimited premium drink package (lemonade & iced tea)',
      'Standard balloon garland (6ft)',
      '2 dozen custom cupcakes',
      'Basic staff-led group game',
      '$750 non-refundable deposit',
    ],
    includedAddOns: [
      { name: '4 Large 1-Topping Pizzas', pricingType: 'FLAT', price: 0 },
      { name: 'Premium Drink Package', pricingType: 'FLAT', price: 0 },
      { name: 'Standard Balloon Garland (6ft)', pricingType: 'FLAT', price: 0 },
      { name: '2 Dozen Custom Cupcakes', pricingType: 'FLAT', price: 0 },
    ],
    bookingCount: 2,
  },
  {
    id: 'pkg-006',
    serviceId: 'svc-010',
    name: 'The Ultimate Exclusive',
    tier: 'PLATINUM',
    basePrice: 4500.00,
    depositAmount: 1000.00,
    depositNonRefundable: true,
    isWholeVenue: true,
    requiresApproval: true,
    minChildSeats: 0,
    maxChildSeats: null,
    minAdultSeats: 0,
    maxAdultSeats: 100,
    additionalChildPrice: null,
    staffCount: 5,
    partyRoomCount: 2,
    durationMinutes: 180,
    setupMinutes: 30,
    features: [
      'Exclusive access to entire facility',
      '2 private party rooms',
      '3 hours party time + 30 min setup',
      '5 dedicated staff (Manager, Hosts, Runner, Barista)',
      '6 large 1-topping pizzas',
      'Unlimited premium drink package',
      'Adult appetizer tray',
      'Premium themed paperware for 100 guests',
      'Custom 10ft balloon garland',
      'Premium photo backdrop',
      '3 dozen custom cupcakes',
      'Premium goodie bags for up to 20 children',
      '1-hour character appearance (Princess/Superhero)',
      '$1,000 non-refundable deposit',
    ],
    includedAddOns: [
      { name: '6 Large 1-Topping Pizzas', pricingType: 'FLAT', price: 0 },
      { name: 'Premium Drink Package', pricingType: 'FLAT', price: 0 },
      { name: 'Adult Appetizer Tray', pricingType: 'FLAT', price: 0 },
      { name: 'Custom 10ft Balloon Garland', pricingType: 'FLAT', price: 0 },
      { name: 'Premium Photo Backdrop', pricingType: 'FLAT', price: 0 },
      { name: '3 Dozen Custom Cupcakes', pricingType: 'FLAT', price: 0 },
      { name: 'Premium Goodie Bags (20 children)', pricingType: 'FLAT', price: 0 },
      { name: '1-Hour Character Appearance', pricingType: 'FLAT', price: 0 },
    ],
    bookingCount: 1,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.8 ADD-ONS
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_ADDONS = [
  // Food & Beverage
  { id: 'addon-001', name: 'Additional Pizza (1-Topping, Large)', category: 'Food & Beverage', pricingType: 'FLAT', referenceType: 'ALL', price: 22.00, isActive: true },
  { id: 'addon-002', name: 'Adult Appetizer Tray (Fruit / Veggie & Dip / Cheese & Crackers)', category: 'Food & Beverage', pricingType: 'FLAT', referenceType: 'ALL', price: 40.00, isActive: true },
  { id: 'addon-003', name: 'Snack Basket (chips, pretzels, goldfish — serves 10 kids)', category: 'Food & Beverage', pricingType: 'FLAT', referenceType: 'ALL', price: 22.00, isActive: true },
  { id: 'addon-004', name: 'Premium Drink Package (unlimited lemonade & flavored iced tea)', category: 'Food & Beverage', pricingType: 'FLAT', referenceType: 'ALL', price: 50.00, isActive: true },
  { id: 'addon-005', name: 'Specialty Coffee Bar (espresso, syrups, flavored creamers)', category: 'Food & Beverage', pricingType: 'FLAT', referenceType: 'ALL', price: 75.00, isActive: true },
  // Desserts
  { id: 'addon-006', name: 'Custom Cupcakes — 1 Dozen (themed or custom colors)', category: 'Dessert & Sweets', pricingType: 'FLAT', referenceType: 'ALL', price: 45.00, isActive: true },
  { id: 'addon-007', name: 'Gourmet Donut Wall (2–3 dozen donuts)', category: 'Dessert & Sweets', pricingType: 'FLAT', referenceType: 'ALL', price: 65.00, isActive: true },
  { id: 'addon-008', name: 'Ice Cream Cups or Popsicles (per 12)', category: 'Dessert & Sweets', pricingType: 'FLAT', referenceType: 'ALL', price: 35.00, isActive: true },
  { id: 'addon-009', name: '"Make Your Own" Cookie/Cupcake Decorating Station', category: 'Dessert & Sweets', pricingType: 'PER_PERSON', referenceType: 'CHILD', price: 7.00, isActive: true },
  // Decor
  { id: 'addon-010', name: 'Simple Balloon Bouquet (6 helium, 3 colors, table-tied)', category: 'Decor & Theme', pricingType: 'FLAT', referenceType: 'ALL', price: 18.00, isActive: true },
  { id: 'addon-011', name: 'Themed Paperware (plates, napkins, cups — Unicorns, Dinos, etc.)', category: 'Decor & Theme', pricingType: 'FLAT', referenceType: 'ALL', price: 35.00, isActive: true },
  { id: 'addon-012', name: 'Premium Photo Backdrop (fabric or plastic, themed)', category: 'Decor & Theme', pricingType: 'FLAT', referenceType: 'ALL', price: 60.00, isActive: true },
  { id: 'addon-013', name: 'Standard Balloon Garland (6ft, 3-color, air-filled)', category: 'Decor & Theme', pricingType: 'FLAT', referenceType: 'ALL', price: 150.00, isActive: true },
  { id: 'addon-014', name: 'High Chair Banner ("ONE" or themed for birthday child)', category: 'Decor & Theme', pricingType: 'FLAT', referenceType: 'ALL', price: 18.00, isActive: true },
  // Entertainment
  { id: 'addon-015', name: 'Goodie Bags (pre-assembled, 3–4 toys/treats per bag)', category: 'Entertainment & Favors', pricingType: 'PER_PERSON', referenceType: 'CHILD', price: 6.00, isActive: true },
  { id: 'addon-016', name: 'Themed Craft Activity — 30min staff-led (coloring, painting, bracelets)', category: 'Entertainment & Favors', pricingType: 'PER_PERSON', referenceType: 'CHILD', price: 3.00, baseSetupFee: 60.00, isActive: true },
  { id: 'addon-017', name: 'Face Painter / Balloon Artist (1 hour professional)', category: 'Entertainment & Favors', pricingType: 'FLAT', referenceType: 'ALL', price: 175.00, isActive: true },
  { id: 'addon-018', name: 'Character Appearance — 30 min (Princess, Superhero, or Mascot)', category: 'Entertainment & Favors', pricingType: 'FLAT', referenceType: 'ALL', price: 150.00, isActive: true },
  { id: 'addon-019', name: 'Digital Invitations (professionally designed, customizable file)', category: 'Entertainment & Favors', pricingType: 'FLAT', referenceType: 'ALL', price: 30.00, isActive: true },
  // Logistics
  { id: 'addon-020', name: 'Additional 30 Minutes (party room time extension)', category: 'Time & Logistics', pricingType: 'FLAT', referenceType: 'ALL', price: 90.00, isActive: true },
  { id: 'addon-021', name: 'Additional Party Host (extra staff member for larger parties)', category: 'Time & Logistics', pricingType: 'FLAT', referenceType: 'ALL', price: 55.00, isActive: true },
  { id: 'addon-022', name: 'Extra Child Guest (over the package child limit)', category: 'Time & Logistics', pricingType: 'PER_PERSON', referenceType: 'CHILD', price: 18.00, isActive: true },
  { id: 'addon-023', name: 'Grip Socks — Branded Discovery Town (per pair)', category: 'Time & Logistics', pricingType: 'PER_PERSON', referenceType: 'GUEST', price: 4.00, isActive: true, linkedProductId: 'prod-003' },
  // Open play
  { id: 'addon-024', name: 'Additional Adult Guest', category: 'Open Play', pricingType: 'PER_PERSON', referenceType: 'ADULT', price: 10.00, isActive: true },
  { id: 'addon-025', name: 'Juice Box', category: 'Open Play', pricingType: 'FLAT', referenceType: 'CHILD', price: 2.00, isActive: true },
  { id: 'addon-026', name: 'Snack Pack (crackers, cheese, fruit)', category: 'Open Play', pricingType: 'FLAT', referenceType: 'ALL', price: 3.00, isActive: true },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.9 BOOKINGS (upcoming + recent)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_BOOKINGS = [
  {
    id: 'booking-001',
    contactId: 'contact-001',
    contactName: 'Sarah Johnson',
    serviceId: 'svc-003',
    serviceName: 'Preschool Play Date',
    slotId: 'slot-001',
    status: 'CONFIRMED',
    totalAmount: 24.00,
    paidAmount: 24.00,
    participants: ['Emma Johnson (5yr)', 'Liam Johnson (3yr)'],
    adultCount: 1,
    checkedInAt: null,
    createdAt: '2025-04-08T09:15:00Z',
    paymentMethod: 'CARD',
    notes: [],
    isStaffAssisted: false,
    addOns: [],
  },
  {
    id: 'booking-002',
    contactId: 'contact-002',
    contactName: 'Michael Chen',
    serviceId: 'svc-011',
    serviceName: 'Parents Night Out',
    slotId: 'slot-013',
    status: 'CONFIRMED',
    totalAmount: 50.00,
    paidAmount: 50.00,
    participants: ['Sophia Chen (6yr)'],
    adultCount: 0,
    checkedInAt: null,
    createdAt: '2025-04-07T14:30:00Z',
    paymentMethod: 'CARD',
    notes: ['Sophia is shy at first — give her 10 minutes to warm up.'],
    isStaffAssisted: false,
    addOns: [],
  },
  {
    id: 'booking-003',
    contactId: 'contact-004',
    contactName: 'Amanda Williams',
    serviceId: 'svc-006',
    serviceName: 'Bronze Gymnastics',
    slotId: 'slot-008',
    status: 'CONFIRMED',
    totalAmount: 22.00,
    paidAmount: 22.00,
    participants: ['Olivia Williams (7yr)'],
    adultCount: 1,
    checkedInAt: null,
    createdAt: '2025-04-06T10:00:00Z',
    paymentMethod: 'MEMBER_CREDIT',
    notes: [],
    isStaffAssisted: false,
    addOns: [],
  },
  {
    id: 'booking-004',
    contactId: 'contact-001',
    contactName: 'Sarah Johnson',
    serviceId: 'svc-010',
    serviceName: 'Party & Event Booking',
    packageId: 'pkg-003',
    packageName: 'The VIP Play',
    status: 'CONFIRMED',
    eventType: 'BIRTHDAY',
    birthdayChildName: 'Emma Johnson',
    birthdayChildAge: 6,
    totalAmount: 825.00,
    paidAmount: 825.00,
    childCount: 12,
    adultCount: 20,
    scheduledDate: '2025-05-10',
    scheduledTime: '2:00 PM',
    assignedRoom: 'Party Room A',
    checkedInAt: null,
    createdAt: '2025-04-01T11:00:00Z',
    paymentMethod: 'CARD',
    notes: ['Emma\'s favorite color is purple. Request purple balloon bouquet.'],
    isStaffAssisted: false,
    addOns: [
      { name: 'Face Painter (1hr)', price: 150.00 },
    ],
  },
  {
    id: 'booking-005',
    contactId: 'contact-005',
    contactName: 'Carmel Chamber of Commerce',
    serviceId: 'svc-010',
    serviceName: 'Party & Event Booking',
    packageId: 'pkg-004',
    packageName: 'The Midnight Play',
    status: 'PENDING_APPROVAL',
    eventType: 'CORPORATE',
    totalAmount: 2095.00,
    depositAmount: 500.00,
    childCount: 40,
    adultCount: 60,
    scheduledDate: '2025-06-14',
    scheduledTime: '6:00 PM',
    checkedInAt: null,
    createdAt: '2025-04-09T09:00:00Z',
    paymentMethod: null,
    notes: ['Annual kids day event for chamber members and their families.'],
    isStaffAssisted: false,
    addOns: [],
  },
  {
    id: 'booking-006',
    contactId: 'contact-001',
    contactName: 'Sarah Johnson',
    serviceId: 'svc-001',
    serviceName: '2-Hour Play Pass',
    status: 'CONFIRMED',
    totalAmount: 0.00, // member — plays free
    paidAmount: 0.00,
    participants: ['Emma Johnson (5yr)', 'Liam Johnson (3yr)'],
    adultCount: 2,
    checkedInAt: null,
    createdAt: '2025-04-10T08:00:00Z',
    paymentMethod: 'MEMBER_BENEFIT',
    notes: [],
    isStaffAssisted: true,
    actedByStaff: 'Jessica M. (Front Desk)',
    addOns: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.10 PRODUCTS (Kids Shop + Take Out Party + Cafe)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_PRODUCTS = [
  // Kids Shop — Toys
  { id: 'prod-001', categoryPath: ['Kids Shop', 'Toys'], name: 'Discovery Town Fidget Explorer Kit', price: 24.99, memberPrice: 22.49, stockQuantity: 18, canBeAddOn: false, isActive: true },
  { id: 'prod-002', categoryPath: ['Kids Shop', 'Toys'], name: 'Foam Building Blocks Set (48 pieces)', price: 39.99, memberPrice: 35.99, stockQuantity: 11, canBeAddOn: false, isActive: true },
  // Kids Shop — Clothes
  { id: 'prod-003', categoryPath: ['Kids Shop', 'Clothes'], name: 'Discovery Town Grip Socks (Children)', price: 4.00, memberPrice: 3.60, stockQuantity: 200, canBeAddOn: true, linkedAddOnId: 'addon-023', linkedAddOnName: 'Grip Socks — Branded Discovery Town', isActive: true },
  { id: 'prod-004', categoryPath: ['Kids Shop', 'Clothes'], name: 'Discovery Town T-Shirt (Toddler)', price: 18.00, memberPrice: 16.20, stockQuantity: 45, canBeAddOn: false, isActive: true },
  { id: 'prod-005', categoryPath: ['Kids Shop', 'Clothes'], name: 'Discovery Town Baseball Cap', price: 22.00, memberPrice: 19.80, stockQuantity: 30, canBeAddOn: false, isActive: true },
  // Kids Shop — Furniture
  { id: 'prod-006', categoryPath: ['Kids Shop', 'Furniture'], name: 'Junior Activity Table & Chair Set', price: 189.00, memberPrice: 170.10, stockQuantity: 3, canBeAddOn: false, isActive: true },
  // Take Out Party
  { id: 'prod-007', categoryPath: ['Take Out Party', 'Desserts'], name: 'Custom Cupcakes — 1 Dozen (themed)', price: 40.00, memberPrice: 36.00, stockQuantity: 999, canBeAddOn: true, linkedAddOnId: 'addon-006', linkedAddOnName: 'Custom Cupcakes — 1 Dozen', isActive: true },
  { id: 'prod-008', categoryPath: ['Take Out Party', 'Decor'], name: 'Balloon Bouquet Kit (6 helium, 3 colors)', price: 15.00, memberPrice: 13.50, stockQuantity: 50, canBeAddOn: false, isActive: true },
  { id: 'prod-009', categoryPath: ['Take Out Party', 'Food & Drinks'], name: 'Party Snack Basket (chips, pretzels, goldfish)', price: 22.00, memberPrice: 19.80, stockQuantity: 30, canBeAddOn: false, isActive: true },
  { id: 'prod-010', categoryPath: ['Take Out Party', 'Entertainment'], name: 'Pre-Assembled Goodie Bags (set of 10)', price: 55.00, memberPrice: 49.50, stockQuantity: 20, canBeAddOn: false, isActive: true },
  // Cafe — branded retail
  { id: 'prod-011', categoryPath: ['Cafe Menu', 'Retail'], name: 'Discovery Town House Blend Coffee (4oz bag)', price: 12.00, memberPrice: 10.80, stockQuantity: 60, canBeAddOn: false, isActive: true },
  { id: 'prod-012', categoryPath: ['Cafe Menu', 'Retail'], name: 'Discovery Town Travel Mug (16oz)', price: 28.00, memberPrice: 25.20, stockQuantity: 25, canBeAddOn: false, isActive: true },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.11 PRODUCT CATEGORIES
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_PRODUCT_CATEGORIES = [
  { id: 'pcat-001', name: 'Kids Shop', parentId: null, displayOrder: 1, productCount: 5 },
  { id: 'pcat-002', name: 'Toys', parentId: 'pcat-001', displayOrder: 1, productCount: 2 },
  { id: 'pcat-003', name: 'Clothes', parentId: 'pcat-001', displayOrder: 2, productCount: 2 },
  { id: 'pcat-004', name: 'Furniture', parentId: 'pcat-001', displayOrder: 3, productCount: 1 },
  { id: 'pcat-005', name: 'Take Out Party', parentId: null, displayOrder: 2, productCount: 4 },
  { id: 'pcat-006', name: 'Food & Drinks', parentId: 'pcat-005', displayOrder: 1, productCount: 1 },
  { id: 'pcat-007', name: 'Desserts', parentId: 'pcat-005', displayOrder: 2, productCount: 1 },
  { id: 'pcat-008', name: 'Decor', parentId: 'pcat-005', displayOrder: 3, productCount: 1 },
  { id: 'pcat-009', name: 'Entertainment', parentId: 'pcat-005', displayOrder: 4, productCount: 1 },
  { id: 'pcat-010', name: 'Cafe Menu', parentId: null, displayOrder: 3, productCount: 2 },
  { id: 'pcat-011', name: 'Hot Coffee', parentId: 'pcat-010', displayOrder: 1, productCount: 0 },
  { id: 'pcat-012', name: 'Cold Drinks', parentId: 'pcat-010', displayOrder: 2, productCount: 0 },
  { id: 'pcat-013', name: 'Food', parentId: 'pcat-010', displayOrder: 3, productCount: 0 },
  { id: 'pcat-014', name: 'Retail', parentId: 'pcat-010', displayOrder: 4, productCount: 2 },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.12 DASHBOARD METRICS
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_DASHBOARD = {
  todayDate: 'Tuesday, April 15, 2025',
  metrics: {
    totalRevenue:       { value: 28450.00, change: +12.4, period: 'this month' },
    activeMembers:      { value: 102,      change: +8,    period: 'vs last month' },
    bookingsToday:      { value: 34,       change: +5,    period: 'vs yesterday' },
    upcomingParties:    { value: 7,        change: null,  period: 'next 14 days' },
    pendingInquiries:   { value: 1,        change: null,  period: 'needs approval' },
    openPlayCapacity:   { value: 68,       unit: '%',     label: 'today avg capacity' },
  },
  recentActivity: [
    { type: 'BOOKING',      contact: 'Sarah Johnson',           action: 'Booked VIP Play — May 10',           time: '2 hours ago',  amount: 825.00 },
    { type: 'SUBSCRIPTION', contact: 'Priya Patel',             action: 'Signed up for 1 Child Membership',   time: '3 hours ago',  amount: 45.00 },
    { type: 'INQUIRY',      contact: 'Carmel Chamber of Commerce', action: 'Midnight Play inquiry — Jun 14', time: '5 hours ago',  amount: 2095.00 },
    { type: 'BOOKING',      contact: 'Amanda Williams',         action: 'Bronze Gymnastics — Tuesday 4pm',    time: 'Yesterday',    amount: 22.00 },
    { type: 'ORDER',        contact: 'Michael Chen',            action: 'Purchased Multi-Pass (5 sessions)',   time: 'Yesterday',    amount: 50.00 },
    { type: 'CHECKIN',      contact: 'Sarah Johnson',           action: 'Checked in — Open Play (Emma + Liam)', time: '2 days ago', amount: null },
  ],
  todaySchedule: [
    { time: '9:30 AM',  service: 'KinderGym',                   capacity: '10/12', status: 'ON_TRACK' },
    { time: '11:00 AM', service: 'Preschool Play Date',          capacity: '14/20', status: 'ON_TRACK' },
    { time: '12:00 PM', service: 'Burn & Firm HIIT',             capacity: '18/20', status: 'ALMOST_FULL' },
    { time: '4:00 PM',  service: "Lil' Ninjas",                  capacity: '11/15', status: 'ON_TRACK' },
    { time: '4:00 PM',  service: 'Warrior Zone',                 capacity: '9/15',  status: 'ON_TRACK' },
    { time: '6:00 PM',  service: 'Power Yoga',                   capacity: '15/18', status: 'ALMOST_FULL' },
  ],
  pendingActions: [
    { type: 'INQUIRY_APPROVAL', title: 'Carmel Chamber — Midnight Play Jun 14', urgency: 'HIGH',   dueIn: 'Today' },
    { type: 'INVOICE_DUE',      title: 'Invoice #1042 — Amanda Williams',       urgency: 'MEDIUM', dueIn: '3 days' },
    { type: 'LOW_STOCK',        title: 'Grip Socks — Branded (200 remaining)',  urgency: 'LOW',    dueIn: null },
    { type: 'REMINDER',         title: 'Call Priya Patel — welcome follow-up',  urgency: 'LOW',    dueIn: 'Tomorrow' },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
// 1.13 REMINDERS & TASKS
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_REMINDERS = [
  { id: 'rem-001', type: 'REVIEW_REQUIRED', title: 'Approve Midnight Play inquiry — Carmel Chamber', dueAt: 'Today 5:00 PM', contactName: 'Carmel Chamber of Commerce', urgency: 'HIGH', isCompleted: false },
  { id: 'rem-002', type: 'INVOICE_PENDING', title: 'Invoice #1042 due — Amanda Williams', dueAt: 'Apr 14, 2025', contactName: 'Amanda Williams', urgency: 'MEDIUM', isCompleted: false },
  { id: 'rem-003', type: 'CUSTOM',          title: 'Call Priya Patel — welcome new member follow-up', dueAt: 'Apr 12, 2025', contactName: 'Priya Patel', urgency: 'LOW', isCompleted: false },
  { id: 'rem-004', type: 'BIRTHDAY',        title: "Emma Johnson turns 6 in 30 days", dueAt: 'May 10, 2025', contactName: 'Sarah Johnson', urgency: 'LOW', isCompleted: false },
  { id: 'rem-005', type: 'CUSTOM',          title: 'Reorder branded grip socks (stock below 50)', dueAt: 'Apr 20, 2025', contactName: null, urgency: 'LOW', isCompleted: true },
];

// ════════════════════════════════════════════════════════════════════════════
// 1.14 RESOURCES (Party Rooms)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_RESOURCES = [
  { id: 'res-001', name: 'Party Room A', type: 'ROOM', capacity: 30, locationId: 'loc-001', locationName: 'Discovery Town — Main Venue', isActive: true },
  { id: 'res-002', name: 'Party Room B', type: 'ROOM', capacity: 30, locationId: 'loc-001', locationName: 'Discovery Town — Main Venue', isActive: true },
  { id: 'res-003', name: 'Meeting Room 1', type: 'ROOM', capacity: 12, locationId: 'loc-001', locationName: 'Discovery Town — Main Venue', isActive: true },
];

// ── SECTION 2: USAGE INSTRUCTIONS FOR CURSOR ────────────────────────────────

// STEP 1 — Create the mock file:
//   Create src/mocks/discovery-town.mock.ts with all the data above.

// STEP 2 — Create a mock API hook shim:
//   Create src/mocks/useMockData.ts
//   Export small hooks that return the mock data with a fake loading delay:
//
//   export function useMockContacts() {
//     const [loading, setLoading] = useState(true);
//     const [data, setData] = useState<typeof MOCK_CONTACTS>([]);
//     useEffect(() => {
//       const t = setTimeout(() => { setData(MOCK_CONTACTS); setLoading(false); }, 600);
//       return () => clearTimeout(t);
//     }, []);
//     return { data, loading };
//   }
//   (Repeat the same pattern for all entities above)
//   The 600ms delay simulates a real API call so the client sees loading
//   states transition to populated data — this looks more realistic.

// STEP 3 — Replace empty/loading states on these pages with mock data:
//
//   /dashboard                → MOCK_DASHBOARD (metrics + activity + schedule + reminders)
//   /clients                  → MOCK_CONTACTS (contact list + search)
//   /clients/:id              → MOCK_CONTACTS[0] (Sarah Johnson profile — use as default demo)
//   /scheduling/services      → MOCK_SERVICE_CATEGORIES + MOCK_SERVICES
//   /scheduling/calendar      → MOCK_SERVICE_SLOTS (show this week's sessions)
//   /scheduling/slots         → MOCK_SERVICE_SLOTS
//   /clients/plans            → MOCK_PLANS (plan management page)
//   /events/packages          → MOCK_EVENT_PACKAGES (all 6 packages)
//   /events/inquiries         → MOCK_BOOKINGS filtered by status=PENDING_APPROVAL
//   /inventory/products       → MOCK_PRODUCTS
//   /inventory/categories     → MOCK_PRODUCT_CATEGORIES
//   /inventory/add-ons        → MOCK_ADDONS
//   /reminders                → MOCK_REMINDERS

// STEP 4 — Specific UI details for the client demo:
//
//   a. DASHBOARD:
//      The 5 metric cards must show the numbers from MOCK_DASHBOARD.metrics.
//      The "Pending Actions" widget must show MOCK_DASHBOARD.pendingActions
//      with color-coded urgency badges (red=HIGH, amber=MEDIUM, gray=LOW).
//      The "Today's Schedule" must render as a timeline with capacity bars.
//      "1 pending inquiry" badge must show on the Events nav item.
//
//   b. CONTACT PROFILE (/clients/contact-001 — Sarah Johnson):
//      Show: member badge "1 Child Membership — Monthly", credit balance "3 credits",
//      children list (Emma 5yr, Liam 3yr), allergy note pinned (red pin icon),
//      bookings tab (3 upcoming + 1 past), subscription tab (active plan),
//      top action bar with "Create Booking", "Add Membership", "Add Order" buttons.
//
//   c. EVENTS PACKAGES (/events/packages):
//      Show PackageSelector with all 6 cards rendered correctly.
//      SILVER = slate border, GOLD = amber border, PLATINUM = purple border.
//      Mini-Play and Classic Fun show no deposit chip.
//      Midnight/All-Star/Ultimate show red "Requires $X deposit" chip.
//      Midnight/All-Star/Ultimate show amber "Approval required" chip.
//
//   d. EVENTS INQUIRY QUEUE (/events/inquiries):
//      Show booking-005 (Carmel Chamber, Midnight Play, PENDING_APPROVAL).
//      "Approve" button must open a confirm dialog showing: "Charge $500 deposit."
//
//   e. PLANS PAGE (/clients/plans):
//      Show all 5 plans in a table. Group MONTHLY + ANNUAL rows together visually.
//      Clicking a plan shows: features list + linked add-ons + linked coupons.
//      MEMBER10 and MEMBER20 coupons visible in the linked coupons section.
//
//   f. PRODUCT CATEGORIES (/inventory/categories):
//      Show the two-panel layout with Kids Shop (3 sub-cats) and
//      Take Out Party (4 sub-cats) and Cafe Menu (4 sub-cats).
//      Product counts visible on each category card.
//
//   g. SERVICE FORM (when editing "Party & Event Booking"):
//      isPackageService toggle is ON.
//      Packages section shows all 6 packages in the linked list.
//      "Create new package" button is visible and opens the mini-form.
//      Demo pre-fill the mini-form with: Name="Demo Package", Tier=GOLD, Price=$500.
//
//   h. SLOT RECURRING FORM:
//      Pre-fill with: Service="Preschool Play Date", WEEKLY, Mon+Wed+Thu selected,
//      Start=next Monday, End=8 weeks from now, Time=11:00–12:30, Capacity=20.
//      Live preview must show "24 sessions to be created" with the date list.
//
//   i. COUPON PANEL (checkout):
//      For Sarah Johnson checking out any booking, Zone A must show:
//      "WELCOME10 — 10% off your first booking" card
//      "MEMBER10 — 10% off all orders (members only)" card
//      Both as selectable cards. Selecting MEMBER10 on a $675 VIP Play booking
//      shows: "MEMBER10 applied — saving $67.50" chip. Total updates to $607.50.

// STEP 5 — Add-ons visual in the event booking widget:
//   When the demo shows the EventBookingWidget Step 5 for "The VIP Play":
//   INCLUDED add-ons (locked, green chips):
//     "✓ 2 Large 1-Topping Pizzas — Included"
//     "✓ Themed Digital Invitations — Included"
//   OPTIONAL add-ons (checkboxes):
//     Food: "Additional Pizza ($22)", "Adult Appetizer Tray ($40)", "Snack Basket ($22)"
//     Dessert: "Custom Cupcakes ($45)", "Donut Wall ($65)", "Cookie Station ($7/child)"
//     Decor: "Balloon Bouquet ($18)", "Themed Paperware ($35)", "Photo Backdrop ($60)"
//     Entertainment: "Face Painter ($175)", "Character Appearance ($150)", "Goodie Bags ($6/child)"
//     Logistics: "+30 Minutes ($90)", "Extra Party Host ($55)", "Grip Socks ($4/guest)"

//══════════════════════════════════════════════════════════════════════════════