import { useState } from "react";
import styles from "./CatalogSelect.module.css";

export interface CatalogItem {
  id: number;
  label: string;
  sublabel?: string;
  meta?: React.ReactNode;
}

interface CatalogSelectProps {
  placeholder?: string;
  sectionTitle?: string;
  items: CatalogItem[];
  selectedId?: number | null;
  onChange: (item: CatalogItem) => void;
}

export default function CatalogSelect({
  placeholder = "Seleccionar...",
  sectionTitle,
  items,
  selectedId = null,
  onChange,
}: CatalogSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const handleSelect = (item: CatalogItem) => {
    onChange(item);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={[
          styles.trigger,
          isOpen ? styles.triggerOpen : "",
          selected ? styles.triggerSelected : "",
        ].join(" ")}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={selected ? "" : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.panel}>
          {sectionTitle && (
            <div className={styles.sectionTitle}>{sectionTitle}</div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className={`${styles.item} ${item.id === selectedId ? styles.itemActive : ""}`}
              onClick={() => handleSelect(item)}
            >
              <div>
                <div className={styles.itemMain}>{item.label}</div>
                {item.sublabel && (
                  <div className={styles.itemSub}>{item.sublabel}</div>
                )}
              </div>
              {item.meta && <div className={styles.itemMeta}>{item.meta}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
