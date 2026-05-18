import React from 'react';
import type { Scene } from '../types';
import { Dashboard } from '../dashboard/Dashboard';
import { SceneNotification } from '../dashboard/scenes/SceneNotification';
import { ScenePerfPanel } from '../dashboard/scenes/ScenePerfPanel';
import { SceneTwinPanel } from '../dashboard/scenes/SceneTwinPanel';
import { SceneOutcome } from '../dashboard/scenes/SceneOutcome';
import { CursorOverlay } from '../dashboard/overlays/CursorOverlay';
import { CursorViewOverlay } from '../dashboard/overlays/CursorViewOverlay';
import { CursorPerfRowOverlay } from '../dashboard/overlays/CursorPerfRowOverlay';
import { CursorActivateOverlay } from '../dashboard/overlays/CursorActivateOverlay';

interface ScreenContentProps {
  scene: Scene;
  twinApproved: boolean;
  folding?: boolean;
}

export const ScreenContent: React.FC<ScreenContentProps> = ({ scene, twinApproved, folding }) => (
  <>
    <Dashboard
      perfGlowing={scene === 'perf-glow'}
      twinGlowing={scene === 'twin-panel'}
      twinCardHidden={scene === 'twin-panel'}
      perfCardHidden={scene === 'perf-panel'}
      bellActive={scene === 'bell-ping' || scene === 'cursor-to-bell'}
      bellHiddenInHeader={scene === 'notification'}
    />
    {scene === 'cursor-to-bell'              && <CursorOverlay />}
    {scene === 'notification'                && <SceneNotification />}
    {scene === 'notification'                && <CursorViewOverlay />}
    {scene === 'perf-panel'                  && <ScenePerfPanel />}
    {scene === 'perf-panel'                  && <CursorPerfRowOverlay />}
    {scene === 'twin-panel'                  && <SceneTwinPanel approved={twinApproved} folding={folding} />}
    {scene === 'twin-panel' && !twinApproved && <CursorActivateOverlay />}
    {(scene === 'outcome' || scene === 'fading') && <SceneOutcome />}
  </>
);
