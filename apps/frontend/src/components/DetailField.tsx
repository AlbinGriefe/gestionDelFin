import "./DetailField.css";

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
}

export default function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div className="detail-field">
      <span className="detail-field-label">{label}</span>
      <span className="detail-field-value">{value}</span>
    </div>
  );
}
