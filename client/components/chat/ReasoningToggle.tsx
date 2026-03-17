'use client';
import { FC } from 'react';
import { FiCpu } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setReasoningEnabled } from '@/redux/slices/modelSlice';

const ReasoningToggle: FC = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state) => state.model.selectedModel);
  const reasoningEnabled = useAppSelector(
    (state) => state.model.reasoningEnabled,
  );

  if (!selectedModel || !selectedModel.hasReasoning) {
    return null;
  }

  const handleToggle = () => {
    dispatch(setReasoningEnabled(!reasoningEnabled));
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated rounded-lg border border-border">
      <FiCpu
        size={14}
        className={`${
          reasoningEnabled ? 'text-amber-400' : 'text-muted'
        } transition-colors`}
      />
      <span className="text-xs text-body font-medium tracking-wide">
        Reasoning
      </span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:ring-offset-1 focus:ring-offset-surface-elevated ${
          reasoningEnabled ? 'bg-amber-500' : 'bg-border'
        }`}
        role="switch"
        aria-checked={reasoningEnabled}
        aria-label="Toggle AI reasoning"
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            reasoningEnabled ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ReasoningToggle;
