// Base flag mappings and colors derived from the original Python logic
export const BASE_FLAG_FA = {
  INTEGRITY_AUDIT: "مشکوک به داده کاذب",
  ENGAGEMENT_TRAINING: "کم‌حوصله",
  EXEMPLAR: "باحوصله",
  OK: "عادی",
  LOW_DATA: "فاقد ویزیت کافی",
};

export const DASHBOARD_MODES = {
  RESIDENTS: "residents",
  FACULTY: "faculty",
};

export const BASE_FLAG_COLOR = {
  INTEGRITY_AUDIT: "#d62728",
  ENGAGEMENT_TRAINING: "#ff9f1c",
  EXEMPLAR: "#2ca02c",
  OK: "#1f77b4",
  LOW_DATA: "#9e9e9e",
};

export const FLAG_PRIORITY = [
  "INTEGRITY_AUDIT",
  "LOW_DATA",
  "ENGAGEMENT_TRAINING",
  "EXEMPLAR",
  "OK",
];

export const QUALITY_CATEGORIES = {
  E: { label: "خوب", color: "#004b23" },
  A: { label: "قابل قبول", color: "#38b000" },
  G: { label: "حداقل", color: "#bfd200" },
  Z: { label: "خالی/نسبتا خالی", color: "#B0BEC5" },
  W: { label: "ضعیف", color: "#F28E2B" },
  F: { label: "مشکوک به داده کاذب", color: "#D64545" },
};

export const QUALITY_CATEGORIES_NO_F = {
  E: { label: "خوب", color: "#004b23" },
  A: { label: "قابل قبول", color: "#38b000" },
  G: { label: "حداقل", color: "#bfd200" },
  Z: { label: "خالی/نسبتا خالی", color: "#B0BEC5" },
  W: { label: "ضعیف", color: "#F28E2B" },
};