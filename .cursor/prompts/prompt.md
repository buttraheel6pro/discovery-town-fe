Apply the following additive changes to the existing Scheduling
frontend feature. Read all existing scheduling components before
writing any code. Reuse existing patterns for consistency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TERMINOLOGY RULE (REQ 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From this point forward in ALL frontend code and UI labels:

  Backend term    → Frontend label
  Service         → Event
  ServiceSlot     → Session
  ServiceType     → Event Type
  ServiceCategory → Event Category

This applies to:
  - All button labels, page headings, table column headers
  - All empty state messages
  - All toast notifications
  - All form field labels
  - All navigation menu items

The TypeScript types and API function names keep their existing
names (Service, ServiceSlot, etc.) — this is a display-only change.
Do not rename any type, interface, hook, or API function.

Create a constants file:
  src/constants/ui-labels.ts:
    export const LABELS = {
      service:         'Event',
      services:        'Events',
      serviceSlot:     'Session',
      serviceSlots:    'Sessions',
      serviceCategory: 'Event Category',
      serviceType:     'Event Type',
      createService:   'Create Event',
      createSlot:      'Create Session',
    } as const

Use LABELS.service, LABELS.serviceSlot etc. throughout all
scheduling UI components instead of hardcoded strings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ServiceSlot — isActive (Draft/Published toggle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add PublishStatusBadge component:
  src/portal/admin/features/scheduling/components/PublishStatusBadge.tsx
  Props: isActive: boolean
  true  → green badge "Published"
  false → gray badge "Draft"
  Same visual style as SlotStatusBadge

Update ServiceSlot type in scheduling.shared.ts:
  Add: isActive: boolean
  Add: checkInCount: number

Update slot DataTable (/scheduling page):
  Add "Status" column showing PublishStatusBadge
  Add "Check-ins" column showing checkInCount / bookedCount
  Replace the existing Status column (SlotStatus) with two columns:
    Publish Status (PublishStatusBadge)
    Slot Status (SlotStatusBadge for SCHEDULED/FULL/CANCELLED)

Add toggle action to slot detail page (/scheduling/[slotId]):
  Header actions: if isActive → "Set to Draft" button (secondary)
                  if !isActive → "Publish" button (primary green)
  Both call PATCH /service-slots/:id/publish or /draft
  Optimistic update: flip isActive immediately, revert on error

Add to useUpdateSlot hook:
  usePublishSlot(slotId): calls PATCH /service-slots/:id/publish
  useDraftSlot(slotId):   calls PATCH /service-slots/:id/draft
  Both onSuccess: invalidate SLOT + SLOTS + CALENDAR query keys

Multi-step slot creation form (/scheduling/new) — Step 4 Review:
  Replace "Publish" / "Save as Draft" button labels with:
    "Publish Session" (sets isActive = true, status = SCHEDULED)
    "Save as Draft"   (sets isActive = false)
  Both call the same createSlot mutation — only isActive differs.

Consumer activity listing:
  Never show sessions where isActive = false.
  The public API already filters these — no frontend change needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. ServiceCategory form — new fields
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update ServiceCategoryType (scheduling.shared.ts):
  Add all new fields with correct TypeScript types.

Update the category create/edit form (inline form on /scheduling/services):
  Group new fields under a collapsible "Advanced Settings" accordion.
  Keep the existing basic fields (name, icon, displayOrder) above it.

Fields to add inside the accordion:

  Description:
    Tiptap or plain textarea, optional

  Requires Attendee:
    Toggle switch, label: "Require family member selection"
    Helper: "Customers must select at least one family member to proceed"

  Members Only:
    Toggle switch, label: "Members only"
    Helper: "Only customers with an active membership can book"
    When ON: show a MembersOnlyBadge on the category card

  Free Infant Age:
    Number input (months), optional, label: "Free infant age (months)"
    Placeholder: "e.g. 6 = under 6 months is free"

  Deposit:
    Number input (percentage 0–100), optional, label: "Deposit required (%)"
    Helper: "Customers pay this percentage upfront to confirm the booking"
    Show formatted preview: "e.g. 25% deposit on a £100 booking = £25 upfront"

  Special Instructions:
    Toggle switch, label: "Allow special instructions"
    Helper: "Customers can add notes during booking (e.g. dietary needs, preferences)"

  Waitlist:
    Toggle switch (default ON), label: "Enable waitlist"
    Helper: "When a session is full, customers can join the waitlist"

Zod schema update (scheduling.validations.ts):
  categorySchema.extend({
    description: z.string().optional(),
    requiresAttendee: z.boolean().default(false),
    membersOnly: z.boolean().default(false),
    freeInfantMonths: z.number().int().min(0).max(24).optional(),
    depositPercent: z.number().min(0).max(100).optional(),
    specialInstructionsEnabled: z.boolean().default(false),
    waitlistEnabled: z.boolean().default(true),
  })

Update the service catalog page (/scheduling/services):
  Category cards — show small indicator badges for active flags:
    🔒 Members Only (if membersOnly = true)
    💳 Deposit (if depositPercent set)
    👶 Free Infants (if freeInfantMonths set)
  Use small tooltip on hover showing the setting value.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Service form — eventType field
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to ServiceFormSlideOver (after the BookingModeToggle):

  EventTypeSelector component (3 radio cards):
    PUBLIC:
      Icon: Globe (lucide-react)
      Label: "Public Event"
      Description: "Listed on the public booking page. Anyone can book."
    PRIVATE:
      Icon: Lock (lucide-react)
      Label: "Private Event"
      Description: "Not listed publicly. Accessible via direct link only."
    SINGLE_HOST:
      Icon: User (lucide-react)
      Label: "Host-Only Event"
      Description: "You host it. Invite specific participants."

  Show EventTypeBadge on service cards:
    PRIVATE → red lock badge "Private"
    SINGLE_HOST → purple user badge "Host Only"
    PUBLIC → no badge (default, no visual noise)

  Add EventTypeBadge component:
    src/portal/admin/features/scheduling/components/EventTypeBadge.tsx
    Use same pill style as ServiceTypeBadge.

  Update activity listing filter on consumer portal:
    Never show PRIVATE or SINGLE_HOST events in the public listing.
    (Backend filters these — no frontend change needed for the API call.)
    Add a note in the filter help text:
      "Private and host-only events are not shown here."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Document — documentSubType (Admin)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Update DocumentEditor in /clients/documents:
  Add "Document Audience" radio after the DocumentType selector:
    GUEST: "Signed by the participant (person attending)"
    HOST:  "Signed by the booking organiser"
  Show DocumentSubTypeBadge on document list:
    GUEST → blue badge "Participant signs"
    HOST  → navy badge "Organiser signs"

Update DocumentStatusRow component (on contact profile Waivers tab):
  Show which role this document applies to:
    "Required by: Participant" or "Required by: Organiser"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Consumer booking flow — special instructions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In BookingWidget (consumer) and OpenBookingWidget (consumer):
  In the "Confirm details" step:
    If service.specialInstructionsEnabled OR
       service.category.specialInstructionsEnabled:
      Show a textarea:
        Label: "Special instructions (optional)"
        Placeholder: "Dietary requirements, accessibility needs, preferences..."
        Max 2000 characters with live counter
      Include in booking payload as specialInstructions

In BookingWidget — member-only enforcement:
  If category.membersOnly = true AND user has no active subscription:
    Replace "Book Now" button with:
      "Members Only" (disabled button, amber)
      Link below: "Become a member →" → /membership

In BookingWidget — attendee requirement:
  If category.requiresAttendee = true:
    Make the participant selector step mandatory (not skippable).
    Show: "This event requires you to select a participant."
    Do not allow proceeding until a family member is selected.

In BookingWidget — free infant pricing:
  If category.freeInfantMonths is set AND selected participant's age
  in months <= freeInfantMonths:
    Show in pricing breakdown:
      "Infant (under X months): FREE"
    Total amount shows 0 for that participant.

In BookingWidget — deposit display:
  If category.depositPercent is set:
    In pricing step show:
      "Due today (deposit): £XX"
      "Due on arrival (balance): £XX"
    Total and deposit clearly separated.