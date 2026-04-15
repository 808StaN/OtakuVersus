import { useState } from "react";
import { LeaderboardTable } from "../components/game/leaderboard-table";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ErrorState } from "../components/ui/error-state";
import { LoadingSpinner } from "../components/ui/loading-spinner";
import { useAuth } from "../features/auth/auth-context";
import { useHistoryQuery } from "../features/history/use-history-query";
import {
  useEloLeaderboardQuery,
  useLeaderboardQuery,
} from "../features/leaderboard/use-leaderboard-query";

export function LeaderboardPage() {
  const { isAuthenticated, user } = useAuth();
  const [rankingView, setRankingView] = useState<"single" | "elo">("single");
  const singleLeaderboardQuery = useLeaderboardQuery(1000);
  const eloLeaderboardQuery = useEloLeaderboardQuery(1000);
  const myHistoryQuery = useHistoryQuery(50, isAuthenticated);

  const activeQuery =
    rankingView === "single" ? singleLeaderboardQuery : eloLeaderboardQuery;
  if (activeQuery.isLoading) {
    return <LoadingSpinner label="Loading leaderboard..." />;
  }

  if (activeQuery.isError || !activeQuery.data) {
    return (
      <ErrorState
        title="Leaderboard unavailable"
        onRetry={() => activeQuery.refetch()}
      />
    );
  }

  const singleRows = singleLeaderboardQuery.data?.leaderboard ?? [];
  const eloRows = eloLeaderboardQuery.data?.leaderboard ?? [];
  const tableRows = (rankingView === "single" ? singleRows : eloRows).slice(
    0,
    50,
  );

  const highestSingleScore = singleRows.length
    ? Math.max(...singleRows.map((row) => row.score))
    : 0;
  const avgSingleScore = singleRows.length
    ? Math.round(
        singleRows.reduce((acc, row) => acc + row.score, 0) / singleRows.length,
      )
    : 0;
  const avgSingleAccuracy = singleRows.length
    ? Math.round(
        (singleRows.reduce(
          (acc, row) => acc + (row.correctAnswers / row.totalRounds) * 100,
          0,
        ) /
          singleRows.length) *
          10,
      ) / 10
    : 0;

  const highestElo = eloRows.length
    ? Math.max(...eloRows.map((row) => row.elo))
    : 0;
  const avgWinRatio = eloRows.length
    ? Number(
        (
          eloRows.reduce((acc, row) => acc + row.winRatio, 0) / eloRows.length
        ).toFixed(1),
      )
    : 0;
  const avgMatchesPlayed = eloRows.length
    ? Math.round(
        eloRows.reduce((acc, row) => acc + row.matchesPlayed, 0) /
          eloRows.length,
      )
    : 0;

  const myStats = myHistoryQuery.data?.stats;
  const hasMyStats = Boolean(isAuthenticated && myStats);
  const normalizedUserNickname = user?.nickname.trim().toLowerCase();
  const mySingleRank = normalizedUserNickname
    ? (singleRows.find(
        (row) => row.nickname.trim().toLowerCase() === normalizedUserNickname,
      )?.position ?? null)
    : null;
  const myEloRank = normalizedUserNickname
    ? (eloRows.find(
        (row) => row.nickname.trim().toLowerCase() === normalizedUserNickname,
      )?.position ?? null)
    : null;
  const myEloPoints = normalizedUserNickname
    ? (eloRows.find(
        (row) => row.nickname.trim().toLowerCase() === normalizedUserNickname,
      )?.elo ?? null)
    : null;
  const myMatchesPlayed = normalizedUserNickname
    ? (eloRows.find(
        (row) => row.nickname.trim().toLowerCase() === normalizedUserNickname,
      )?.matchesPlayed ?? null)
    : null;
  const myWinRatio = normalizedUserNickname
    ? (eloRows.find(
        (row) => row.nickname.trim().toLowerCase() === normalizedUserNickname,
      )?.winRatio ?? null)
    : null;

  return (
    <div className="space-y-5">
      <div
        className={`${isAuthenticated ? "comic-layout-asym" : "space-y-4"} mb-16`}
      >
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="comic-kicker">Ranking Board</span>
            <span className="ink-stamp">Top 50</span>
          </div>
          <h1 className="panel-title mt-3 text-6xl">
            {rankingView === "single"
              ? "Singleplayer Leaderboard"
              : "Multiplayer Leaderboard"}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={rankingView === "single" ? "primary" : "secondary"}
              onClick={() => setRankingView("single")}
              className="px-3 py-1 text-xs focus:ring-0 focus:ring-offset-0"
            >
              Singleplayer
            </Button>
            <Button
              type="button"
              variant={rankingView === "elo" ? "primary" : "secondary"}
              onClick={() => setRankingView("elo")}
              className="px-3 py-1 text-xs focus:ring-0 focus:ring-offset-0"
            >
              Multiplayer
            </Button>
          </div>
          <div className="mt-4 max-w-2xl border-[4px] border-black bg-[#fffdf7] px-4 py-3 text-base font-bold text-base-ink shadow-sticker">
            {rankingView === "single"
              ? "Highest score runs from solo mode only."
              : "Rated multiplayer ladder based on ELO points."}
          </div>
        </Card>

        {isAuthenticated ? (
          <div className="space-y-4">
            <Card>
              <span className="comic-kicker">Your Stats</span>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:text-base">
                {rankingView === "single" ? (
                  <>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Best Score
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {hasMyStats ? myStats?.bestScore : 0}
                      </p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Avg Score
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {hasMyStats
                          ? Math.round(myStats?.averageScore ?? 0)
                          : 0}
                      </p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Sessions
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {hasMyStats ? myStats?.totalSessions : 0}
                      </p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Current Rank
                      </p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        {mySingleRank ? `#${mySingleRank}` : "Unranked"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Your ELO
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {myEloPoints ?? user?.elo ?? 1000}
                      </p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Win Ratio
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{`${myWinRatio ?? 0}%`}</p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Matches Played
                      </p>
                      <p className="mt-1 text-2xl font-black text-slate-950">
                        {myMatchesPlayed ?? 0}
                      </p>
                    </div>
                    <div className="comic-note">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Current Rank
                      </p>
                      <p className="mt-1 text-base font-black text-slate-950">
                        {myEloRank ? `#${myEloRank}` : "Unranked"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        ) : null}
      </div>

      <div className="sfx-bam text-center">TOP 50</div>
      <LeaderboardTable rows={tableRows} rankingType={rankingView} />
    </div>
  );
}
