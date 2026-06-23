/** Copy for the public About Us & FAQ page. */

export interface FaqItem {
  readonly id: string
  readonly question: string
  readonly answer: string
}

export const ABOUT_HERO_OVERLINE = 'About Us'

export const ABOUT_HERO_TITLE = 'Where families play, connect & thrive'

export const ABOUT_HERO_DESCRIPTION =
  'An imaginative indoor play café — built for curious kids, relaxed parents, and celebrations worth remembering.'

export const ABOUT_HERO_IMAGE_SRC = '/play.png'

export const ABOUT_US_HEADLINE = 'Our story'

export const ABOUT_US_PARAGRAPHS: readonly string[] = [
  'Discovery Town is an imaginative indoor play café built for families — a place where children explore, create, and discover while parents relax with great coffee and comfy seating.',
  'From open play and gym classes to birthday parties, summer camps, and community events, we bring together play, learning, and celebration under one roof.',
  'Our team is passionate about safe, welcoming experiences for every age. Whether you are booking a casual visit, planning a party, or signing up for a membership, we are here to help your family make memories that last.',
] as const

export interface AboutGalleryImage {
  readonly src: string
  readonly alt: string
}

export const ABOUT_GALLERY_IMAGES: readonly AboutGalleryImage[] = [
  { src: '/play.png', alt: 'Children exploring the play town at Discovery Town' },
  { src: '/gym-hero.jpg', alt: 'Kids gym and movement classes at Discovery Town' },
  { src: '/Events.png', alt: 'Birthday parties and celebrations at Discovery Town' },
  { src: '/cafe.png', alt: 'Parents enjoying coffee at the Discovery Town café' },
  { src: '/gifts-hero.jpg', alt: 'Families shopping gifts and treats at Discovery Town' },
] as const

export const FAQ_SECTION_OVERLINE = 'FAQ'

export const FAQ_SECTION_TITLE = 'Frequently asked questions'

export const FAQ_SECTION_DESCRIPTION =
  'Quick answers about visits, bookings, and memberships.'

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    id: 'faq-ages',
    question: 'What ages is Discovery Town best for?',
    answer:
      'Our play town, café, and most open-play sessions welcome children from infants through elementary school. Gym classes, learn programmes, and some events list specific age ranges on each activity — check the detail page before you book.',
  },
  {
    id: 'faq-parent-stay',
    question: 'Do parents or guardians need to stay during open play?',
    answer:
      'Yes. A responsible adult must remain on site for open play unless an event listing says otherwise. Children cannot be dropped off for general café play sessions.',
  },
  {
    id: 'faq-parties',
    question: 'Can I book birthday parties or private events?',
    answer:
      'Absolutely. Browse Events for party packages, private room hire, and whole-venue celebrations. You can also explore Play for add-on experiences. Submit an inquiry or book online where available.',
  },
  {
    id: 'faq-membership',
    question: 'Do you offer memberships or multi-visit passes?',
    answer:
      'Yes. Membership plans include monthly and annual options for one or two children, plus seasonal passes. Visit the Membership page to compare plans, perks, and pricing.',
  },
  {
    id: 'faq-what-to-bring',
    question: 'What should we bring for a visit?',
    answer:
      'We recommend socks for play areas (grip socks for toddlers if you have them), a water bottle, and any comfort items for younger children. Waiver completion may be required before your first booking — you can sign documents in your account.',
  },
] as const
