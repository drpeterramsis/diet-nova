interface CardProps {
  title: string;
  desc: string;
  onClick?: () => void;
}

const ToolCard = ({ title, desc, onClick }: CardProps) => {
  return (
    <div className="card text-center hover:shadow-lg transition cursor-pointer"  onClick={onClick} >
      <h3 className="text-xl font-semibold text-[var(--color-heading)] mb-2">
        {title}
      </h3>
      <p className="text-[var(--color-text-light)] mb-3">{desc}</p>
      <button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-4 py-2 rounded-lg transition">
        Open
      </button>
    </div>
  );
};

export default ToolCard;
