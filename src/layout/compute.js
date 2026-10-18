import { paginate } from './paginate.js';
import { GAPS, SAFETY_PX } from './spec.js';

/** Medida + reparto. `measurer` aporta tamaños reales (ver measurer.js); aquí solo se coordinan. */
export function computeLayout(ctx, measurer) {
  const content = measurer.content();
  const headerHeight = measurer.headerHeight(ctx.song, content.width);
  const plan = paginate({
    units: ctx.units,
    measureFragment: (unitIndex, from, to) => measurer.fragment(ctx, unitIndex, from, to),
    content,
    headerHeight,
    columnGap: GAPS.column,
    rowGap: GAPS.row,
    headerGap: GAPS.header,
    safety: SAFETY_PX,
    maxPerRow: Number.isInteger(ctx.song.maxMeasuresPerRow) ? ctx.song.maxMeasuresPerRow : 0,
  });
  return { ...plan, content, headerHeight };
}
