'use client';
import { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';

import { customStyles } from './ModelDropdown';
import {
  setSelectedModel,
  setSelectedProvider,
} from '@/redux/slices/modelSlice';
import { useGetProvidersQuery } from '@/services/modelApi';
import { RootState } from '@/redux/store';

interface ProviderOption {
  label: string;
  value: string;
}

const ProviderDropdown: FC = () => {
  const dispatch = useDispatch();

  const selectedProvider = useSelector(
    (state: RootState) => state.model.selectedProvider,
  );

  const { data: providers = [], isLoading } = useGetProvidersQuery();

  const handleOptionClick = (newValue: unknown) => {
    const providerExists = providers.find(
      (provider) => provider.id === (newValue as ProviderOption).value,
    );
    if (!providerExists) {
      return;
    }
    dispatch(
      setSelectedProvider({
        id: (newValue as ProviderOption).value,
        name: (newValue as ProviderOption).label,
      }),
    );

    dispatch(setSelectedModel(null));
  };

  if (isLoading) {
    return <p className="text-xs text-muted">Loading providers...</p>;
  }

  const options = providers.map((provider) => ({
    label: provider.name,
    value: provider.id,
  }));

  const selectedOption = selectedProvider
    ? {
        label: selectedProvider.name,
        value: selectedProvider.id,
      }
    : null;

  return (
    <Select
      instanceId="provider-dropdown"
      options={options}
      value={selectedOption}
      isSearchable
      menuPlacement="auto"
      placeholder="Choose a provider..."
      className="w-full"
      styles={customStyles}
      onChange={handleOptionClick}
      components={{
        IndicatorSeparator: () => null,
      }}
    />
  );
};

export default ProviderDropdown;
