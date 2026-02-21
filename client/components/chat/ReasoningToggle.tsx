"use client";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCpu } from "react-icons/fi";
import { RootState } from "@/redux/store";
import { setReasoningEnabled } from "@/redux/slices/modelSlice";

const ReasoningToggle: FC = () => {
  const dispatch = useDispatch();
  const selectedModel = useSelector(
    (state: RootState) => state.model.selectedModel
  );
  const reasoningEnabled = useSelector(
    (state: RootState) => state.model.reasoningEnabled
  );

  if (!selectedModel || !selectedModel.hasReasoning) {
    return null;
  }

  const handleToggle = () => {
    dispatch(setReasoningEnabled(!reasoningEnabled));
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
      <FiCpu
        size={16}
        className={`${
          reasoningEnabled ? "text-amber-400" : "text-gray-400"
        } transition-colors`}
      />
      <span className="text-sm text-gray-300 font-medium">AI Reasoning</span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
          reasoningEnabled ? "bg-amber-500" : "bg-gray-600"
        }`}
        role="switch"
        aria-checked={reasoningEnabled}
        aria-label="Toggle AI reasoning"
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            reasoningEnabled ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default ReasoningToggle;
