export const sevenWondersSchema = {
  name: "7WONDERS",
  type: "flat",
  categories: [
    { key: "military",  label: "군사",     labelEn: "Military",   icon: "⚔️",  color: "#dc2626", allowNegative: true },
    { key: "treasury",  label: "금화",     labelEn: "Treasury",   icon: "💰",  color: "#ca8a04" },
    { key: "wonder",    label: "불가사의", labelEn: "Wonder",     icon: "🏛️",  color: "#78716c" },
    { key: "civilian",  label: "시민",     labelEn: "Civilian",   icon: "🟦",  color: "#2563eb" },
    { key: "commerce",  label: "상업",     labelEn: "Commerce",   icon: "🟡",  color: "#d97706" },
    { key: "guild",     label: "길드",     labelEn: "Guild",      icon: "🟣",  color: "#7c3aed" },
    { key: "science",   label: "과학",     labelEn: "Science",    icon: "🟢",  color: "#16a34a", special: "science_7wonders" },
  ],
};
