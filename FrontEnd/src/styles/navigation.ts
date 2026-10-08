// Shared by the floating bar and the list insets so content remains reachable.
export const floatingTabBar = {
  radius: 30,
  horizontalInset: 16,
  bottomGap: 12,
  contentGap: 16,
  innerPadding: 6,
} as const;

export function tabBarMetrics(fontScale: number, bottomInset: number) {
  // Match the label's font limit; the home indicator has its own space.
  const capsuleHeight =
    68 + Math.ceil((Math.min(1.4, Math.max(1, fontScale)) - 1) * 20);
  return {
    capsuleHeight,
    totalHeight:
      capsuleHeight + floatingTabBar.bottomGap + Math.max(0, bottomInset),
  };
}
