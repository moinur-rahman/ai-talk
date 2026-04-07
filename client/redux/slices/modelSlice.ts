import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model } from '@/services/modelApi';

interface ModelState {
  selectedModel: Model | null;
  reasoningLevel: string | null;
  webSearchEnabled: boolean;
  imageGenerationEnabled: boolean;
  responseStyle: string;
}

const initialState: ModelState = {
  selectedModel: null,
  reasoningLevel: null,
  webSearchEnabled: false,
  imageGenerationEnabled: false,
  responseStyle: 'Normal',
};

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<Model | null>) => {
      state.selectedModel = action.payload;
    },
    setReasoningLevel: (state, action: PayloadAction<string | null>) => {
      state.reasoningLevel = action.payload;
    },
    setWebSearchEnabled: (state, action: PayloadAction<boolean>) => {
      state.webSearchEnabled = action.payload;
      if (action.payload) state.imageGenerationEnabled = false;
    },
    setImageGenerationEnabled: (state, action: PayloadAction<boolean>) => {
      state.imageGenerationEnabled = action.payload;
      if (action.payload) state.webSearchEnabled = false;
    },
    setResponseStyle: (state, action: PayloadAction<string>) => {
      state.responseStyle = action.payload;
    },
  },
});

export const {
  setSelectedModel,
  setReasoningLevel,
  setWebSearchEnabled,
  setImageGenerationEnabled,
  setResponseStyle,
} = modelSlice.actions;
export default modelSlice.reducer;
