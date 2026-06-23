/** Homepage values strip — scalloped cream section with four columns. */

import {
  ValuesCoffeeIcon,
  ValuesHeartIcon,
  ValuesLightbulbIcon,
  ValuesPlayHouseIcon,
} from '@/components/customer/home-values-icons'
import { ScallopDivider } from '@/components/customer/home-wave-divider'
import { cn } from '@/lib/utils'

const VALUES = [
  {
    icon: ValuesPlayHouseIcon,
    title: 'Imaginative Play',
    description: 'Hands-on fun in our play town & beyond',
  },
  {
    icon: ValuesLightbulbIcon,
    title: 'Learning Through Play',
    description: 'STEM activities & creative exploration',
  },
  {
    icon: ValuesCoffeeIcon,
    title: 'Great Coffee',
    description: 'Delicious drinks & treats for parents',
  },
  {
    icon: ValuesHeartIcon,
    title: 'Memories That Last',
    description: 'Moments today, memories forever',
  },
] as const

export function HomeValuesStrip() {
  return (
    <section aria-labelledby="home-values-heading">
      <ScallopDivider fill="white" direction="up" />

      <div className="bg-white">
        <div className="mx-auto w-full max-w-[96rem] px-2 py-10 sm:px-4 sm:py-12 md:py-14">
          <h2 id="home-values-heading" className="sr-only">
            Why families love Discovery Town
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className={cn(
                  'home-values-item flex min-w-0 items-center gap-2.5 px-2.5 py-5 sm:gap-3 sm:px-3 sm:py-6 lg:px-3.5',
                  index > 0 && 'border-t border-brand-navy/15 sm:border-t-0',
                  index === 2 && 'sm:border-t sm:border-brand-navy/15 lg:border-t-0',
                  index > 0 && 'lg:border-t-0 lg:border-l lg:border-brand-navy/15',
                )}
              >
                <Icon className="home-values-icon shrink-0" />
                <div className="min-w-0 flex-1 overflow-hidden text-left">
                  <h3 className="home-values-heading mb-1 font-bold uppercase text-brand-navy">
                    {title}
                  </h3>
                  <p className="home-values-desc font-normal text-brand-navy/80">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
