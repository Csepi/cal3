import { useTranslation } from 'react-i18next';
import type { I18nNamespace } from './types';

export const useAppTranslation = (namespace?: I18nNamespace | I18nNamespace[]) =>
  useTranslation(namespace ?? 'common');

export default useAppTranslation;

