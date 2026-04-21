// Customer portal flow regression tests.
// Scaffolded by Phase 0 of the user-flow audit plan.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import DocumentLibrary, { type Document } from '../../components/document-library/DocumentLibrary';

const messages = {
  'common.confirm.title': 'Confirm action',
  'common.buttons.cancel': 'Cancel',
  'common.buttons.delete': 'Delete',
  'documents.confirmDelete': 'Delete "{fileName}"? This cannot be undone.',
  'documents.actions.delete': 'Delete document',
};

function renderWithIntl(ui: React.ReactNode) {
  return render(
    <IntlProvider locale='en' messages={messages} defaultLocale='en'>
      {ui}
    </IntlProvider>
  );
}

const sampleDoc: Document = {
  id: 'doc-1',
  name: 'inspection-2026.pdf',
  type: 'report',
  buildingId: 'b-1',
  buildingName: 'HQ',
  uploadedAt: new Date('2026-04-01'),
  uploadedBy: 'user-1',
  size: 1024,
  fileUrl: 'https://example.com/doc-1.pdf',
};

describe('customer portal flow', () => {
  describe('DocumentLibrary delete confirmation (fix #3)', () => {
    it('does not call onDelete when the user clicks delete without confirming', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderWithIntl(<DocumentLibrary documents={[sampleDoc]} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByLabelText('Delete document');
      await user.click(deleteButtons[0]);

      // AccessibleModal spreads role="dialog" on both wrapper and inner
      // container, so findAllByRole('dialog') returns 2 nodes per modal.
      const dialogs = await screen.findAllByRole('dialog');
      expect(dialogs.length).toBeGreaterThan(0);
      expect(onDelete).not.toHaveBeenCalled();
    });

    it('calls onDelete only after confirming', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderWithIntl(<DocumentLibrary documents={[sampleDoc]} onDelete={onDelete} />);

      await user.click(screen.getAllByLabelText('Delete document')[0]);
      const dialogs = await screen.findAllByRole('dialog');
      const dialog = dialogs[0];

      // Click the confirm Delete button inside the dialog.
      const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
        b => b.textContent?.trim() === 'Delete'
      );
      expect(confirmBtn).toBeDefined();
      await user.click(confirmBtn!);

      await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
      expect(onDelete).toHaveBeenCalledWith('doc-1');
    });

    it('cancel closes the modal without calling onDelete', async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      renderWithIntl(<DocumentLibrary documents={[sampleDoc]} onDelete={onDelete} />);

      await user.click(screen.getAllByLabelText('Delete document')[0]);
      const dialogs = await screen.findAllByRole('dialog');
      const dialog = dialogs[0];

      const cancelBtn = Array.from(dialog.querySelectorAll('button')).find(
        b => b.textContent?.trim() === 'Cancel'
      );
      await user.click(cancelBtn!);

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe('BuildingsList (fix #7)', () => {
    it.todo('virtualizes rendering for large building counts');
    it.todo('supports keyboard navigation across list items');
  });

  describe('images (fix #8)', () => {
    it.todo('BuildingsList images expose translated alt text');
    it.todo('AddressMapPreview image has non-empty alt or is marked decorative');
  });

  describe('offer acceptance', () => {
    it.todo('PublicOfferView accepts an offer and shows confirmation');
  });
});
