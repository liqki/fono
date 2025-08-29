type SelectProps = {
  label: string;
  options: string[];
  value: string;
  setValue: (value: string) => void;
};

function Select({ label, options, value, setValue }: SelectProps) {
  return (
    <div className="w-full bg-gray-800 py-2 px-4 box-border rounded-full text-white">
      <select
        id={label}
        className="w-full h-full p-0 m-0 outline-none"
        value={value}
        onChange={e => setValue(e.target.value.toLowerCase())}
      >
        {options.map(option => (
          <option key={option} value={option.toLowerCase()} className="bg-gray-800 text-white hover:bg-gray-700">
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;
