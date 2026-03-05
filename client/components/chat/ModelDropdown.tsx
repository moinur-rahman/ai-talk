'use client';
import { FC, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Select, { StylesConfig } from 'react-select';
import {
  setSelectedModel,
  setSelectedProvider,
  setReasoningEnabled,
} from '@/redux/slices/modelSlice';
import { useGetProvidersQuery, useGetModelsQuery } from '@/services/modelApi';
import { RootState } from '@/redux/store';
import { useChat } from '@/contexts/ChatContext';

interface ModelOption {
  label: string;
  value: string;
}

export const customStyles: StylesConfig<ModelOption> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: 'transparent',
    color: '#e2ecf5',
    borderColor: '#2e3d52',
    borderRadius: '8px',
    boxShadow: 'none',
    minHeight: '34px',
    fontSize: '13px',
    '&:hover': {
      borderColor: '#00C4A1',
      backgroundColor: 'rgba(0, 196, 161, 0.04)',
    },
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: '#222b3d',
    border: '1px solid #2e3d52',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
  }),
  menuList: (styles) => ({
    ...styles,
    padding: '4px',
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected
      ? 'rgba(0, 196, 161, 0.1)'
      : isFocused
        ? '#273040'
        : 'transparent',
    color: isSelected ? '#00C4A1' : '#d5e6f0',
    fontSize: '13px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    '&:hover': { backgroundColor: '#273040' },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: '#4e677e',
    fontSize: '13px',
  }),
  singleValue: (styles) => ({
    ...styles,
    color: '#e2ecf5',
    fontSize: '13px',
  }),
  input: (styles) => ({
    ...styles,
    color: '#e2ecf5',
    fontSize: '13px',
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    color: '#4e677e',
    padding: '4px 6px',
    '&:hover': { color: '#92adc4' },
  }),
  valueContainer: (styles) => ({
    ...styles,
    padding: '0 8px',
  }),
};

const DEFAULT_MODEL_KEY = 'defaultModel';

function getStoredDefault(): { modelId: string; providerId: string } | null {
  try {
    const raw = localStorage.getItem(DEFAULT_MODEL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const ModelDropdown: FC = () => {
  const { conversationId } = useChat();

  const dispatch = useDispatch();
  const selectedProvider = useSelector(
    (state: RootState) => state.model.selectedProvider,
  );
  const selectedModel = useSelector(
    (state: RootState) => state.model.selectedModel,
  );

  const defaultModel = useMemo(() => getStoredDefault(), []);
  const { data: providers } = useGetProvidersQuery();

  const { data: models = [], isLoading } = useGetModelsQuery(
    selectedProvider?.id ?? '',
    {
      skip: !selectedProvider,
    },
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

  const handleOptionClick = (newValue: unknown) => {
    const modelOption = newValue as ModelOption;
    const selectedModelData = models.find((m) => m.id === modelOption.value);

    dispatch(
      setSelectedModel({
        id: modelOption.value,
        name: modelOption.label,
        hasReasoning: selectedModelData?.hasReasoning || false,
      }),
    );

    if (!selectedModelData?.hasReasoning) {
      dispatch(setReasoningEnabled(false));
    }

    if (!conversationId && selectedProvider) {
      localStorage.setItem(
        DEFAULT_MODEL_KEY,
        JSON.stringify({
          modelId: modelOption.value,
          providerId: selectedProvider.id,
        }),
      );
    }
  };

  if (isLoading) {
    return <p className="text-xs text-[#4e677e]">Loading models...</p>;
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
      className="w-[13rem]"
      styles={customStyles}
      onChange={handleOptionClick}
      components={{
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default ModelDropdown;
