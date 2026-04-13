import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  useJoinMultiplayerQueueMutation,
  useMultiplayerQueueStatusQuery
} from '../features/game/use-game';

export function MultiplayerQueuePage() {
  const navigate = useNavigate();
  const joinMutation = useJoinMultiplayerQueueMutation();
  const [ticketId, setTicketId] = useState<string | null>(null);
  const statusQuery = useMultiplayerQueueStatusQuery(ticketId);

  useEffect(() => {
    let active = true;
    joinMutation.mutate(5, {
      onSuccess: (payload) => {
        if (!active) return;
        setTicketId(payload.ticketId);
        if (payload.status === 'matched' && payload.sessionId) {
          navigate(`/game/${payload.sessionId}`, { replace: true });
        }
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (statusQuery.data?.status === 'matched' && statusQuery.data.sessionId) {
      navigate(`/game/${statusQuery.data.sessionId}`, { replace: true });
    }
  }, [statusQuery.data, navigate]);

  return (
    <Card className="mx-auto max-w-2xl space-y-5 text-center">
      <span className="comic-kicker">Multiplayer Mode</span>
      <h1 className="panel-title text-6xl">Searching Rival...</h1>
      <p className="text-base font-bold text-base-ink/80">
        Waiting in queue. You will be connected automatically when another player joins.
      </p>
      <div className="mx-auto h-5 w-5 animate-spin border-[4px] border-black border-t-[#bc002d]" />
      {statusQuery.data?.status === 'matched' ? (
        <p className="font-black text-[#bc002d]">
          Match found with {statusQuery.data.opponentNickname ?? 'Opponent'}!
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

