import { useNavigate, useParams } from 'react-router-dom';
import { ScoreBadge } from '../components/game/score-badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import {
  useFinishGameQuery,
  useMultiplayerResultQuery,
  useStartGameMutation
} from '../features/game/use-game';

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const resultsQuery = useFinishGameQuery(sessionId);
  const multiplayerResultQuery = useMultiplayerResultQuery(sessionId);
  const startGameMutation = useStartGameMutation();

  if (resultsQuery.isLoading) {
    return <LoadingSpinner label="Calculating your final score..." />;
  }

  if (resultsQuery.isError || !resultsQuery.data) {
    return (
      <ErrorState
        title="Unable to load results"
        description="Session might not be completed yet."
        onRetry={() => resultsQuery.refetch()}
      />
    );
  }

  const { summary, rounds } = resultsQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <Card className="manga-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="comic-kicker">Final Results</span>
            <span className="ink-stamp">SCORE LOG</span>
          </div>

          <h1 className="panel-title mt-3 text-6xl">Mission Complete</h1>
          <div className="speech-bubble mt-4 max-w-2xl">
            {summary.correctAnswers}/{summary.totalRounds} correct answers ({summary.accuracy}% accuracy)
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ScoreBadge score={summary.score} className="text-base" />
            <span className="flex h-[48px] items-center justify-center border-[4px] border-black bg-[#cf1a4f] px-4 py-1 text-sm font-black uppercase tracking-[0.12em] text-white shadow-sticker">
              Accuracy: {summary.accuracy}%
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              loading={startGameMutation.isPending}
              onClick={async () => {
                const session = await startGameMutation.mutateAsync(5);
                navigate(`/game/${session.session.id}`);
              }}
            >
              Play Again
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button variant="secondary" onClick={() => navigate('/leaderboard')}>
              Open Leaderboard
            </Button>
          </div>
        </Card>
      </div>

      {multiplayerResultQuery.data?.multiplayer ? (
        <Card className="space-y-3">
          <h2 className="panel-title text-4xl">Multiplayer Result</h2>
          {multiplayerResultQuery.data.ready ? (
            <>
              <div className="border-[4px] border-black bg-[#fffdf7] px-3 py-2 text-sm font-black text-base-ink shadow-sticker">
                Result: {multiplayerResultQuery.data.result}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="border-[4px] border-black bg-[#fffdf7] p-3 text-sm font-bold text-base-ink shadow-sticker">
                  <p>You</p>
                  <p>Score: {multiplayerResultQuery.data.you.score}</p>
                  <p>Accuracy: {multiplayerResultQuery.data.you.accuracy}%</p>
                  <p>
                    LP:{' '}
                    <span
                      className={
                        multiplayerResultQuery.data.you.eloDelta >= 0 ? 'text-[#1c8c3a]' : 'text-[#bc002d]'
                      }
                    >
                      {multiplayerResultQuery.data.you.eloDelta >= 0 ? '+' : ''}
                      {multiplayerResultQuery.data.you.eloDelta}
                    </span>
                  </p>
                  <p>
                    ELO:{' '}
                    {typeof multiplayerResultQuery.data.you.elo === 'number'
                      ? multiplayerResultQuery.data.you.elo
                      : 'Guest match'}
                  </p>
                </div>
                <div className="border-[4px] border-black bg-[#fffdf7] p-3 text-sm font-bold text-base-ink shadow-sticker">
                  <p>{multiplayerResultQuery.data.opponent.nickname}</p>
                  <p>Score: {multiplayerResultQuery.data.opponent.score}</p>
                  <p>Accuracy: {multiplayerResultQuery.data.opponent.accuracy}%</p>
                  <p>
                    LP:{' '}
                    <span
                      className={
                        multiplayerResultQuery.data.opponent.eloDelta >= 0 ? 'text-[#1c8c3a]' : 'text-[#bc002d]'
                      }
                    >
                      {multiplayerResultQuery.data.opponent.eloDelta >= 0 ? '+' : ''}
                      {multiplayerResultQuery.data.opponent.eloDelta}
                    </span>
                  </p>
                  <p>
                    ELO:{' '}
                    {typeof multiplayerResultQuery.data.opponent.elo === 'number'
                      ? multiplayerResultQuery.data.opponent.elo
                      : 'Guest match'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm font-bold text-base-ink/80">
              Waiting for {multiplayerResultQuery.data.opponentNickname} to finish...
            </p>
          )}
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="panel-title text-5xl">Round Breakdown</h2>
        {rounds.map((round, idx) => (
          <Card key={round.order} className={idx % 2 === 0 ? 'panel-overlap-left' : 'panel-overlap-right'}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.15em] text-base-ink/65">Round {round.order}</p>
              </div>
              <span
                className={`border-[4px] border-black px-3 py-1 text-xs font-black uppercase tracking-[0.13em] shadow-sticker ${
                  round.isCorrect ? 'bg-[#ffd000] text-black' : 'bg-[#cf1a4f] text-white'
                }`}
              >
                {round.isCorrect ? 'Correct' : 'Wrong'}
              </span>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-base-ink/85 md:grid-cols-2">
              <p>Selected: {round.selectedAnswer ?? 'No answer'}</p>
              <p>Correct: {round.correctAnswer}</p>
              <p>Points: {round.pointsAwarded}</p>
              <p>
                Response: {round.responseTimeMs ? `${(round.responseTimeMs / 1000).toFixed(1)}s` : '-'}
              </p>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
