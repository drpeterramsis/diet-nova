interface BtnProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

const Button = ({ text, size = "md" }: BtnProps) => {
  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-5 py-2 text-base",
    lg: "px-7 py-3 text-lg",
  };

  return (
    <button
      className={`bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-lg shadow-md transition ${sizes[size]}`}
    >
      {text}
    </button>
  );
};

export default Button;
