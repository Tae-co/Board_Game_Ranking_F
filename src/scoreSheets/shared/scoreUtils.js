export const getAllCategories = (schema) => {
  if (schema.type === "sectioned") return schema.sections.flatMap(s => s.categories);
  if (schema.type === "duel") return [];
  if (schema.type === "uno") return [];
  if (schema.type === "rummikub") return [];
  if (schema.type === "dicethrone") return [];
  if (schema.type === "splendorduel") return [];
  return schema.categories || [];
};

export const cl = (item, lang) => (lang === 'en' && item.labelEn) ? item.labelEn : item.label;
