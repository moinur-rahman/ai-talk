'use client';
import { useEffect, useRef } from 'react';
import { FiCheck, FiLoader, FiX } from 'react-icons/fi';

interface VoiceRecorderOverlayProps {
  mediaStreamRef: React.RefObject<MediaStream | null>;
  isTranscribing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const BAR_COUNT = 55;
const BAR_WIDTH = 3;
const BAR_GAP = 2.5;
const MIN_BAR_HEIGHT = 3;

const VoiceRecorderOverlay = ({
  mediaStreamRef,
  isTranscribing,
  onConfirm,
  onCancel,
}: VoiceRecorderOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stream = mediaStreamRef.current;
    if (!canvas || !stream) {
      return;
    }

    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (canvas.width !== w * devicePixelRatio) {
        canvas.width = w * devicePixelRatio;
        canvas.height = h * devicePixelRatio;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      analyser.getByteFrequencyData(dataArray);

      const scale = devicePixelRatio;
      const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;
      const startX = (canvas.width / scale - totalWidth) / 2;
      const centerY = canvas.height / scale / 2;

      for (let i = 0; i < BAR_COUNT; i++) {
        const dataIndex = Math.floor((i / BAR_COUNT) * bufferLength * 0.6);
        const value = dataArray[dataIndex] / 255;

        // Taper bars toward edges for a natural waveform look
        const edgeFactor =
          1 -
          Math.pow((Math.abs(i - BAR_COUNT / 2) / (BAR_COUNT / 2)) * 0.6, 2);
        const barHeight = Math.max(
          MIN_BAR_HEIGHT,
          value * centerY * 1.6 * edgeFactor,
        );

        const x = (startX + i * (BAR_WIDTH + BAR_GAP)) * scale;
        const y = (centerY - barHeight / 2) * scale;
        const bw = BAR_WIDTH * scale;
        const bh = barHeight * scale;
        const radius = (bw / 2) * scale * 0.4;

        ctx.fillStyle = isTranscribing
          ? 'rgba(255,255,255,0.3)'
          : 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, radius);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      audioCtx.close();
    };
  }, [mediaStreamRef, isTranscribing]);

  return (
    <div className="flex items-center gap-2 w-full px-2 py-1.5 min-h-[2.5rem]">
      <div className="flex-1 h-10 relative">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <button
        type="button"
        onClick={onCancel}
        disabled={isTranscribing}
        aria-label="Cancel recording"
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-surface-overlay text-muted hover:text-primary hover:bg-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiX size={14} />
      </button>

      {isTranscribing ? (
        <div className="shrink-0 w-7 h-7 flex items-center justify-center">
          <FiLoader size={15} className="text-accent animate-spin" />
        </div>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          aria-label="Confirm recording"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
        >
          <FiCheck size={14} />
        </button>
      )}
    </div>
  );
};

export default VoiceRecorderOverlay;
