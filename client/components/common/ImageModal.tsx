"use client";
import { FiX } from "react-icons/fi";
import Image from "next/image";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt: string;
}

const ImageModal = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt,
}: ImageModalProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center bg-gray-800/90 rounded-full text-white hover:bg-gray-700 hover:scale-110 transition-all duration-200 shadow-lg border border-gray-600"
        aria-label="Close modal"
      >
        <FiX size={20} />
      </button>

      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1200}
            height={800}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
