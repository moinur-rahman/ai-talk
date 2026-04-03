'use client';
import { FC, useEffect, useMemo } from 'react';
import Select, { GroupBase, StylesConfig } from 'react-select';
import {
  setSelectedModel,
  setReasoningEnabled,
} from '@/redux/slices/modelSlice';
import { useGetAllModelsQuery } from '@/services/modelApi';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { useChat } from '@/contexts/ChatContext';

interface ModelOption {
  label: string;
  value: string;
}

export const customStyles: StylesConfig<
  ModelOption,
  false,
  GroupBase<ModelOption>
> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    borderColor: 'var(--color-border)',
    borderRadius: '8px',
    boxShadow: 'none',
    minHeight: '30px',
    fontSize: '12px',
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
  group: (styles) => ({
    ...styles,
    padding: 0,
  }),
  groupHeading: (styles) => ({
    ...styles,
    color: 'var(--color-muted)',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '6px 10px 2px',
  }),
  option: (styles, { isFocused, isSelected }) => ({
    ...styles,
    backgroundColor: isSelected
      ? 'rgba(0, 196, 161, 0.1)'
      : isFocused
        ? 'var(--color-surface-overlay)'
        : 'transparent',
    color: isSelected ? 'var(--color-accent)' : 'var(--color-heading)',
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--color-surface-overlay)' },
  }),
  placeholder: (styles) => ({
    ...styles,
    color: 'var(--color-muted)',
    fontSize: '12px',
  }),
  singleValue: (styles) => ({
    ...styles,
    color: 'var(--color-primary)',
    fontSize: '12px',
  }),
  input: (styles) => ({
    ...styles,
    color: 'var(--color-primary)',
    fontSize: '12px',
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

function getStoredDefaultModelId(): string | null {
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
  const selectedModel = useAppSelector((state) => state.model.selectedModel);

  const defaultModelId = useMemo(() => getStoredDefaultModelId(), []);
  const { data: models = [], isLoading } = useGetAllModelsQuery();

  useEffect(() => {
    if (!conversationId) {
      dispatch(setSelectedModel(null));
    }
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (
      !conversationId &&
      defaultModelId &&
      models.length > 0 &&
      !selectedModel
    ) {
      const model = models.find((m) => m.id === defaultModelId);
      if (model) {
        dispatch(setSelectedModel(model));
      }
    }
  }, [defaultModelId, models, selectedModel, dispatch, conversationId]);

  const groupedOptions = useMemo(() => {
    const byProvider = new Map<
      string,
      { label: string; options: ModelOption[] }
    >();
    for (const model of models) {
      const providerName = model.provider.name;
      if (!byProvider.has(providerName)) {
        byProvider.set(providerName, { label: providerName, options: [] });
      }
      byProvider.get(providerName)!.options.push({
        label: model.name,
        value: model.id,
      });
    }
    return Array.from(byProvider.values());
  }, [models]);

  const handleOptionClick = (newValue: unknown) => {
    const modelOption = newValue as ModelOption;
    const selectedModelData = models.find((m) => m.id === modelOption.value);
    if (!selectedModelData) return;

    dispatch(setSelectedModel(selectedModelData));

    if (!selectedModelData.hasReasoning) {
      dispatch(setReasoningEnabled(false));
    }

    if (!conversationId) {
      localStorage.setItem(
        DEFAULT_MODEL_KEY,
        JSON.stringify(modelOption.value),
      );
    }
  };

  if (isLoading) {
    return <p className="text-xs text-muted">Loading models...</p>;
  }

  const selectedOption = selectedModel
    ? { label: selectedModel.name, value: selectedModel.id }
    : null;

  return (
    <Select
      instanceId="model-dropdown"
      options={groupedOptions}
      value={selectedOption}
      isSearchable
      menuPlacement="auto"
      placeholder="Choose a model..."
      className="w-full"
      styles={customStyles}
      onChange={handleOptionClick}
      components={{
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default ModelDropdown;
