import { useEffect, useRef, useState } from "react";
import {
  Award,
  Compass,
  HeartPulse,
  Loader2,
  Lock,
  Map as MapIcon,
  PackageCheck,
  Share2,
  Trophy,
  Truck,
  UserPlus,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { httpClient } from "../shared/api/httpClient";
import type { AchievementsResponse } from "../modules/achievements/types/achievements.types";
import styles from "./AchievementsPage.module.css";

const ICONS: Record<string, LucideIcon> = {
  "user-plus": UserPlus,
  users: Users,
  "package-check": PackageCheck,
  compass: Compass,
  map: MapIcon,
  truck: Truck,
  "share-2": Share2,
  "heart-pulse": HeartPulse,
  award: Award,
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AchievementsPage() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const notified = useRef(false);

  useEffect(() => {
    let active = true;
    httpClient<AchievementsResponse>("/achievements")
      .then((response) => {
        if (!active) return;
        setData(response);
        if (!notified.current && response.justUnlocked.length > 0) {
          notified.current = true;
          for (const name of response.justUnlocked) {
            toast.success(`Logro desbloqueado: ${name}`);
          }
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.spin} size={18} /> Cargando logros...
      </div>
    );
  }

  if (!data)
    return <p className={styles.empty}>No se pudieron cargar los logros.</p>;

  const { summary, items } = data;

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.levelBadge}>
          <Trophy size={26} />
          <span>Nivel</span>
          <strong>{summary.level}</strong>
        </div>
        <div className={styles.heroInfo}>
          <span className={styles.kicker}>Progreso del campamento</span>
          <h2>
            {summary.unlockedCount} de {summary.total} logros ·{" "}
            {summary.totalPoints} pts
          </h2>
          <div className={styles.levelBar}>
            <span style={{ width: `${summary.levelProgressPct}%` }} />
          </div>
          <small>
            {summary.pointsToNextLevel} pts para el nivel {summary.level + 1}
          </small>
        </div>
      </header>

      <div className={styles.grid}>
        {items.map((item) => {
          const Icon = ICONS[item.icon] ?? Award;
          const pct = Math.round(
            (item.progress.current / item.progress.target) * 100,
          );
          return (
            <article
              key={item.id}
              className={`${styles.card} ${item.unlocked ? styles.unlocked : styles.locked}`}
            >
              <div className={styles.cardIcon}>
                {item.unlocked ? <Icon size={22} /> : <Lock size={18} />}
              </div>
              <div className={styles.cardBody}>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                {item.unlocked ? (
                  <span className={styles.awarded}>
                    Desbloqueado · {formatDate(item.awardedAt)}
                  </span>
                ) : (
                  <div className={styles.progressRow}>
                    <div className={styles.progressBar}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <small>
                      {item.progress.current}/{item.progress.target}
                    </small>
                  </div>
                )}
              </div>
              <span className={styles.points}>+{item.points}</span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
