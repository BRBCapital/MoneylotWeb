/**
 * Asset path registry (served from `public/`).
 * Keep this as the single source of truth for image paths used in the UI.
 */
export const imagesAndIcons = {
  // Backgrounds
  backgroundImageWeb: "/assets/backgroundImageWeb.png",

  // Logos
  moneylotIconDarkBackground: "/assets/moneylotIconDarkBackground.png",
  moneylotIconOne: "/assets/moneylotIconOne.png",

  // UI icons / images
  closeModal: "/assets/closeModal.png",
  dateIcon: "/assets/dateIcon.png",
  showPassword: "/assets/showPassword.png",
  hidePassword: "/assets/hidePassword.png",
  successfulIcon: "/assets/successfulIcon.png",
  toastSuccessIcon: "/assets/toastSuccessIcon.png",

  // Dashboard icons
  portfolio: "/assets/portfolio.png",
  portfolioActive: "/assets/portfolioActive.png",
  transactionsInactive: "/assets/transactionsInactive.png",
  transactionsActive: "/assets/transactionsActive.png",
  myProfile: "/assets/myProfile.png",
  myProfileActive: "/assets/myProfileActive.png",
  portfolioValue: "/assets/portfolioValue.png",
  totalInvested: "/assets/totalInvested.png",
  earnedReturns: "/assets/earnedReturns.png",
  filters: "/assets/filters.png",
  notif: "/assets/notiff.png",
  settingsIcon: "/assets/setting.png",
  settingsActiveIcon: "/assets/settingActive.png",
  keyIcon: "/assets/keyIcon.png",

  // Settings tabs + help icons
  passwordActive: "/assets/passwordActive.png",
  passwordInactive: "/assets/passwordInactive.png",
  pinActive: "/assets/pinActive.png",
  pinInactive: "/assets/pinInactive.png",
  helpInactive: "/assets/helpInactive.png",
  helpActive: "/assets/helpActive.png",
  visitUs: "/assets/visitUs.png",
  chatWithUs: "/assets/chatWithUs.png",
  email: "/assets/email.png",
  website: "/assets/website.png",
  warnIcon: "/assets/warnIcon.png",
  warn: "/assets/warn.png",
  pending: "/assets/pending.png",
  failed: "/assets/failed.png",
  upload: "/assets/upload.png",
  completeProfile: "/assets/completeProfile.png",
  fixedDeposit: "/assets/fixedDeposit.png",
  logout: "/assets/logout.png",
  checkedIcon: "/assets/checkedIcon.png",
  accountLocked: "/assets/accountLocked.png",
} as const;
