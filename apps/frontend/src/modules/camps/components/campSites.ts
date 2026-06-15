export interface CampSite {
  id: string;
  name: string;
  x: number;
  y: number;
}

export const CAMP_SITES: CampSite[] = [
  { id: "norte", name: "Pueblo del Norte", x: 0.39, y: 0.19 },
  { id: "rojo-oeste", name: "Puesto Rojo Oeste", x: 0.13, y: 0.4 },
  { id: "naves", name: "Naves Centrales", x: 0.41, y: 0.64 },
  { id: "claro-sur", name: "Claro del Sur", x: 0.31, y: 0.93 },
  { id: "mirador-ne", name: "Mirador Noreste", x: 0.89, y: 0.24 },
  { id: "complejo-este", name: "Complejo Este", x: 0.79, y: 0.46 },
  { id: "granja-este", name: "Granja Este", x: 0.77, y: 0.62 },
  { id: "sureste", name: "Estacion Sureste", x: 0.92, y: 0.94 },
];

export const SNAP_RADIUS = 0.045;

export interface MapPos {
  x: number;
  y: number;
}

export function isValidPos(x: number | null, y: number | null): boolean {
  return x !== null && y !== null && x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

export function snapToSite(pos: MapPos): {
  pos: MapPos;
  site: CampSite | null;
} {
  let best: CampSite | null = null;
  let bestDistance = SNAP_RADIUS;
  for (const site of CAMP_SITES) {
    const distance = Math.hypot(site.x - pos.x, site.y - pos.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = site;
    }
  }
  if (best) return { pos: { x: best.x, y: best.y }, site: best };
  return {
    pos: {
      x: Math.round(pos.x * 1000) / 1000,
      y: Math.round(pos.y * 1000) / 1000,
    },
    site: null,
  };
}
