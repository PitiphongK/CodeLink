"use client";
import { useEffect, useRef } from "react";
import type { Awareness } from "y-protocols/awareness";
import type * as monaco from "monaco-editor";

export type AwarenessUser = { name?: string; color?: string; id?: string };
export type AwarenessScroll = { top: number; left: number; ts: number };
export type AwarenessState = { user?: AwarenessUser; scroll?: AwarenessScroll };

// 
function throttle<T extends (...args: any[]) => void>(fn: T, waitMs: number): T {
  let last = 0;
  let timer: any = null;

  return function (this: any, ...args: any[]) {
    const now = Date.now();
    const remaining = waitMs - (now - last);

    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  } as T;
}

export function useMonacoFollowScroll(params: {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  awareness: Awareness | null;
  followTargetClientId: number | null;
  onTargetGone?: () => void;
}) {
  const { editor, awareness, followTargetClientId, onTargetGone } = params;

  const isApplyingRemoteRef = useRef(false);
  const lastAppliedRemoteTsRef = useRef(0);

  // Publish local scroll (only when NOT following)
  useEffect(() => {
    if (!editor || !awareness) return;

    const publish = throttle(() => {
      if (followTargetClientId != null) return; // don't broadcast while following
      if (isApplyingRemoteRef.current) return; // ignore scroll caused by remote apply

      awareness.setLocalStateField("scroll", {
        top: editor.getScrollTop(),
        left: editor.getScrollLeft(),
        ts: Date.now(),
      } satisfies AwarenessScroll);
    }, 50);

    const disposable = editor.onDidScrollChange(() => publish());
    publish(); // publish once so others can snap immediately

    return () => disposable.dispose();
  }, [editor, awareness, followTargetClientId]);

  // Apply target scroll when following
  useEffect(() => {
    if (!editor || !awareness) return;
    if (followTargetClientId == null) return;

    const applyFromTarget = () => {
      const st = awareness.getStates().get(followTargetClientId) as AwarenessState | undefined;

      // target disappeared
      if (!st) {
        onTargetGone?.();
        return;
      }

      const scroll = st.scroll;
      if (!scroll) return;

      // ignore old updates
      if (scroll.ts <= lastAppliedRemoteTsRef.current) return;

      const currTop = editor.getScrollTop();
      const currLeft = editor.getScrollLeft();

      // avoid tiny jitter
      const topDelta = Math.abs(currTop - scroll.top);
      const leftDelta = Math.abs(currLeft - scroll.left);
      if (topDelta < 2 && leftDelta < 2) return;

      lastAppliedRemoteTsRef.current = scroll.ts;

      requestAnimationFrame(() => {
        isApplyingRemoteRef.current = true;
        editor.setScrollTop(scroll.top);
        editor.setScrollLeft(scroll.left);
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 0);
      });
    };

    // apply immediately when starting to follow
    applyFromTarget();

    const handler = ({ removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      if (removed.includes(followTargetClientId)) {
        onTargetGone?.();
        return;
      }
      applyFromTarget();
    };

    awareness.on("change", handler);
    return () => awareness.off("change", handler);
  }, [editor, awareness, followTargetClientId, onTargetGone]);
}
