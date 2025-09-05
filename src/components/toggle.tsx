import { FaCircleInfo } from "react-icons/fa6";

type ToggleProps = {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <label htmlFor={label}>
          {label}
        </label>
        <div className="relative group">
          <FaCircleInfo className="text-gray-400 hover:text-white" />
          <div className="w-[500px] hidden group-hover:block absolute -bottom-2 left-5 bg-gray-900 p-2 rounded-md text-sm text-white">{description}</div>
        </div>
      </div>

      <label className="flex cursor-pointer select-none items-center">
        <div className="relative">
          <input
            type="checkbox"
            checked={value}
            onChange={e => onChange(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`box block h-6 w-10 rounded-full ${
              value ? "bg-blue-500" : "bg-gray-400"
            }`}
          >
          </div>
          <div
            className={`absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white transition ${
              value ? "translate-x-full" : ""
            }`}
          >
          </div>
        </div>
      </label>

    </div>
  );
}

export default Toggle;
