import { icons } from "../util/icons";

type IconProps = {
  name: keyof typeof icons;
  variant: "filled" | "outline" | "none";
} & React.ComponentProps<"svg">;

function Icon({ name, variant, ...props }: IconProps) {
  if (variant === "none")
    return null;

  const IconComponent = icons[name]?.[variant];

  if (!IconComponent)
    return null;

  return <IconComponent {...props} />;
}

export default Icon;
