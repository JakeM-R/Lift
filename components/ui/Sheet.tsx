'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Shows a close button in the header */
  showClose?: boolean
  /** Extra content rendered to the right of the title */
  headerRight?: React.ReactNode
}

export function Sheet({ open, onClose, title, children, showClose = true, headerRight }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--surface)] border-t border-[var(--border)] outline-none"
          style={{ maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          {(title || showClose || headerRight) && (
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
              <div className="w-8" /> {/* spacer */}
              {title && (
                <Dialog.Title className="text-base font-semibold text-[var(--text-primary)] font-heading text-center flex-1">
                  {title}
                </Dialog.Title>
              )}
              <div className="flex items-center gap-2">
                {headerRight}
                {showClose && (
                  <Dialog.Close asChild>
                    <button
                      onClick={onClose}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--border)] text-[var(--text-secondary)]"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Dialog.Close>
                )}
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="overflow-y-auto flex-1 pb-safe">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
