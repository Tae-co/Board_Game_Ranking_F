import { useState } from 'react';

const newCategory = () => ({
  key: `cat_${Math.random().toString(36).slice(2, 8)}`,
  label: '', labelEn: '', icon: '', color: '#6b5ce7', negative: false,
});

const newSection = () => ({
  id: Math.random().toString(36).slice(2, 8),
  title: '', titleEn: '', categories: [newCategory()],
});

export const useSchemaBuilder = () => {
  const [schemaType, setSchemaType] = useState('none');
  const [schemaCategories, setSchemaCategories] = useState([]);
  const [schemaSections, setSchemaSections] = useState([]);

  const buildSchemaJson = (gameName) => {
    if (schemaType === 'none') return null;
    if (schemaType === 'flat') {
      return JSON.stringify({
        name: gameName, type: 'flat',
        categories: schemaCategories.map(({ key, label, labelEn, icon, color, negative }) => ({
          key, label, labelEn, icon, color, ...(negative && { negative: true }),
        })),
      });
    }
    if (schemaType === 'sectioned') {
      return JSON.stringify({
        name: gameName, type: 'sectioned',
        sections: schemaSections.map(({ title, titleEn, categories }) => ({
          title, titleEn,
          categories: categories.map(({ key, label, labelEn, icon, color, negative }) => ({
            key, label, labelEn, icon, color, ...(negative && { negative: true }),
          })),
        })),
      });
    }
    return null;
  };

  const validateSchemaUI = () => {
    if (schemaType === 'flat') {
      if (schemaCategories.length === 0) return '카테고리를 1개 이상 추가해주세요.';
      for (const c of schemaCategories) {
        if (!c.label || !c.labelEn) return '모든 카테고리에 한글명과 영문명을 입력해주세요.';
      }
    }
    if (schemaType === 'sectioned') {
      if (schemaSections.length === 0) return '섹션을 1개 이상 추가해주세요.';
      for (const s of schemaSections) {
        if (!s.title || !s.titleEn) return '모든 섹션에 한글명과 영문명을 입력해주세요.';
        for (const c of s.categories) {
          if (!c.label || !c.labelEn) return '모든 카테고리에 한글명과 영문명을 입력해주세요.';
        }
      }
    }
    return null;
  };

  const resetSchema = () => {
    setSchemaType('none');
    setSchemaCategories([]);
    setSchemaSections([]);
  };

  const loadFromGame = (game) => {
    if (game.schemaJson) {
      try {
        const parsed = JSON.parse(game.schemaJson);
        setSchemaType(parsed.type || 'none');
        if (parsed.type === 'flat') setSchemaCategories(parsed.categories || []);
        if (parsed.type === 'sectioned') setSchemaSections(
          (parsed.sections || []).map(s => ({ ...s, id: Math.random().toString(36).slice(2, 8) }))
        );
        return;
      } catch { /* fall through */ }
    }
    resetSchema();
  };

  return {
    schemaType, setSchemaType,
    schemaCategories, setSchemaCategories,
    schemaSections, setSchemaSections,
    newCategory, newSection,
    buildSchemaJson, validateSchemaUI, resetSchema, loadFromGame,
  };
};
