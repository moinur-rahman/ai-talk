import { type FC } from 'react';
import { FiCpu } from 'react-icons/fi';
import Select, { type GroupBase, type StylesConfig } from 'react-select';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setReasoningLevel } from '@/redux/slices/modelSlice';
import { getReasoningConfig } from '@/utils/reasoningConfig';

interface ReasoningOption {
  label: string;
  value: string | null;
}

const reasoningStyles: StylesConfig<
  ReasoningOption,
  false,
  GroupBase<ReasoningOption>
> = {
  control: (styles) => ({
    ...styles,
    backgroundColor: 'transparent',
    borderColor: 'var(--color-border)',
    borderRadius: '8px',
    boxShadow: 'none',
    minHeight: '30px',
    fontSize: '12px',
    cursor: 'pointer',
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
    fontSize: '12px',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    '&:hover': { backgroundColor: 'var(--color-surface-overlay)' },
  }),
  singleValue: (styles) => ({
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

const ReasoningControl: FC = () => {
  const dispatch = useAppDispatch();
  const selectedModel = useAppSelector((state) => state.model.selectedModel);
  const reasoningLevel = useAppSelector((state) => state.model.reasoningLevel);

  if (!selectedModel) {
    return null;
  }

  const config = getReasoningConfig(selectedModel.provider.name);
  if (!config) {
    return null;
  }

  const options: ReasoningOption[] = [
    { label: 'Off', value: null },
    ...config.options.map((o) => ({
      label: o.charAt(0).toUpperCase() + o.slice(1),
      value: o,
    })),
  ];

  const selectedOption =
    options.find((o) => o.value === reasoningLevel) ?? options[0];

  const handleChange = (option: ReasoningOption | null) => {
    dispatch(setReasoningLevel(option?.value ?? null));
  };

  return (
    <div className="flex items-center shrink-0">
      <FiCpu
        size={14}
        className={`${reasoningLevel ? 'text-amber-400' : 'text-muted'} transition-colors shrink-0 mr-1.5`}
      />
      <Select
        instanceId="reasoning-dropdown"
        options={options}
        value={selectedOption}
        onChange={handleChange}
        isSearchable={false}
        menuPlacement="auto"
        styles={reasoningStyles}
        className="w-20"
        components={{ IndicatorSeparator: () => null }}
      />
    </div>
  );
};

export default ReasoningControl;
