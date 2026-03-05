import { FC } from 'react';
import ModelDropdown from './ModelDropdown';
import ProviderDropdown from './ProviderDropdown';
import ReasoningToggle from './ReasoningToggle';

const Header: FC = () => {
  return (
    <div className="px-5 py-4 flex items-center gap-2 sticky top-0 bg-[#1b2030] border-b border-[#2e3d52] z-[100]">
      <ProviderDropdown />
      <div className="w-px h-4 bg-[#2e3d52] flex-shrink-0" />
      <ModelDropdown />
      <div className="ml-auto flex-shrink-0">
        <ReasoningToggle />
      </div>
    </div>
  );
};

export default Header;
