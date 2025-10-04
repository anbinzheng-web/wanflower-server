import en from './lang/en.json';
import zh from './lang/zh.json';

export const langMap = {
  en,
  zh
}

export const t = (key: string, language: string): string => {
  return langMap[language]?.[key] || key
}