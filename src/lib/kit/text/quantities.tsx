import React, { createContext, useContext, useMemo } from 'react';
import { resolveColor, useTheme } from '../../theme';
import type { InkName } from '../../theme';

const QuantityContext = createContext<Record<string, string>>({});

/**
 * Declares a scene's quantities once: `{ reward: 'blue', mean: 'yellow' }`.
 * Everything that shows a quantity reads its colour from here — `Formula`
 * terms tagged `\q{reward}{…}`, `Term` words in a phrase, chart marks via
 * `useQuantityColors()` — so a quantity is one colour wherever it appears.
 * Nested providers add to (and may override) the ones above.
 */
export const Quantities: React.FC<React.PropsWithChildren<{ map: Record<string, InkName | (string & {})> }>> = ({
  map,
  children,
}) => {
  const parent = useContext(QuantityContext);
  const merged = useMemo(() => ({ ...parent, ...map }), [parent, map]);
  return <QuantityContext.Provider value={merged}>{children}</QuantityContext.Provider>;
};

/** key → resolved CSS colour for every declared quantity */
export const useQuantityColors = (): Record<string, string> => {
  const t = useTheme();
  const map = useContext(QuantityContext);
  return useMemo(
    () => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, resolveColor(t, v, t.palette.colors.text)])),
    [map, t],
  );
};

/** A word in running text that names a quantity — it takes that quantity's colour. */
export const Term: React.FC<{ of: string; children: React.ReactNode }> = ({ of, children }) => {
  const color = useQuantityColors()[of];
  return <span style={{ color }}>{children}</span>;
};
