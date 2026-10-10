import { Language } from '../types';
import { getLanguageTranslation, LANGUAGE_TRANSLATIONS } from './indianLanguages';

export const translations = LANGUAGE_TRANSLATIONS;

export const getT = (lang: Language) => getLanguageTranslation(lang);

