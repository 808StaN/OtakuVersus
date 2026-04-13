import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HttpError } from '../api/http';
import { GameHUD } from '../components/game/game-hud';
import { SceneImageCard } from '../components/game/scene-image-card';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ErrorState } from '../components/ui/error-state';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { Modal } from '../components/ui/modal';
import { useAnimeTitlesQuery } from '../features/game/use-scene-meta';
import {
  useAnswerMutation,
  useGameSessionQuery,
  useMultiplayerRoundResultQuery,
  useMultiplayerSessionStatusQuery
} from '../features/game/use-game';
import { PublicRound } from '../types/api';

const ROUND_TIME_MS = 30_000;

export function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessionQuery = useGameSessionQuery(sessionId);
  const answerMutation = useAnswerMutation(sessionId);
  const animeTitlesQuery = useAnimeTitlesQuery();

  const [roundStartAt, setRoundStartAt] = useState<number>(Date.now());
  const [timerMs, setTimerMs] = useState(ROUND_TIME_MS);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string;
    selectedAnswer: string;
    pointsAwarded: number;
  } | null>(null);
  const [roundToast, setRoundToast] = useState<{
    you: { isCorrect: boolean; pointsAwarded: number };
    opponent: { isCorrect: boolean; pointsAwarded: number };
    opponentNickname: string;
  } | null>(null);
  const [roundToastVisible, setRoundToastVisible] = useState(false);
  const roundToastTimeoutRef = useRef<number | null>(null);
  const roundToastFadeRef = useRef<number | null>(null);
  const hasShownInitialCountdownRef = useRef(false);
  const [answerInput, setAnswerInput] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [canFinishAfterModal, setCanFinishAfterModal] = useState(false);
  const [pendingRoundOrder, setPendingRoundOrder] = useState<number | null>(null);
  const [pendingFinishAfterRound, setPendingFinishAfterRound] = useState(false);
  const [frozenRound, setFrozenRound] = useState<PublicRound | null>(null);
  const [multiplayerTimerState, setMultiplayerTimerState] = useState<{
    remainingMs: number;
    durationMs: number;
  } | null>(null);
  const [preRoundCountdown, setPreRoundCountdown] = useState<number | null>(null);

  const activeRoundOrder = frozenRound?.order ?? sessionQuery.data?.currentRound?.order;
  const currentRoundId = frozenRound?.id ?? sessionQuery.data?.currentRound?.id;
  const multiplayerStatusQuery = useMultiplayerSessionStatusQuery(sessionId, activeRoundOrder);
  const multiplayerRoundResultQuery = useMultiplayerRoundResultQuery(
    sessionId,
    pendingRoundOrder,
    Boolean(pendingRoundOrder)
  );

  useEffect(() => {
    hasShownInitialCountdownRef.current = false;
    setPreRoundCountdown(null);
  }, [sessionId]);

  useEffect(() => {
    if (!currentRoundId) return;
    setRoundStartAt(Date.now());
    setTimerMs(ROUND_TIME_MS);
    setMultiplayerTimerState(null);
    setAnswerInput('');
    setIsInputFocused(false);

    const isMultiplayer = Boolean(sessionQuery.data?.session.multiplayer);
    const roundOrder = frozenRound?.order ?? sessionQuery.data?.currentRound?.order ?? 0;

    if (isMultiplayer && roundOrder === 1 && !hasShownInitialCountdownRef.current) {
      setPreRoundCountdown(3);
      hasShownInitialCountdownRef.current = true;
    } else {
      setPreRoundCountdown(null);
    }
  }, [currentRoundId]);

  useEffect(() => {
    const status = multiplayerStatusQuery.data;
    if (!status?.multiplayer) return;
    if (typeof status.roundRemainingMs !== 'number') return;
    const durationMs =
      typeof status.roundDurationMs === 'number' && status.roundDurationMs > 0
        ? status.roundDurationMs
        : ROUND_TIME_MS;
    setMultiplayerTimerState({ remainingMs: status.roundRemainingMs, durationMs });
    setTimerMs(status.roundRemainingMs);
  }, [multiplayerStatusQuery.data]);

  useEffect(() => {
    if (preRoundCountdown === null) return;
    const interval = window.setInterval(() => {
      setPreRoundCountdown((current) => {
        if (current === null) return null;
        return current > 1 ? current - 1 : null;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [preRoundCountdown]);

  useEffect(() => {
    if (!currentRoundId) return;
    if (multiplayerStatusQuery.data?.multiplayer) return;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - roundStartAt;
      setTimerMs(Math.max(0, ROUND_TIME_MS - elapsed));
    }, 50);

    return () => window.clearInterval(interval);
  }, [currentRoundId, roundStartAt, multiplayerStatusQuery.data?.multiplayer]);

  useEffect(() => {
    if (!multiplayerStatusQuery.data?.multiplayer) return;
    if (preRoundCountdown !== null) return;
    const interval = window.setInterval(() => {
      setTimerMs((current) => Math.max(0, current - 100));
    }, 100);

    return () => window.clearInterval(interval);
  }, [multiplayerStatusQuery.data?.multiplayer, preRoundCountdown]);

  const disableAnswers =
    answerMutation.isPending || Boolean(feedback) || Boolean(pendingRoundOrder) || preRoundCountdown !== null;

  const continueAfterAnswer = async () => {
    setFeedback(null);
    setCanFinishAfterModal(false);
    if (canFinishAfterModal) {
      navigate(`/results/${sessionId}`);
      return;
    }
    await sessionQuery.refetch();
  };

  const handleAnswer = (option: string) => {
    if (!sessionId) return;
    if (!activeRoundOrder) return;

    const responseTimeMs = Date.now() - roundStartAt;

    answerMutation.mutate(
      { selectedAnswer: option, responseTimeMs },
      {
        onSuccess: (payload) => {
          if (payload.session.multiplayer) {
            setPendingRoundOrder(activeRoundOrder);
            setPendingFinishAfterRound(payload.session.canFinish);
            setFrozenRound(sessionQuery.data?.currentRound ?? null);
            setAnswerInput('');
            setIsInputFocused(false);
          } else {
            setFeedback(payload.result);
            setCanFinishAfterModal(payload.session.canFinish);
          }
        }
      }
    );
  };

  useEffect(() => {
    const roundResult = multiplayerRoundResultQuery.data;
    if (!pendingRoundOrder || !roundResult || roundResult.multiplayer === false || !roundResult.ready) {
      return;
    }

    setRoundToast({
      you: roundResult.you,
      opponent: roundResult.opponent,
      opponentNickname: roundResult.opponentNickname
    });
    setRoundToastVisible(true);
    setPendingRoundOrder(null);
    setFrozenRound(null);
    const shouldNavigateResults = pendingFinishAfterRound;
    setPendingFinishAfterRound(false);
    sessionQuery.refetch();

    if (shouldNavigateResults && sessionId) {
      const goResults = window.setTimeout(() => {
        navigate(`/results/${sessionId}`);
      }, 700);
      return () => window.clearTimeout(goResults);
    }
  }, [multiplayerRoundResultQuery.data, navigate, pendingFinishAfterRound, pendingRoundOrder, sessionId, sessionQuery]);

  useEffect(() => {
    if (!roundToast) return;
    if (roundToastTimeoutRef.current) {
      window.clearTimeout(roundToastTimeoutRef.current);
    }
    if (roundToastFadeRef.current) {
      window.clearTimeout(roundToastFadeRef.current);
    }

    roundToastFadeRef.current = window.setTimeout(() => {
      setRoundToastVisible(false);
      roundToastFadeRef.current = null;
    }, 4500);

    roundToastTimeoutRef.current = window.setTimeout(() => {
      setRoundToast(null);
      setRoundToastVisible(false);
      roundToastTimeoutRef.current = null;
    }, 5000);

    return () => {
      if (roundToastTimeoutRef.current) {
        window.clearTimeout(roundToastTimeoutRef.current);
        roundToastTimeoutRef.current = null;
      }
      if (roundToastFadeRef.current) {
        window.clearTimeout(roundToastFadeRef.current);
        roundToastFadeRef.current = null;
      }
    };
  }, [roundToast]);

  useEffect(() => {
    if (multiplayerStatusQuery.data?.multiplayer) return;
    if (!sessionId || !activeRoundOrder) return;
    if (timerMs > 0) return;
    if (disableAnswers) return;
    handleAnswer('TIMEOUT');
  }, [activeRoundOrder, disableAnswers, multiplayerStatusQuery.data?.multiplayer, sessionId, timerMs]);

  useEffect(() => {
    const status = multiplayerStatusQuery.data;
    if (!status?.multiplayer) return;
    if (pendingRoundOrder) return;
    if (typeof status.roundRemainingMs !== 'number' || status.roundRemainingMs > 0) return;
    sessionQuery.refetch();
  }, [multiplayerStatusQuery.data, pendingRoundOrder, sessionQuery]);

  useEffect(() => {
    const data = sessionQuery.data;
    if (!data?.session?.id) return;
    if (frozenRound || data.currentRound) return;
    navigate(`/results/${data.session.id}`, { replace: true });
  }, [frozenRound, navigate, sessionQuery.data]);

  if (sessionQuery.isLoading) {
    return <LoadingSpinner label="Preparing battle room..." />;
  }

  if (sessionQuery.isError) {
    const message = sessionQuery.error instanceof HttpError ? sessionQuery.error.message : 'Failed to load session';
    return <ErrorState title="Session Load Failed" description={message} onRetry={() => sessionQuery.refetch()} />;
  }

  const data = sessionQuery.data;

  if (!data) {
    return <ErrorState title="Session missing" description="No session data returned by server." />;
  }

  if (data.session.status === 'FINISHED') {
    return (
      <Card>
        <h2 className="panel-title text-4xl">This session is already finished</h2>
        <p className="mt-2 text-base-ink/75">Open final breakdown to see your score.</p>
        <div className="mt-4">
          <Button onClick={() => navigate(`/results/${data.session.id}`)}>Open Results</Button>
        </div>
      </Card>
    );
  }

  const currentRound = frozenRound ?? data.currentRound;

  if (!currentRound) {
    return <LoadingSpinner label="Calculating final results..." />;
  }

  const suggestionSource = animeTitlesQuery.data?.titles ?? [];

  const normalizedAnswer = suggestionSource.find(
    (option) => option.toLowerCase() === answerInput.trim().toLowerCase()
  );
  const filteredOptions = suggestionSource.filter((option) =>
    option.toLowerCase().includes(answerInput.trim().toLowerCase())
  );
  const showSuggestions =
    isInputFocused && answerInput.trim().length > 0 && filteredOptions.length > 0 && !disableAnswers;

  return (
    <div className="space-y-5">
      <GameHUD
        round={currentRound.order}
        totalRounds={data.session.totalRounds}
        score={data.session.score}
        timerMs={timerMs}
        roundDurationMs={multiplayerTimerState?.durationMs ?? ROUND_TIME_MS}
      />

      <div className="space-y-4">
        <SceneImageCard
          imageUrls={currentRound.imageUrls}
          animeMeta={currentRound.animeMeta}
        />
      </div>

      <Card className="relative z-40 mx-auto w-full max-w-xl space-y-4 overflow-visible">
        <div className="flex items-center justify-between gap-3">
          <span className="comic-kicker">Type Answer</span>
          {multiplayerStatusQuery.data?.multiplayer ? (
            <div className="border-[3px] border-black bg-[#fffdf7] px-3 py-1 text-xs font-black uppercase tracking-[0.1em] text-base-ink shadow-sticker">
              vs {multiplayerStatusQuery.data.opponentNickname ?? 'Player'}
              {typeof multiplayerStatusQuery.data.opponentElo === 'number'
                ? ` (ELO ${multiplayerStatusQuery.data.opponentElo})`
                : ''}
            </div>
          ) : null}
        </div>
        <div className="relative space-y-2">
          <input
            value={answerInput}
            autoComplete="off"
            disabled={disableAnswers}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsInputFocused(false), 120);
            }}
            onChange={(event) => setAnswerInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && normalizedAnswer && !disableAnswers) {
                event.preventDefault();
                handleAnswer(normalizedAnswer);
              }
            }}
            placeholder="Type anime title..."
            className="h-12 w-full border-[4px] border-black bg-[#fffdf7] px-3 text-base font-bold text-base-ink outline-none shadow-panel placeholder:text-base-ink/45"
          />
          {showSuggestions ? (
            <ul className="absolute bottom-full z-50 mb-1 max-h-80 w-full overflow-auto border-[4px] border-black bg-[#fffdf7] shadow-panel">
              {filteredOptions.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    className="w-full border-b-[2px] border-black/20 px-3 py-2 text-left text-sm font-bold text-base-ink hover:bg-[#ffe45a]"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => {
                      setAnswerInput(option);
                      setIsInputFocused(false);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <Button
          disabled={!normalizedAnswer || disableAnswers}
          onClick={() => normalizedAnswer && handleAnswer(normalizedAnswer)}
          className="w-full"
        >
          Confirm Answer
        </Button>
        {pendingRoundOrder ? (
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#bc002d]">
            Waiting for rival answer...
          </p>
        ) : null}
      </Card>

      {preRoundCountdown !== null ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
          <div className="border-[4px] border-black bg-[#fffdf7] px-10 py-8 text-center shadow-panel">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-base-ink/70">Get Ready</p>
            <p className="sfx-bam mt-2 !text-[#bc002d]">{preRoundCountdown}</p>
          </div>
        </div>
      ) : null}

      {roundToast ? (
        <aside
          className={`fixed bottom-4 right-4 z-40 w-[320px] rotate-[-2deg] border-[4px] border-black bg-[#fffdf7] p-3 shadow-panel transition-all duration-300 ${
            roundToastVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}
        >
          <p className="text-xs font-black uppercase tracking-[0.14em] text-base-ink/70">Round Summary</p>
          <div className="mt-2 grid gap-2 text-sm font-bold text-base-ink">
            <p>
              You: {roundToast.you.isCorrect ? 'Correct' : 'Wrong'} (+{roundToast.you.pointsAwarded})
            </p>
            <p>
              {roundToast.opponentNickname}: {roundToast.opponent.isCorrect ? 'Correct' : 'Wrong'} (+
              {roundToast.opponent.pointsAwarded})
            </p>
          </div>
        </aside>
      ) : null}

      <Modal
        isOpen={Boolean(feedback)}
        title={feedback?.isCorrect ? 'Direct Hit!' : 'Missed Shot'}
        onClose={() => {
          continueAfterAnswer();
        }}
        cta={
          <Button onClick={continueAfterAnswer}>
            {canFinishAfterModal ? 'See Results' : 'Next Round'}
          </Button>
        }
      >
        <p className="text-base font-bold">Selected: {feedback?.selectedAnswer}</p>
        <p className="mt-2 text-base font-bold">Correct answer: {feedback?.correctAnswer}</p>
        <p className="mt-2 text-base font-black text-[#cf1a4f]">+{feedback?.pointsAwarded ?? 0} pts</p>
      </Modal>
    </div>
  );
}
