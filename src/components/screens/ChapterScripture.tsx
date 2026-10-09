import type { Theme } from "@/lib/themes";
import type { BibleBook } from "@/lib/bible/books";
import { ChapterView } from "@/components/bible/ChapterView";
import { StepHeader } from "@/components/screens/StepHeader";
import { Icon } from "@/components/Icon";

/**
 * Step one when the passage is a whole chapter.
 *
 * The verse screen sets its passage as a pull quote, centred and large, because a verse is
 * something to be struck by. A chapter is something to be read, and the same treatment would turn
 * Psalm 119 into a wall — so this sets it in reading type, lets the page scroll, and puts the way
 * on at the end, where a reader arrives having actually finished.
 */
export function ChapterScripture({
  book,
  chapter,
  theme,
  onContinue,
}: {
  book: BibleBook;
  chapter: number;
  theme: Theme;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 px-7 py-7 lg:gap-8 lg:px-16 lg:py-12">
      <StepHeader label={theme.name} accent={theme.accent} step={1} />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <header className="text-center">
          <h1 className="font-serif text-3xl text-ink lg:text-4xl">
            {book.name} {chapter}
          </h1>
          <p className="mt-1.5 text-xs text-ink-muted lg:text-sm">Read it through, unhurried. The questions come after.</p>
        </header>

        <ChapterView bookId={book.id} bookName={book.name} chapter={chapter} />

        <button
          onClick={onContinue}
          className="group mx-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium lg:text-base"
          style={{ color: theme.accent }}
        >
          Continue
          <Icon name="arrow-right" className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
