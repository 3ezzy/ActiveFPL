import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
} from 'react-icons/hi2';

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-fpl-accent/15 text-fpl-accent'
      : 'text-gray-300 hover:text-white hover:bg-white/5'
  }`;

const dropdownItemClass = ({ isActive }) =>
  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors w-full ${
    isActive
      ? 'bg-fpl-accent/15 text-fpl-accent'
      : 'text-gray-300 hover:text-white hover:bg-white/5'
  }`;

function Dropdown({ label, icon: Icon, items, currentPath }) {
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
            : 'text-gray-300 hover:text-white hover:bg-white/5'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        <HiChevronDown
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-fpl-card border border-fpl-border rounded-xl shadow-xl shadow-black/30 py-2 z-50">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={dropdownItemClass}
            >
              <item.icon className="w-4 h-4 opacity-60" />
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const leagueItems = [
  { to: '/leagues', label: 'Live Leagues', icon: HiSignal },
  { to: '/leagues/stats', label: 'League Stats', icon: HiChartBar },
  { to: '/leagues/combinations', label: 'League Combinations', icon: HiCube },
  { to: '/leagues/favorites', label: 'Favorite Managers', icon: HiStar },
  { to: '/leagues/elite', label: 'Elite Managers', icon: HiShieldCheck },
];

const statsItems = [
  { to: '/stats/effective-ownership', label: 'Effective Ownerships', icon: HiPresentationChartLine },
  { to: '/stats/rank-tiers', label: 'Rank Tier Info', icon: HiChartBar },
  { to: '/stats/ownership', label: 'Ownership Combinations', icon: HiSquares2X2 },
  { to: '/stats/chips', label: 'Chips & Templates', icon: HiPuzzlePiece },
  { to: '/stats/dgw', label: 'DGW Ownership', icon: HiArrowsRightLeft },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileLeagues, setMobileLeagues] = useState(false);
  const [mobileStats, setMobileStats] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-fpl-card/95 backdrop-blur-md border-b border-fpl-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-fpl-accent shrink-0">
          <HiRocketLaunch className="w-6 h-6" />
          <span>ActiveFPL</span>
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          <NavLink to="/" end className={navLinkClass}>
            <HiHome className="w-4 h-4" /> Home
          </NavLink>
          <NavLink to="/rank" className={navLinkClass}>
            <HiChartBar className="w-4 h-4" /> Rank
          </NavLink>
          <Dropdown
            label="Leagues"
            icon={HiTrophy}
            items={leagueItems}
            currentPath={location.pathname}
          />
          <NavLink to="/players" className={navLinkClass}>
            <HiUsers className="w-4 h-4" /> Players
          </NavLink>
          <NavLink to="/fixtures" className={navLinkClass}>
            <HiCalendar className="w-4 h-4" /> Fixtures
          </NavLink>
          <NavLink to="/prices" className={navLinkClass}>
            <HiCurrencyDollar className="w-4 h-4" /> Prices
          </NavLink>
          <NavLink to="/planner" className={navLinkClass}>
            <HiClipboardDocumentList className="w-4 h-4" /> Planner
          </NavLink>
          <NavLink to="/games" className={navLinkClass}>
            <HiPuzzlePiece className="w-4 h-4" /> Games
          </NavLink>
          <Dropdown
            label="Statistics"
            icon={HiPresentationChartLine}
            items={statsItems}
            currentPath={location.pathname}
          />
          <NavLink to="/live" className={navLinkClass}>
            <span className="relative flex items-center gap-1.5">
              <HiSignal className="w-4 h-4" /> Live
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-fpl-green rounded-full animate-pulse" />
            </span>
          </NavLink>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-gray-300 hover:text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <HiXMark className="w-6 h-6" /> : <HiBars3 className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-fpl-border px-4 pb-4 pt-2 space-y-1 max-h-[80vh] overflow-y-auto">
          <NavLink to="/" end onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiHome className="w-4 h-4" /> Home
          </NavLink>
          <NavLink to="/rank" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiChartBar className="w-4 h-4" /> Rank
          </NavLink>

          {/* Leagues accordion */}
          <button
            onClick={() => setMobileLeagues(!mobileLeagues)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5"
          >
            <span className="flex items-center gap-2"><HiTrophy className="w-4 h-4" /> Leagues</span>
            <HiChevronDown className={`w-3 h-3 transition-transform ${mobileLeagues ? 'rotate-180' : ''}`} />
          </button>
          {mobileLeagues && (
            <div className="pl-4 space-y-1">
              {leagueItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
                  <item.icon className="w-4 h-4 opacity-60" /> {item.label}
                </NavLink>
              ))}
            </div>
          )}

          <NavLink to="/players" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiUsers className="w-4 h-4" /> Players
          </NavLink>
          <NavLink to="/fixtures" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiCalendar className="w-4 h-4" /> Fixtures
          </NavLink>
          <NavLink to="/prices" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiCurrencyDollar className="w-4 h-4" /> Prices
          </NavLink>
          <NavLink to="/planner" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiClipboardDocumentList className="w-4 h-4" /> Planner
          </NavLink>
          <NavLink to="/games" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiPuzzlePiece className="w-4 h-4" /> Games
          </NavLink>

          {/* Statistics accordion */}
          <button
            onClick={() => setMobileStats(!mobileStats)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5"
          >
            <span className="flex items-center gap-2"><HiPresentationChartLine className="w-4 h-4" /> Statistics</span>
            <HiChevronDown className={`w-3 h-3 transition-transform ${mobileStats ? 'rotate-180' : ''}`} />
          </button>
          {mobileStats && (
            <div className="pl-4 space-y-1">
              {statsItems.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
                  <item.icon className="w-4 h-4 opacity-60" /> {item.label}
                </NavLink>
              ))}
            </div>
          )}

          <NavLink to="/live" onClick={() => setMobileOpen(false)} className={dropdownItemClass}>
            <HiSignal className="w-4 h-4" /> Live
          </NavLink>
        </div>
      )}
    </nav>
  );
}
