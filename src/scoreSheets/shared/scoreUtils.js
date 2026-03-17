export const getAllCategories = (schema) => {
  if (schema.type === "sectioned") return schema.sections.flatMap(s => s.categories);
  if (schema.type === "duel") return [];
  return schema.categories || [];
};

export const cl = (item, lang) => (lang === 'en' && item.labelEn) ? item.labelEn : item.label;
