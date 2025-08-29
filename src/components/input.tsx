type InputProps = {
  label: string;
  value: string | number;
  setValue: (value: string | number) => void;
  type: "text" | "number";
};

function Input({ label, value, setValue, type }: InputProps) {
  return (
    <input
      type={type}
      id={label}
      className="w-full bg-gray-800 py-2 px-4 box-border rounded-full text-white outline-none focus:ring-1 ring-gray-400"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}

export default Input;
