import React, { useRef, useCallback } from 'react';

interface UseCarouselKeyboardNavOptions {
  rowId: string;
  itemCount: number;
  onSelectItem?: (index: number) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export const useCarouselKeyboardNav = ({
  rowId,
  itemCount,
  onSelectItem,
  scrollRef,
}: UseCarouselKeyboardNavOptions) => {
  const handleCardKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      // 1. Enter or Space: Select currently focused card
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onSelectItem) {
          onSelectItem(index);
        } else {
          (e.currentTarget as HTMLElement).click();
        }
        return;
      }

      // 2. ArrowRight: Focus next card in current row
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = Math.min(index + 1, itemCount - 1);
        if (nextIndex !== index) {
          const nextElement = document.querySelector<HTMLElement>(
            `[data-carousel-row="${rowId}"][data-carousel-index="${nextIndex}"]`
          );
          if (nextElement) {
            nextElement.focus();
            nextElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
        return;
      }

      // 3. ArrowLeft: Focus previous card in current row
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = Math.max(index - 1, 0);
        if (prevIndex !== index) {
          const prevElement = document.querySelector<HTMLElement>(
            `[data-carousel-row="${rowId}"][data-carousel-index="${prevIndex}"]`
          );
          if (prevElement) {
            prevElement.focus();
            prevElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
        return;
      }

      // 4. ArrowDown: Navigate to the corresponding or closest card in the next row
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const allRows = Array.from(document.querySelectorAll<HTMLElement>('[data-carousel-row-container]'));
        const currentRowContainer = (e.currentTarget as HTMLElement).closest('[data-carousel-row-container]');
        if (currentRowContainer) {
          const currentRowIdx = allRows.indexOf(currentRowContainer as HTMLElement);
          if (currentRowIdx !== -1 && currentRowIdx < allRows.length - 1) {
            const nextRowContainer = allRows[currentRowIdx + 1];
            const nextRowCards = Array.from(nextRowContainer.querySelectorAll<HTMLElement>('[data-carousel-index]'));
            if (nextRowCards.length > 0) {
              const targetCard = nextRowCards[Math.min(index, nextRowCards.length - 1)] || nextRowCards[0];
              targetCard.focus();
              targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
          }
        }
        return;
      }

      // 5. ArrowUp: Navigate to the corresponding card in the previous row
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const allRows = Array.from(document.querySelectorAll<HTMLElement>('[data-carousel-row-container]'));
        const currentRowContainer = (e.currentTarget as HTMLElement).closest('[data-carousel-row-container]');
        if (currentRowContainer) {
          const currentRowIdx = allRows.indexOf(currentRowContainer as HTMLElement);
          if (currentRowIdx > 0) {
            const prevRowContainer = allRows[currentRowIdx - 1];
            const prevRowCards = Array.from(prevRowContainer.querySelectorAll<HTMLElement>('[data-carousel-index]'));
            if (prevRowCards.length > 0) {
              const targetCard = prevRowCards[Math.min(index, prevRowCards.length - 1)] || prevRowCards[0];
              targetCard.focus();
              targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
          } else {
            // Scroll to top of window if at the topmost row
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        return;
      }

      // 6. Home: Jump to the very first card
      if (e.key === 'Home') {
        e.preventDefault();
        const firstElement = document.querySelector<HTMLElement>(
          `[data-carousel-row="${rowId}"][data-carousel-index="0"]`
        );
        if (firstElement) {
          firstElement.focus();
          firstElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
        return;
      }

      // 7. End: Jump to the last card
      if (e.key === 'End') {
        e.preventDefault();
        const lastElement = document.querySelector<HTMLElement>(
          `[data-carousel-row="${rowId}"][data-carousel-index="${itemCount - 1}"]`
        );
        if (lastElement) {
          lastElement.focus();
          lastElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        }
        return;
      }
    },
    [rowId, itemCount, onSelectItem]
  );

  return { handleCardKeyDown };
};
