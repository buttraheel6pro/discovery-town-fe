/** Three-step rentals explainer section. */
const STEPS = [
  {
    title: 'Browse',
    description: 'Choose items by category and review setup and fulfillment details.',
  },
  {
    title: 'Book',
    description: 'Set your date, select pickup or delivery, and complete checkout.',
  },
  {
    title: 'Enjoy',
    description: 'We coordinate logistics so your event runs smoothly.',
  },
] as const

interface RentalHowItWorksProps {
  readonly compact?: boolean
}

export function RentalHowItWorks({ compact = false }: Readonly<RentalHowItWorksProps>) {
  return (
    <section className="space-y-4">
      {!compact ? <h2 className="text-2xl font-black text-foreground">How it works</h2> : null}
      <div className={compact ? 'grid grid-cols-1 gap-2 sm:grid-cols-3' : 'grid grid-cols-1 gap-4 md:grid-cols-3'}>
        {STEPS.map((step, index) => (
          <div
            key={step.title}
            className={
              compact
                ? 'rounded-lg border border-white/20 bg-white/10 p-3'
                : 'rounded-xl border border-border bg-card p-5'
            }
          >
            <p
              className={
                compact
                  ? 'text-[10px] font-semibold uppercase tracking-wide text-white/80'
                  : 'text-xs font-semibold uppercase tracking-wide text-accent'
              }
            >
              Step {index + 1}
            </p>
            <h3 className={compact ? 'mt-1 text-sm font-bold text-white' : 'mt-2 text-lg font-bold text-foreground'}>
              {step.title}
            </h3>
            <p className={compact ? 'mt-1 text-xs text-white/80' : 'mt-2 text-sm text-muted-foreground'}>
              {compact
                ? step.title === 'Browse'
                  ? 'Pick items.'
                  : step.title === 'Book'
                    ? 'Choose date.'
                    : 'Enjoy event.'
                : step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
