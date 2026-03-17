'use client';
import { FC, useEffect, useMemo } from 'react';
import Select, { StylesConfig } from 'react-select';
import {
  setSelectedModel,
  setSelectedProvider,
  setReasoningEnabled,
} from '@/redux/slices/modelSlice';
import { useGetProvidersQuery, useGetModelsQuery } from '@/services/modelApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useChat } from '@/contexts/ChatContext';

interface ModelOption {
  label: string;
  value: string;
}

export const customStyles: StylesConfig<ModelOption> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    borderColor: 'var(--color-border)',
    borderRadius: '8px',
    boxShadow: 'none',
    minHeight: '34px',
    fontSize: '13px',
    '&:hover': {
      borderColor: 'var(--color-accent)',
      backgroundColor: 'rgba(0, 196, 161, 0.04)',
    },
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: 'var(--color-surface-elevated)',
    border: '1px solid var(--color-border)',
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
        ? 'var(--color-surface-overlay)'
        : 'transparent',
    color: isSelected ? 'var(--color-accent)' : 'var(--color-heading)',
    fontSize: '13px',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--color-surface-overlay)' },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: 'var(--color-muted)',
    fontSize: '13px',
  }),
  singleValue: (styles) => ({
    ...styles,
    color: 'var(--color-primary)',
    fontSize: '13px',
  }),
  input: (styles) => ({
    ...styles,
    color: 'var(--color-primary)',
    fontSize: '13px',
  }),
  dropdownIndicator: (styles) => ({
    ...styles,
    color: 'var(--color-muted)',
    padding: '4px 6px',
    '&:hover': { color: 'var(--color-body)' },
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

  const dispatch = useAppDispatch();
  const selectedProvider = useAppSelector(
    (state) => state.model.selectedProvider,
  );
  const selectedModel = useAppSelector((state) => state.model.selectedModel);

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
    return <p className="text-xs text-muted">Loading models...</p>;
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
