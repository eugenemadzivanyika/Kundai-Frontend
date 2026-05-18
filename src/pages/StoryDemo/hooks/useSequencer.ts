import { useState, useRef, useCallback, useEffect } from 'react';
import type { Scene, SwapPhase } from '../types';

export function useSequencer(visible: boolean) {
  const [scene, setScene] = useState<Scene>('idle');
  const [swapPhase, setSwapPhase] = useState<SwapPhase>('none');
  const [phoneStarted, setPhoneStarted] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [twinApproved, setTwinApproved] = useState(false);
  const [showFloatingToast, setShowFloatingToast] = useState(false);
  const [toastAbsorbing, setToastAbsorbing] = useState(false);
  const [preWakePhone, setPreWakePhone] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAll = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const after = useCallback((ms: number, fn: () => void) => { const id = setTimeout(fn, ms); timers.current.push(id); }, []);

  const triggerSwap = useCallback(() => {
    setSwapPhase('folding');
    setShowFloatingToast(true);
    after(1750, () => {
      setSwapPhase('flash');
      after(140, () => {
        setSwapPhase('phone-in');
        setScene('phone');
        after(1600, () => setPreWakePhone(true));
        after(2800, () => setPreWakePhone(false));
        after(2900, () => setToastAbsorbing(true));
        after(3800, () => setShowFloatingToast(false));
        after(3200, () => setPhoneStarted(true));
      });
    });
  }, [after, setShowFloatingToast, setToastAbsorbing, setPreWakePhone]);

  const runSequence = useCallback(() => {
    clearAll();
    setTwinApproved(false);
    setShowFloatingToast(false);
    setToastAbsorbing(false);
    setPreWakePhone(false);
    setSwapPhase('none');
    setScene('dashboard');
    after(3000,  () => setScene('bell-ping'));
    after(4200,  () => setScene('cursor-to-bell'));
    after(5500,  () => setScene('notification'));
    after(8700,  () => setScene('perf-glow'));
    after(10100, () => setScene('perf-panel'));
    after(12300, () => setScene('twin-panel'));
    after(16300, () => setTwinApproved(true));
    after(18300, triggerSwap);
  }, [clearAll, after, triggerSwap]);

  const hasStarted = useRef(false);
  useEffect(() => {
    if (!visible || hasStarted.current) return;
    hasStarted.current = true;
    after(400, runSequence);
  }, [visible, runSequence, after]);

  const handlePhoneComplete = useCallback(() => {
    after(2000, () => {
      setScene('outcome');
      after(3500, () => {
        setScene('fading');
        after(600, () => {
          clearAll();
          setPhoneStarted(false);
          setSwapPhase('none');
          setRestartKey(k => k + 1);
          setScene('idle');
          after(200, runSequence);
        });
      });
    });
  }, [after, clearAll, runSequence]);

  useEffect(() => () => clearAll(), [clearAll]);
  return { scene, swapPhase, phoneStarted, restartKey, twinApproved, handlePhoneComplete, showFloatingToast, toastAbsorbing, preWakePhone };
}
