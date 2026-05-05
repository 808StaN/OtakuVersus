import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HttpError } from '../api/http';
import { getMultiplayerQueueStatus } from '../api/game-api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ErrorState } from '../components/ui/error-state';
import { LoadingGlyph } from '../components/ui/loading-spinner';
import { useJoinMultiplayerQueueMutation } from '../features/game/use-game';
import { MultiplayerQueueResponse } from '../types/api';

export function MultiplayerQueuePage() {
  const navigate = useNavigate();
  const joinMutation = useJoinMultiplayerQueueMutation();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<MultiplayerQueueResponse | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);
  const hasJoinedRef = useRef(false);

  const joinQueue = async () => {
    try {
      setQueueError(null);
      const payload = await joinMutation.mutateAsync(5);
      setQueueState(payload);
      setTicketId(payload.ticketId);
      if (payload.status === 'matched' && payload.sessionId) {
        navigate(`/game/${payload.sessionId}`, { replace: true });
      }
    } catch (error) {
      setQueueError(error instanceof HttpError ? error.message : 'Unable to connect to multiplayer queue');
    }
  };

  useEffect(() => {
    if (hasJoinedRef.current) return;
    hasJoinedRef.current = true;
    void joinQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ticketId) return;

    let active = true;
    const fetchStatus = async () => {
      try {
        const payload = await getMultiplayerQueueStatus(ticketId);
        if (!active) return;
        setQueueState(payload);
        if (payload.status === 'matched' && payload.sessionId) {
          navigate(`/game/${payload.sessionId}`, { replace: true });
        }
      } catch (error) {
        if (!active) return;
        setQueueError(error instanceof HttpError ? error.message : 'Unable to refresh queue status');
      }
    };

    void fetchStatus();
    const interval = window.setInterval(() => {
      void fetchStatus();
    }, 1200);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [ticketId, navigate]);

  if (queueError) {
    return (
      <ErrorState
        title="Queue connection failed"
        description={queueError}
        onRetry={() => {
          hasJoinedRef.current = false;
          setTicketId(null);
          setQueueState(null);
          setQueueError(null);
          joinMutation.reset();
          void joinQueue();
        }}
      />
    );
  }

  if (joinMutation.isPending && !queueState) {
    return (
      <Card className="mx-auto max-w-2xl space-y-5 text-center">
        <span className="comic-kicker">Multiplayer Mode</span>
        <h1 className="panel-title text-4xl sm:text-5xl md:text-6xl">Connecting...</h1>
        <LoadingGlyph />
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl space-y-5 text-center">
      <span className="comic-kicker">Multiplayer Mode</span>
      <h1 className="panel-title text-4xl sm:text-5xl md:text-6xl">Searching Rival...</h1>
      <p className="text-base font-bold text-base-ink/80">
        Waiting in queue. You will be connected automatically when another player joins.
      </p>
      <LoadingGlyph />
      {queueState?.status === 'matched' ? (
        <p className="font-black text-[#bc002d]">
          Match found with {queueState.opponentNickname ?? 'Opponent'}
          {typeof queueState.opponentElo === 'number' ? ` (ELO ${queueState.opponentElo})` : ''}!
        </p>
      ) : null}
      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Back
        </Button>
      </div>
    </Card>
  );
}
