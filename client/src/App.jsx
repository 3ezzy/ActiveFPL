import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TeamProvider } from './context/TeamContext';
import { ThemeProvider } from './context/ThemeContext';
import { languages } from './i18n';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import RankPage from './pages/RankPage';
import PlayersPage from './pages/PlayersPage';
import FixturesPage from './pages/FixturesPage';
import LeaguePage from './pages/LeaguePage';
import LivePage from './pages/LivePage';
import PricesPage from './pages/PricesPage';
import PlannerPage from './pages/PlannerPage';
import GamesPage from './pages/GamesPage';
import LeagueStatsPage from './pages/LeagueStatsPage';
import LeagueCombinationsPage from './pages/LeagueCombinationsPage';
import FavoriteManagersPage from './pages/FavoriteManagersPage';
import EliteManagersPage from './pages/EliteManagersPage';
import EffectiveOwnershipPage from './pages/EffectiveOwnershipPage';
import RankTiersPage from './pages/RankTiersPage';
import OwnershipCombinationsPage from './pages/OwnershipCombinationsPage';
import ChipsTemplatesPage from './pages/ChipsTemplatesPage';
import DgwOwnershipPage from './pages/DgwOwnershipPage';

function AppContent() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = languages.find((l) => l.code === i18n.language) || languages[0];
    document.documentElement.dir = lang.dir;
    document.documentElement.lang = lang.code;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 w-full flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/fixtures" element={<FixturesPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/prices" element={<PricesPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/games" element={<GamesPage />} />
          {/* Leagues */}
          <Route path="/leagues" element={<LeaguePage />} />
          <Route path="/leagues/stats" element={<LeagueStatsPage />} />
          <Route path="/leagues/combinations" element={<LeagueCombinationsPage />} />
          <Route path="/leagues/favorites" element={<FavoriteManagersPage />} />
          <Route path="/leagues/elite" element={<EliteManagersPage />} />
          {/* Statistics */}
          <Route path="/stats/effective-ownership" element={<EffectiveOwnershipPage />} />
          <Route path="/stats/rank-tiers" element={<RankTiersPage />} />
          <Route path="/stats/ownership" element={<OwnershipCombinationsPage />} />
          <Route path="/stats/chips" element={<ChipsTemplatesPage />} />
          <Route path="/stats/dgw" element={<DgwOwnershipPage />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TeamProvider>
        <AppContent />
      </TeamProvider>
    </ThemeProvider>
  );
}