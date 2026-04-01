import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { languages } from '../../i18n';
import {
  HiHome,
  HiChartBar,
  HiUsers,
  HiCalendar,
  HiTrophy,
  HiSignal,
  HiCurrencyDollar,
  HiClipboardDocumentList,
  HiPuzzlePiece,
  HiChevronDown,
  HiBars3,
  HiXMark,
  HiPresentationChartLine,
  HiStar,
  HiShieldCheck,
  HiArrowsRightLeft,
  HiCube,
  HiSquares2X2,
  HiRocketLaunch,
  HiSun,
  HiMoon,
  HiGlobeAlt,
} from 'react-icons/hi2';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-fpl-accent/15 text-fpl-accent'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
  }`;

const dropdownItemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
    isActive
      ? 'bg-fpl-accent/15 text-fpl-accent'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
  }`;

const mobileItemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-3 rounded-lg text-sm transition-colors w-full ${
    isActive
      ? 'bg-fpl-accent/15 text-fpl-accent'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
  }`;

function Dropdown({ label, icon: Icon, items, currentPath, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = items.some((item) => currentPath.startsWith(item.to));

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-fpl-accent/15 text-fpl-accent'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        <HiChevronDown
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-56 bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 py-2 z-50">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={dropdownItemClass}
            >
              <item.icon className="w-4 h-4 opacity-60" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        title={current.name}
      >
        <HiGlobeAlt className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">{current.name}</span>
        <HiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-1 w-48 bg-white dark:bg-fpl-card border border-fpl-light-border dark:border-fpl-border rounded-xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 py-2 z-50 max-h-72 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setOpen(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 text-sm w-full transition-colors ${
                i18n.language === lang.code
                  ? 'bg-fpl-accent/15 text-fpl-accent'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const leagueItems = [
  { to: '/leagues', labelKey: 'nav.liveLeagues', icon: HiSignal },
  { to: '/leagues/stats', labelKey: 'nav.leagueStats', icon: HiChartBar },
  { to: '/leagues/combinations', labelKey: 'nav.leagueCombinations', icon: HiCube },
  { to: '/leagues/favorites', labelKey: 'nav.favoriteManagers', icon: HiStar },
  { to: '/leagues/elite', labelKey: 'nav.eliteManagers', icon: HiShieldCheck },
];

const statsItems = [
  { to: '/stats/effective-ownership', labelKey: 'nav.effectiveOwnerships', icon: HiPresentationChartLine },
  { to: '/stats/rank-tiers', labelKey: 'nav.rankTierInfo', icon: HiChartBar },
  { to: '/stats/ownership', labelKey: 'nav.ownershipCombinations', icon: HiSquares2X2 },
  { to: '/stats/chips', labelKey: 'nav.chipsTemplates', icon: HiPuzzlePiece },
  { to: '/stats/dgw', labelKey: 'nav.dgwOwnership', icon: HiArrowsRightLeft },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLeagues, setMobileLeagues] = useState(false);
  const [mobileStats, setMobileStats] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <nav className="bg-white/95 dark:bg-fpl-card/95 backdrop-blur-md border-b border-fpl-light-border dark:border-fpl-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-fpl-accent shrink-0">
          <HiRocketLaunch className="w-6 h-6" />
          <span>ActiveFPL</span>
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          <NavLink to="/" end className={navLinkClass}>
            <HiHome className="w-4 h-4" /> {t('nav.home')}
          </NavLink>
          <NavLink to="/rank" className={navLinkClass}>
            <HiChartBar className="w-4 h-4" /> {t('nav.rank')}
          </NavLink>
          <Dropdown
            label={t('nav.leagues')}
            icon={HiTrophy}
            items={leagueItems}
            currentPath={location.pathname}
            t={t}
          />
          <NavLink to="/players" className={navLinkClass}>
            <HiUsers className="w-4 h-4" /> {t('nav.players')}
          </NavLink>
          <NavLink to="/fixtures" className={navLinkClass}>
            <HiCalendar className="w-4 h-4" /> {t('nav.fixtures')}
          </NavLink>
          <NavLink to="/prices" className={navLinkClass}>
            <HiCurrencyDollar className="w-4 h-4" /> {t('nav.prices')}
          </NavLink>
          <NavLink to="/planner" className={navLinkClass}>
            <HiClipboardDocumentList className="w-4 h-4" /> {t('nav.planner')}
          </NavLink>
          <NavLink to="/games" className={navLinkClass}>
            <HiPuzzlePiece className="w-4 h-4" /> {t('nav.games')}
          </NavLink>
          <Dropdown
            label={t('nav.statistics')}
            icon={HiPresentationChartLine}
            items={statsItems}
            currentPath={location.pathname}
            t={t}
          />
          <NavLink to="/live" className={navLinkClass}>
            <span className="relative flex items-center gap-1.5">
              <HiSignal className="w-4 h-4" /> {t('nav.live')}
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-fpl-green rounded-full animate-pulse" />
            </span>
          </NavLink>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            title={theme === 'dark' ? t('settings.light') : t('settings.dark')}
          >
            {theme === 'dark' ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
          </button>

          {/* Language selector */}
          <LanguageSelector />

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-fpl-light-border dark:border-fpl-border px-4 pb-4 pt-2 space-y-1 max-h-[80vh] overflow-y-auto bg-white dark:bg-fpl-card">
          <NavLink to="/" end className={mobileItemClass}>
            <HiHome className="w-4 h-4" /> {t('nav.home')}
          </NavLink>
          <NavLink to="/rank" className={mobileItemClass}>
            <HiChartBar className="w-4 h-4" /> {t('nav.rank')}
          </NavLink>

          {/* Leagues accordion */}
          <button
            onClick={() => setMobileLeagues(!mobileLeagues)}
            className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <span className="flex items-center gap-2"><HiTrophy className="w-4 h-4" /> {t('nav.leagues')}</span>
            <HiChevronDown className={`w-3 h-3 transition-transform ${mobileLeagues ? 'rotate-180' : ''}`} />
          </button>
          {mobileLeagues && (
            <div className="pl-4 rtl:pr-4 rtl:pl-0 space-y-1">
              {leagueItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileItemClass}>
                  <item.icon className="w-4 h-4 opacity-60" /> {t(item.labelKey)}
                </NavLink>
              ))}
            </div>
          )}

          <NavLink to="/players" className={mobileItemClass}>
            <HiUsers className="w-4 h-4" /> {t('nav.players')}
          </NavLink>
          <NavLink to="/fixtures" className={mobileItemClass}>
            <HiCalendar className="w-4 h-4" /> {t('nav.fixtures')}
          </NavLink>
          <NavLink to="/prices" className={mobileItemClass}>
            <HiCurrencyDollar className="w-4 h-4" /> {t('nav.prices')}
          </NavLink>
          <NavLink to="/planner" className={mobileItemClass}>
            <HiClipboardDocumentList className="w-4 h-4" /> {t('nav.planner')}
          </NavLink>
          <NavLink to="/games" className={mobileItemClass}>
            <HiPuzzlePiece className="w-4 h-4" /> {t('nav.games')}
          </NavLink>

          {/* Statistics accordion */}
          <button
            onClick={() => setMobileStats(!mobileStats)}
            className="flex items-center justify-between w-full px-3 py-3 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <span className="flex items-center gap-2"><HiPresentationChartLine className="w-4 h-4" /> {t('nav.statistics')}</span>
            <HiChevronDown className={`w-3 h-3 transition-transform ${mobileStats ? 'rotate-180' : ''}`} />
          </button>
          {mobileStats && (
            <div className="pl-4 rtl:pr-4 rtl:pl-0 space-y-1">
              {statsItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileItemClass}>
                  <item.icon className="w-4 h-4 opacity-60" /> {t(item.labelKey)}
                </NavLink>
              ))}
            </div>
          )}

          <NavLink to="/live" className={mobileItemClass}>
            <HiSignal className="w-4 h-4" /> {t('nav.live')}
          </NavLink>
        </div>
      )}
    </nav>
  );
}