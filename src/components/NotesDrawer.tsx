import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bookmark, Trash2 } from 'lucide-react';
import { QuickNote } from '../types';

interface NotesDrawerProps {
  isOpen: boolean;
  notes: QuickNote[];
  onClose: () => void;
  onClearNotes: () => void;
  onDeleteNote: (id: string) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  notes,
  onClose,
  onClearNotes,
  onDeleteNote,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-zinc-950/95 border-l border-zinc-800 p-6 z-50 flex flex-col shadow-2xl backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Roxy's Memory</h2>
                  <p className="text-xs text-zinc-400">Notes & bookmarks taken during chat</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
                aria-label="Close notes drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {notes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <Bookmark className="w-10 h-10 text-zinc-700 mb-3" />
                  <p className="text-sm font-medium text-zinc-400">No notes saved yet</p>
                  <p className="text-xs text-zinc-600 mt-1 max-w-xs">
                    Ask Roxy: "Take a note about my meeting tomorrow" or "Remember that I love matcha lattes!"
                  </p>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors group relative"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-purple-400 font-medium text-[10px] uppercase">
                        {note.category}
                      </span>
                      <span>{new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-zinc-200">{note.text}</p>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                      aria-label="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notes.length > 0 && (
              <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-500">{notes.length} items saved</span>
                <button
                  onClick={onClearNotes}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
