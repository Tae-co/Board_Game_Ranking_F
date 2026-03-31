export const littleTownsSchema = {
  name: "Little Towns",
  type: "flat",
  supportsRankMode: false,
  categories: [
    { key: "buildings", label: "건물 점수",  labelEn: "Building Score",        icon: "🏘️", color: "#2563eb" },
    { key: "resources", label: "남은 자원",  labelEn: "Remaining Resources",   icon: "📦", color: "#9ca3af", negative: true },
  ],
};
