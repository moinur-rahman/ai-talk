import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Model, Provider } from '@/services/modelApi';

interface ModelState {
  selectedModel: Model | null;
  selectedProvider: Provider | null;
  reasoningEnabled: boolean;
  responseStyle: string;
}

const initialState: ModelState = {
  selectedModel: null,
  selectedProvider: null,
  reasoningEnabled: false,
  responseStyle: 'Normal',
};

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setSelectedModel: (state, action: PayloadAction<Model | null>) => {
      state.selectedModel = action.payload;
    },
    setSelectedProvider: (state, action: PayloadAction<Provider | null>) => {
      state.selectedProvider = action.payload;
    },
    setReasoningEnabled: (state, action: PayloadAction<boolean>) => {
      state.reasoningEnabled = action.payload;
    },
    setResponseStyle: (state, action: PayloadAction<string>) => {
      state.responseStyle = action.payload;
    },
  },
});

export const {
  setSelectedModel,
  setSelectedProvider,
  setReasoningEnabled,
  setResponseStyle,
} = modelSlice.actions;
export default modelSlice.reducer;
