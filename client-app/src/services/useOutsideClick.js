import { useEffect, useRef } from 'react';

export default function useOutsideClick(ref, handler, enabled = true) {
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof handler !== 'function') {
      pressedOutsideRef.current = false;
      return;
    }

    const isOutside = (target) => {
      return ref.current && !ref.current.contains(target);
    };

    const handlePointerDown = (event) => {
      pressedOutsideRef.current = Boolean(isOutside(event.target));
    };

    const handlePointerUp = (event) => {
      if (pressedOutsideRef.current && isOutside(event.target)) {
        pressedOutsideRef.current = false;
        handler(event);
        return;
      }
      pressedOutsideRef.current = false;
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [ref, handler, enabled]);
}
