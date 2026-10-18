// Mounts the knowledge graph for the current example and keeps it in step with the visitor.

import type { EngineConfig, MatchSet, VisitorState } from '../../core/src/index.ts';
import type { Example } from './examples/types.ts';
import { createIntentGraph, type GraphHandle } from './graph.ts';
import { simulatePopulation } from './population.ts';

export function mountGraph(root: HTMLElement) {
  let graph: GraphHandle | null = null;
  return {
    /** A new industry means new categories: rebuild, and simulate its audience. */
    load(ex: Example, config: EngineConfig) {
      graph?.destroy();
      root.innerHTML = '';
      graph = createIntentGraph(root, { config });
      graph.showPopulation(simulatePopulation(ex, config, 400));
    },
    update(state: VisitorState | undefined, detail: MatchSet) {
      graph?.showVisitor(state, detail);
    },
  };
}
