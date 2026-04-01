import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-fpl-light-border dark:border-fpl-border mt-auto py-4 text-center text-sm text-gray-400 dark:text-gray-500">
      {t('footer.tagline')}
    </footer>
  );
}