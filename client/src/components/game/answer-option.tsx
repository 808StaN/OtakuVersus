import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

const LETTERS = ['A', 'B', 'C', 'D'];

export function AnswerOption({
  label,
  index,
  disabled,
  onClick
}: {
  label: string;
  index: number;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      className={cn('w-full justify-start px-4 py-4 text-left text-base font-black normal-case tracking-normal')}
      onClick={onClick}
    >
      <span className="mr-3 inline-flex h-7 w-7 shrink-0 items-center justify-center border-[3px] border-black bg-[#ffd000] text-xs font-black text-black shadow-sticker">
        {LETTERS[index] ?? '?'}
      </span>
      {label}
    </Button>
  );
}