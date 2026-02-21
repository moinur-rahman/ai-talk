import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Model, Provider } from "@/services/modelApi";

interface ModelState {
  selectedModel: Model | null;
  selectedProvider: Provider | null;
  reasoningEnabled: boolean;
}

const initialState: ModelState = {
  selectedModel: null,
  selectedProvider: null,
  reasoningEnabled: false,
};

export const modelSlice = createSlice({
  name: "model",
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
  },
});

export const { setSelectedModel, setSelectedProvider, setReasoningEnabled } =
  modelSlice.actions;
export default modelSlice.reducer;
