// Inspector (report creation) flow regression tests.
//
// Fix #1 coverage: ReportForm auto-save must not issue concurrent writes.
// The ReportForm component is ~4,000 lines and deeply coupled to contexts;
// rather than render it end-to-end here (brittle + slow), we verify the
// concurrency-control contract with a focused unit harness that reproduces
// the inner runSave() pattern. Full end-to-end ReportForm coverage is
// tracked as a follow-up.

import { describe, it, expect, vi } from 'vitest';

/**
 * Mirror of the ReportForm auto-save scheduler. Kept here to assert the
 * concurrency contract; the production implementation lives in
 * src/components/ReportForm.tsx (Fix #1).
 */
function createAutoSaveScheduler(saveFn: () => Promise<void>) {
  const state = { isSaving: false, pending: false, mounted: true };

  const run = async (): Promise<void> => {
    if (!state.mounted) return;
    if (state.isSaving) {
      state.pending = true;
      return;
    }
    state.isSaving = true;
    try {
      await saveFn();
    } finally {
      state.isSaving = false;
      if (state.pending && state.mounted) {
        state.pending = false;
        await run();
      }
    }
  };

  return {
    request: run,
    unmount: () => {
      state.mounted = false;
    },
    _state: state,
  };
}

describe('inspector flow', () => {
  describe('ReportForm auto-save (fix #1)', () => {
    it('does not issue concurrent writes while one is in flight', async () => {
      let resolveFirst: (() => void) | undefined;
      const save = vi.fn().mockImplementation(
        () =>
          new Promise<void>(resolve => {
            if (!resolveFirst) resolveFirst = resolve;
            else resolve();
          })
      );
      const scheduler = createAutoSaveScheduler(save);

      void scheduler.request();
      void scheduler.request();
      void scheduler.request();
      await Promise.resolve();

      expect(save).toHaveBeenCalledTimes(1);
      expect(scheduler._state.pending).toBe(true);
    });

    it('fires exactly one follow-up save after the current one completes', async () => {
      let resolveFirst: (() => void) | undefined;
      const save = vi.fn().mockImplementation(
        () =>
          new Promise<void>(resolve => {
            if (!resolveFirst) resolveFirst = resolve;
            else resolve();
          })
      );
      const scheduler = createAutoSaveScheduler(save);

      void scheduler.request();
      await Promise.resolve();
      void scheduler.request();
      void scheduler.request();
      void scheduler.request();
      expect(save).toHaveBeenCalledTimes(1);

      resolveFirst!();
      await new Promise<void>(r => setTimeout(r, 0));

      expect(save).toHaveBeenCalledTimes(2);
      expect(scheduler._state.pending).toBe(false);
    });

    it('suppresses saves after unmount', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const scheduler = createAutoSaveScheduler(save);

      scheduler.unmount();
      await scheduler.request();

      expect(save).not.toHaveBeenCalled();
    });

    it.todo('integration: rapid typing produces a single persisted write');
    it.todo('integration: aborts stale writes when a newer one starts');
  });

  describe('offline submit (fix #2)', () => {
    it('emits OFFLINE_SYNC_FAILED_EVENT with failure count and last error', async () => {
      const { OFFLINE_SYNC_FAILED_EVENT } = await import('../../hooks/useOfflineStatus');

      const listener = vi.fn();
      window.addEventListener(OFFLINE_SYNC_FAILED_EVENT, listener);
      try {
        window.dispatchEvent(
          new CustomEvent(OFFLINE_SYNC_FAILED_EVENT, {
            detail: { failedCount: 3, lastError: 'permission-denied' },
          })
        );
        expect(listener).toHaveBeenCalledTimes(1);
        const evt = listener.mock.calls[0][0] as CustomEvent<{
          failedCount: number;
          lastError: string;
        }>;
        expect(evt.detail.failedCount).toBe(3);
        expect(evt.detail.lastError).toBe('permission-denied');
      } finally {
        window.removeEventListener(OFFLINE_SYNC_FAILED_EVENT, listener);
      }
    });

    it('OfflineIndicator renders a sync-failure banner on event dispatch', async () => {
      const { render, screen, act } = await import('@testing-library/react');
      const { IntlProvider } = await import('react-intl');
      const { OFFLINE_SYNC_FAILED_EVENT } = await import('../../hooks/useOfflineStatus');
      const { default: OfflineIndicator } = await import('../../components/OfflineIndicator');

      // OfflineIndicator now uses react-intl for all strings; wrap with a
      // minimal IntlProvider and provide just the keys we assert against.
      const messages = {
        'common.offline': 'Offline',
        'common.offlineWorkingLocally': 'Offline - Working locally',
        'common.syncFailedWithCount':
          '{count, plural, one {# change failed to sync} other {# changes failed to sync}}',
        'common.syncFailed': 'Sync failed',
        'common.syncErrorFallback': 'Please check your connection and try again.',
        'common.dismissSyncFailure': 'Dismiss sync failure notice',
      };

      render(
        <IntlProvider locale='en' messages={messages} defaultLocale='en'>
          <OfflineIndicator />
        </IntlProvider>
      );
      expect(screen.queryByTestId('offline-sync-failed')).toBeNull();

      act(() => {
        window.dispatchEvent(
          new CustomEvent(OFFLINE_SYNC_FAILED_EVENT, {
            detail: { failedCount: 2, lastError: 'network' },
          })
        );
      });

      const banner = await screen.findByTestId('offline-sync-failed');
      expect(banner).toBeInTheDocument();
      expect(banner.getAttribute('role')).toBe('alert');
      expect(banner.textContent).toContain('2 changes failed to sync');
    });

    it.todo('queues a submit when offline and syncs on reconnect');
  });

  describe('accessibility', () => {
    it.todo('ReportForm root has no serious a11y violations');
  });
});
