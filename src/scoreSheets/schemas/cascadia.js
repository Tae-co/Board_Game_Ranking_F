export const cascadiaSchema = {
  name: "CASCADIA",
  type: "sectioned",
  sections: [
    {
      key: "animal",
      label: "동물 점수", labelEn: "Animal Score",
      icon: "🐾", color: "#065f46", bgColor: "#f0fdf4",
      categories: [
        { key: "bear",   label: "곰",   labelEn: "Bear",   icon: "🐻", color: "#92400e" },
        { key: "elk",    label: "엘크", labelEn: "Elk",    icon: "🦌", color: "#065f46" },
        { key: "salmon", label: "연어", labelEn: "Salmon", icon: "🐟", color: "#0369a1" },
        { key: "hawk",   label: "매",   labelEn: "Hawk",   icon: "🦅", color: "#1e40af" },
        { key: "fox",    label: "여우", labelEn: "Fox",    icon: "🦊", color: "#c2410c" },
      ],
    },
    {
      key: "habitat",
      label: "지형 점수", labelEn: "Habitat Score",
      icon: "🗺️", color: "#6d28d9", bgColor: "#faf5ff",
      categories: [
        { key: "forest",   label: "숲",  labelEn: "Forest",   icon: "🌲", color: "#15803d" },
        { key: "mountain", label: "산",  labelEn: "Mountain", icon: "⛰️", color: "#78716c" },
        { key: "river",    label: "강",  labelEn: "River",    icon: "🌊", color: "#0284c7" },
        { key: "prairie",  label: "초원",labelEn: "Prairie",  icon: "🌾", color: "#65a30d" },
        { key: "wetland",  label: "습지",labelEn: "Wetland",  icon: "🌿", color: "#0f766e" },
      ],
    },
    {
      key: "bonus",
      label: "보너스", labelEn: "Bonus",
      icon: "⭐", color: "#b45309", bgColor: "#fffbeb",
      categories: [
        { key: "nature",   label: "자연 토큰", labelEn: "Nature Token", icon: "🍃", color: "#15803d" },
        { key: "pinecone", label: "솔방울",    labelEn: "Pinecone",     icon: "🌰", color: "#92400e" },
      ],
    },
  ],
};
