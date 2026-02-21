import { FC } from "react";
import ModelDropdown from "./ModelDropdown";
import ProviderDropdown from "./ProviderDropdown";
import ReasoningToggle from "./ReasoningToggle";

const Header: FC = () => {
  return (
    <div className="p-4 flex items-center gap-3 sticky top-0 bg-gray-900 z-[100]">
      <ProviderDropdown />
      <ModelDropdown />
      <ReasoningToggle />
    </div>
  );
};

export default Header;
