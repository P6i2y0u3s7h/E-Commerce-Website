/** Delete confirmation modal. */
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  productName?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  productName,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const displayName = productName || itemName || 'this item';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Product">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <p className="text-slate-700 font-medium">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-slate-900">"{displayName}"</span>?
          </p>
          <p className="text-slate-500 text-sm mt-1">
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn-danger flex-1"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
