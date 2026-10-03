import React from 'react';
import { defineScene, step } from '@/lib/timeline';
import { Board, Captions, DiagramView, Formula, Quantities, Term } from '@/lib/kit';
import { muownDiagram, muownIds } from '../diagrams/prep-muown.diagram';
import { pick } from '../quantities';

/**
 * §3.2 — what Muown adds to Muon. MiMo gives it one sentence, so the mechanism
 * follows the Muown paper (Lion et al., 2026): every row of a weight matrix is
 * kept as a length g and a direction R, Muon updates the directions and Adam
 * the lengths, and the forward pass rebuilds W from the two.
 *
 * Figure + equation: the diagram's g and R wear the same inks as the
 * equation's terms.
 */
const QUANTITIES = pick('g', 'dir');

export const muownScene = defineScene(
  {
    id: '03-muown',
    title: 'Muown은 무엇을 더할까?',
    steps: [step('split', 2.8), step('direction', 2.4), step('length', 2.4), step('stable', 2.6, { hold: 0.6 })],
  },
  () => (
    <Quantities map={QUANTITIES}>
      <Board
        title="Muown은 무엇을 더할까?"
        source="MiMo-V2.6 §3.2 · Muown (Lion et al., 2026)"
        layout="split"
        figure={
          <DiagramView
            diagram={muownDiagram}
            stepEffects={{
              // W is in no reveal → on screen from frame 0 (the anchor)
              split: { reveal: muownIds.split, highlight: ['g', 'r'] },
              direction: { reveal: muownIds.direction, highlight: ['muon', 'r'], pulse: ['e-muon-r'] },
              length: { reveal: muownIds.length, highlight: ['adam', 'g'], pulse: ['e-adam-g'] },
              stable: { highlight: ['g', 'w'], pulse: ['e-g-w'] },
            }}
          />
        }
        formula={
          <Formula
            size="lg"
            // no `write`: the equation is on screen from frame 0, next to the lone W node, so the first frame is not bare
            indicate={[
              { key: 'dir', step: 'direction', delay: 0.9 },
              { key: 'dir#1', step: 'direction', delay: 0.9 },
              { key: 'g', step: 'length', delay: 0.9 },
            ]}
            box={{ key: 'g', step: 'stable', delay: 0.8 }}
          >
            {'W = \\mathrm{Diag}\\!\\left(\\frac{\\q{g}{g}}{\\lVert \\q{dir}{R} \\rVert_{\\mathrm{row}}}\\right)\\q{dir}{R}'}
          </Formula>
        }
        caption={
          <Captions
            items={[
              { step: 'split', text: <>가중치의 각 행을 <Term of="g">길이</Term>와 <Term of="dir">방향</Term>으로 나눕니다</> },
              { step: 'direction', text: <><Term of="dir">방향</Term>은 Muon이 고칩니다</> },
              { step: 'length', text: <><Term of="g">길이</Term>는 Adam이 조금씩만 고칩니다</> },
              { step: 'stable', text: <>행 <Term of="g">길이</Term>가 튀지 않아서 가중치 크기가 안정됩니다</> },
            ]}
          />
        }
      />
    </Quantities>
  ),
);

export default muownScene;
