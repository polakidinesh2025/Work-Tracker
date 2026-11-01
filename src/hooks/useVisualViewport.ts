import { useEffect, useState } from 'react';

interface ViewportBox {
  height: number;
  offsetTop: number;
}

/**
 * The part of the screen not covered by the on-screen keyboard. iOS Safari
 * doesn't shrink fixed elements when the keyboard opens, so the drawer sizes
 * itself to this box to keep the comment box visible. Null when unsupported.
 */
export function useVisualViewport(): ViewportBox | null {
  const read = (): ViewportBox | null => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    return vv ? { height: vv.height, offsetTop: vv.offsetTop } : null;
  };
  const [box, setBox] = useState(read);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setBox({ height: vv.height, offsetTop: vv.offsetTop });
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return box;
}
