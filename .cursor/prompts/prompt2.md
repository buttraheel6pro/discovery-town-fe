Build the Event Package feature for playspace-api and playspace-web.
Packages are associated with Services (Events) and offer tiered
pricing with configurable add-ons.

On session/event detail page (consumer):
  If service has active packages: show PackageSelector above BookingWidget.
  PackageSelector:
    Horizontal card row (silver / gold / platinum)
    Each card: tier badge, name, price, features list
    Selected card: highlighted border + checkmark
    Selecting a package pre-fills the booking price and add-ons

  In BookingWidget — if package selected:
    Show "Package selected: {name}" chip in the confirm step
    Price shows package.basePrice instead of service.basePrice
    Included add-ons shown as "✓ Included" (non-removable)
    Optional add-ons shown as checkboxes with prices

Consumer-facing page:
  /activities/[type]/[serviceId] — existing page gets PackageSelector
  if packages exist for this service.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOOKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

useEventPackages(serviceId)       staleTime: 300_000
useCreatePackage()
useUpdatePackage(id)
useSoftDeletePackage()
useDuplicatePackage()
useAddPackageAddOn()
useRemovePackageAddOn()