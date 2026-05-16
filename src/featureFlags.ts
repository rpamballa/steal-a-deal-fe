export const featureFlags = {
  buyerCompare: true,
  buyerPaymentSlider: true,
  notificationsBell: true,
  dealTimeline: true,
  taskChecklist: true,
  dealerOnboarding: true,
  buyerPreQual: false,
  buyerHold: false,
  dealMessaging: false,
  repAssignment: false,
  managerApprovals: false,
  ownerPerformance: false,
  ownerStaff: false,
  realPayments: false,
  eSignature: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
