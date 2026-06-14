import "./DetailCard.css";

interface DetailCardProps {
  title: string;
  children: React.ReactNode;
}

export default function DetailCard({ title, children }: DetailCardProps) {
  return (
    <div className="detail-card">
      <p className="detail-card-title">{title}</p>
      {children}
    </div>
  );
}
