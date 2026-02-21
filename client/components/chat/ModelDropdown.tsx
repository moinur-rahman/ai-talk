"use client";
import { FC, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select, { StylesConfig } from "react-select";
import {
  setSelectedModel,
  setSelectedProvider,
  setReasoningEnabled,
} from "@/redux/slices/modelSlice";
import {
  useGetProvidersQuery,
  useGetModelsQuery,
  useUpdateDefaultModelMutation,
  useGetDefaultModelQuery,
} from "@/services/modelApi";
import { RootState } from "@/redux/store";
import { useChat } from "@/contexts/ChatContext";

interface ModelOption {
  label: string;
  value: string;
}

export const customStyles: StylesConfig<ModelOption> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: "transparent",
    color: "#fff",
    borderColor: "transparent",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "#1f2937",
    },
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: "#1f2937",
    color: "#fff",
  }),
  option: (styles, { isFocused, isSelected }) => {
    let backgroundColor = "#1f2937";
    if (isFocused) backgroundColor = "#374151";
    if (isSelected) backgroundColor = "#4b5563";

    return {
      ...styles,
      backgroundColor,
      color: isSelected ? "#fff" : "#d1d5db",
      "&:hover": {
        backgroundColor: "#374151",
      },
    };
  },
  placeholder: (styles) => ({
    ...styles,
    color: "#9ca3af",
  }),
  singleValue: (styles) => ({
    ...styles,
    color: "#fff",
  }),
  input: (styles) => ({
    ...styles,
    color: "#fff",
  }),
};

const ModelDropdown: FC = () => {
  const { conversationId } = useChat();

  const dispatch = useDispatch();
  const selectedProvider = useSelector(
    (state: RootState) => state.model.selectedProvider
  );
  const selectedModel = useSelector(
    (state: RootState) => state.model.selectedModel
  );

  const [updateDefaultModel] = useUpdateDefaultModelMutation();
  const { data: defaultModel } = useGetDefaultModelQuery();
  const { data: providers } = useGetProvidersQuery();

  const { data: models = [], isLoading } = useGetModelsQuery(
    selectedProvider?.id ?? "",
    {
      skip: !selectedProvider,
    }
  );

  useEffect(() => {
    if (!conversationId) {
      dispatch(setSelectedModel(null));
      dispatch(setSelectedProvider(null));
    }
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (
      !conversationId &&
      defaultModel &&
      providers &&
      !selectedModel &&
      !selectedProvider
    ) {
      const provider = providers.find((p) => p.id === defaultModel.providerId);
      if (provider) {
        dispatch(setSelectedProvider(provider));
      }
    }
  }, [
    defaultModel,
    providers,
    selectedModel,
    selectedProvider,
    dispatch,
    conversationId,
  ]);

  useEffect(() => {
    if (
      !conversationId &&
      defaultModel &&
      models.length > 0 &&
      !selectedModel &&
      selectedProvider &&
      defaultModel.providerId === selectedProvider.id
    ) {
      const model = models.find((m) => m.id === defaultModel.modelId);
      if (model) {
        dispatch(setSelectedModel(model));
      }
    }
  }, [
    defaultModel,
    models,
    selectedModel,
    selectedProvider,
    dispatch,
    conversationId,
  ]);

  const handleOptionClick = async (newValue: unknown) => {
    const modelOption = newValue as ModelOption;
    const selectedModelData = models.find((m) => m.id === modelOption.value);

    dispatch(
      setSelectedModel({
        id: modelOption.value,
        name: modelOption.label,
        hasReasoning: selectedModelData?.hasReasoning || false,
      })
    );

    if (!selectedModelData?.hasReasoning) {
      dispatch(setReasoningEnabled(false));
    }

    if (!conversationId && selectedProvider) {
      try {
        await updateDefaultModel({
          modelId: modelOption.value,
          providerId: selectedProvider.id,
        });
      } catch (error) {
        console.error("Failed to set default model:", error);
      }
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-400">Loading models...</p>;
  }

  const options = models.map((model) => ({
    label: model.name,
    value: model.id,
  }));

  const selectedOption = selectedModel
    ? { label: selectedModel.name, value: selectedModel.id }
    : null;

  return (
    <Select
      instanceId="model-dropdown"
      options={options}
      value={selectedOption}
      isSearchable
      placeholder="Choose a model..."
      className="text-black w-[16rem] font-semibold font-roboto"
      styles={customStyles}
      onChange={handleOptionClick}
      components={{
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default ModelDropdown;
