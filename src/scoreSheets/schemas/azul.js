export const azulSchema = {
  name: "AZUL",
  type: "flat",
  categories: [
    { key: "wall",     label: "벽 타일", labelEn: "Wall Tiles",       icon: "🔷", color: "#1d4ed8" },
    { key: "row",      label: "완성 행", labelEn: "Completed Row",    icon: "➡️", color: "#0f766e" },
    { key: "col",      label: "완성 열", labelEn: "Completed Column", icon: "⬇️", color: "#7c3aed" },
    { key: "color",    label: "같은 색", labelEn: "Same Color",       icon: "🎨", color: "#b91c1c" },
    { key: "negative", label: "감점",    labelEn: "Penalty",          icon: "❌", color: "#6b7280", negative: true },
  ],
};
