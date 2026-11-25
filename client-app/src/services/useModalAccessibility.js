import { useEffect, useRef } from 'react';

const activeModalStack = [];

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const getFocusableElements = (container) => {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement
  );
};

export default function useModalAccessibility({
  isOpen = true,
  onClose,
  modalRef,
  initialFocusRef,
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const modalToken = Symbol('modal');
    activeModalStack.push(modalToken);
    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.requestAnimationFrame(() => {
      const container = modalRef?.current;
      if (!container) return;

      const target =
        initialFocusRef?.current ||
        getFocusableElements(container)[0] ||
        container;

      if (target && typeof target.focus === 'function') {
        if (!target.hasAttribute('tabindex') && target === container) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      }
    });

    const handleKeyDown = (event) => {
      if (activeModalStack[activeModalStack.length - 1] !== modalToken) {
        return;
      }

      if (event.key === 'Escape') {
        event.stopPropagation();
        if (typeof onCloseRef.current === 'function') {
          onCloseRef.current();
        }
        return;
      }

      if (event.key === 'Tab') {
        const container = modalRef?.current;
        if (!container) return;

        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !container.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !container.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);

      const index = activeModalStack.lastIndexOf(modalToken);
      if (index !== -1) {
        activeModalStack.splice(index, 1);
      }

      if (previousActiveElement && previousActiveElement.isConnected) {
        previousActiveElement.focus({ preventScroll: true });
      }
    };
  }, [isOpen, modalRef, initialFocusRef]);
}
