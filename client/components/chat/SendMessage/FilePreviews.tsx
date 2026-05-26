'use client';
import { useState } from 'react';
import Image from 'next/image';
import { FiAlertTriangle, FiCheck, FiFileText } from 'react-icons/fi';
import ImageModal from '@/components/common/ImageModal';
import type { FilePreview } from './useFileUpload';

interface FilePreviewsProps {
  filePreviews: FilePreview[];
  onRemove: (id: string) => void;
}

const RagStatusBadge = ({ ragStatus }: { ragStatus: FilePreview['ragStatus'] }) => {
  if (!ragStatus || ragStatus === 'completed' || ragStatus === 'skipped') {
    return (
      <span
        title="Ready"
        className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-green-500/20 text-green-400"
      >
        <FiCheck size={10} strokeWidth={3} />
      </span>
    );
  }

  if (ragStatus === 'processing') {
    return (
      <span
        title="Indexing document…"
        className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-4 h-4"
      >
        <span className="w-3.5 h-3.5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </span>
    );
  }

  if (ragStatus === 'failed') {
    return (
      <span
        title="Indexing failed — document may not be searchable"
        className="absolute bottom-1.5 right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400"
      >
        <FiAlertTriangle size={10} strokeWidth={2.5} />
      </span>
    );
  }

  return null;
};

const FilePreviews = ({ filePreviews, onRemove }: FilePreviewsProps) => {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  if (filePreviews.length === 0) return null;

  return (
    <>
      <div className="mb-2 p-3 bg-surface-elevated rounded-xl border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-medium text-body tracking-wide">
            Attachments ({filePreviews.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-50 overflow-y-auto p-0.5">
          {filePreviews.map(({ id, preview, type, name, ragStatus }) => (
            <div key={id} className="relative w-full pb-[100%] group">
              <div className="absolute inset-0 bg-surface-overlay rounded-lg overflow-hidden border border-border transition-all duration-200 hover:border-border-strong">
                {type === 'image' ? (
                  <div className="relative w-full h-full">
                    <button
                      onClick={() => setModalImage({ src: preview, alt: name })}
                      className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    >
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-surface-dim/90 to-transparent p-2 pt-6 pointer-events-none">
                      <p className="text-xs text-body truncate w-full">{name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                    <div className="bg-border p-3 rounded-lg mb-2">
                      <FiFileText size={28} className="text-accent" />
                    </div>
                    <p className="text-xs text-body truncate w-full font-medium">
                      {name}
                    </p>
                    <RagStatusBadge ragStatus={ragStatus} />
                  </div>
                )}
                <button
                  onClick={() => onRemove(id)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-surface-elevated/90 rounded-full text-body hover:text-red-400 text-sm transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Remove file preview"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalImage && (
        <ImageModal
          isOpen
          onClose={() => setModalImage(null)}
          imageSrc={modalImage.src}
          imageAlt={modalImage.alt}
        />
      )}
    </>
  );
};

export default FilePreviews;
