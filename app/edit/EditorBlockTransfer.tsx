'use client';

import { ActionBar, createUsePuck } from '@puckeditor/core';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  BLOCK_CLIPBOARD_STORAGE_KEY,
  makeBlockClipboard,
  parseBlockClipboard,
  pasteBlock,
} from '@/lib/block-transfer';

const usePuckData = createUsePuck();
const clipboardEvent = 'open-canvas:block-clipboard-change';

function readClipboard() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(BLOCK_CLIPBOARD_STORAGE_KEY);
    return raw ? parseBlockClipboard(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeClipboard(component: Parameters<typeof makeBlockClipboard>[0]) {
  const value = makeBlockClipboard(component);
  window.sessionStorage.setItem(BLOCK_CLIPBOARD_STORAGE_KEY, JSON.stringify(value));
  window.dispatchEvent(new Event(clipboardEvent));
}

function useClipboardAvailable() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const refresh = () => setAvailable(Boolean(readClipboard()));
    refresh();
    window.addEventListener(clipboardEvent, refresh);
    return () => window.removeEventListener(clipboardEvent, refresh);
  }, []);
  return available;
}

export function EditorBlockActionBar({ children, label, parentAction }: { children: ReactNode; label?: string; parentAction?: ReactNode }) {
  const selectedItem = usePuckData((state) => state.selectedItem);
  const itemSelector = usePuckData((state) => state.appState.ui.itemSelector);
  const data = usePuckData((state) => state.appState.data);
  const dispatch = usePuckData((state) => state.dispatch);
  const clipboardAvailable = useClipboardAvailable();

  const copy = () => {
    if (!selectedItem) return;
    writeClipboard(selectedItem);
  };

  const pasteAfter = () => {
    const clipboard = readClipboard();
    if (!clipboard) return;
    const target = itemSelector && typeof itemSelector.index === 'number'
      ? { index: itemSelector.index, zone: itemSelector.zone }
      : undefined;
    dispatch({ type: 'setData', data: pasteBlock(data, clipboard, target) });
  };

  return <ActionBar label={label || 'Block actions'}>
    {parentAction ? <ActionBar.Group>{parentAction}</ActionBar.Group> : null}
    <ActionBar.Group>{children}</ActionBar.Group>
    <ActionBar.Group>
      <ActionBar.Action onClick={copy} label="Copy block">Copy</ActionBar.Action>
      <ActionBar.Action onClick={pasteAfter} label="Paste block after selection" disabled={!clipboardAvailable}>Paste</ActionBar.Action>
    </ActionBar.Group>
  </ActionBar>;
}

export function EditorPasteBlockButton() {
  const data = usePuckData((state) => state.appState.data);
  const dispatch = usePuckData((state) => state.dispatch);
  const clipboardAvailable = useClipboardAvailable();

  return <button
    type="button"
    disabled={!clipboardAvailable}
    title={clipboardAvailable ? 'Paste copied block at the end of this page' : 'Copy a block first'}
    style={{ padding: '10px 14px', border: '1px solid #8b8e96', borderRadius: 6, background: '#fff', color: '#15171a', fontWeight: 600, minHeight: 44, cursor: clipboardAvailable ? 'pointer' : 'not-allowed', opacity: clipboardAvailable ? 1 : .5 }}
    onClick={() => {
      const clipboard = readClipboard();
      if (!clipboard) return;
      dispatch({ type: 'setData', data: pasteBlock(data, clipboard) });
    }}
  >
    Paste block
  </button>;
}
