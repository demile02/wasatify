'use client';

import { useEffect } from 'react';

const editableSelector = 'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [data-copy-allowed="true"]';

export function CopyGuard() {
  useEffect(() => {
    function allowEditableTarget(event: Event) {
      return event.composedPath().some((target) => (
        target instanceof Element
        && (target.matches(editableSelector) || target.closest(editableSelector) !== null)
      ));
    }

    function blockClipboard(event: ClipboardEvent) {
      if (!allowEditableTarget(event)) event.preventDefault();
    }

    function blockContextMenu(event: MouseEvent) {
      if (!allowEditableTarget(event)) event.preventDefault();
    }

    function blockSelection(event: Event) {
      if (!allowEditableTarget(event)) event.preventDefault();
    }

    document.addEventListener('copy', blockClipboard, true);
    document.addEventListener('cut', blockClipboard, true);
    document.addEventListener('contextmenu', blockContextMenu, true);
    document.addEventListener('selectstart', blockSelection, true);

    return () => {
      document.removeEventListener('copy', blockClipboard, true);
      document.removeEventListener('cut', blockClipboard, true);
      document.removeEventListener('contextmenu', blockContextMenu, true);
      document.removeEventListener('selectstart', blockSelection, true);
    };
  }, []);

  return null;
}
