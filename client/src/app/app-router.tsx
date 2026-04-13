import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/main-layout';
import { DashboardPage } from '../pages/dashboard-page';
import { GamePage } from '../pages/game-page';
import { HistoryPage } from '../pages/history-page';
import { LandingPage } from '../pages/landing-page';
import { LeaderboardPage } from '../pages/leaderboard-page';
import { LoginPage } from '../pages/login-page';
import { NotFoundPage } from '../pages/not-found-page';
import { MultiplayerQueuePage } from '../pages/multiplayer-queue-page';
import { RegisterPage } from '../pages/register-page';
import { ResultsPage } from '../pages/results-page';
import { ProtectedRoute } from '../routes/protected-route';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/multiplayer" element={<MultiplayerQueuePage />} />
          <Route path="/game/:sessionId" element={<GamePage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<Navigate to="/history" replace />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
