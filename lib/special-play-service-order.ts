/** Display order for Special Play Events rails (Play + Events). */

export const SPECIAL_PLAY_SERVICE_ORDER: readonly string[] = [
  'svc-special-character-events',
  'svc-special-preschool-play-date',
  'svc-special-holiday-festivals',
  'svc-special-fall-harvest-festival',
  'svc-special-winter-wonderland-ball',
  'svc-special-spring-blooming-bash',
  'svc-special-slime-science-extravaganza',
  'svc-special-junior-carnival-circus',
  'svc-special-dance-party',
  'svc-special-bubble-party',
  'svc-special-balloon-drop-party',
  'svc-special-deep-sea-discovery',
  'svc-special-mini-maker-faire',
  'svc-special-tiny-chefs-festival',
] as const

const ORDER_INDEX = new Map<string, number>(
  SPECIAL_PLAY_SERVICE_ORDER.map((id, index) => [id, index]),
)

export function sortSpecialPlayServices<T extends { readonly id: string }>(
  services: readonly T[],
): T[] {
  return [...services].sort((a, b) => {
    const aIndex = ORDER_INDEX.get(a.id) ?? 999
    const bIndex = ORDER_INDEX.get(b.id) ?? 999
    if (aIndex !== bIndex) {
      return aIndex - bIndex
    }
    return a.id.localeCompare(b.id)
  })
}
