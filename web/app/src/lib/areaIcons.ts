import type {LucideIcon} from 'lucide-react';
import {
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  Code,
  Coffee,
  Dumbbell,
  Flag,
  Folder,
  Gamepad2,
  Heart,
  Home,
  Lightbulb,
  Music,
  Palette,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import areaIconIdList from '@bluetasks/server-data/area-icon-ids.json';

const RAW_AREA_ICON_IDS = areaIconIdList as readonly string[];

export const DEFAULT_AREA_ICON = 'folder' as const;

const ICON_MAP = {
  folder: Folder,
  briefcase: Briefcase,
  home: Home,
  heart: Heart,
  code: Code,
  coffee: Coffee,
  star: Star,
  flag: Flag,
  target: Target,
  zap: Zap,
  book: BookOpen,
  music: Music,
  camera: Camera,
  gamepad: Gamepad2,
  shopping: ShoppingBag,
  users: Users,
  building: Building2,
  plane: Plane,
  car: Car,
  dumbbell: Dumbbell,
  lightbulb: Lightbulb,
  palette: Palette,
  sparkles: Sparkles,
} as const satisfies Record<string, LucideIcon>;

export type AreaIconId = keyof typeof ICON_MAP;

function assertIconMapMatchesServerData(): void {
  for (const id of RAW_AREA_ICON_IDS) {
    if (!(id in ICON_MAP)) {
      throw new Error(`server/data/area-icon-ids.json contains "${id}" but ICON_MAP has no Lucide entry`);
    }
  }
  for (const key of Object.keys(ICON_MAP)) {
    if (!RAW_AREA_ICON_IDS.includes(key)) {
      throw new Error(`ICON_MAP has "${key}" missing from server/data/area-icon-ids.json`);
    }
  }
}

assertIconMapMatchesServerData();

export const AREA_ICON_IDS = RAW_AREA_ICON_IDS as readonly AreaIconId[];

export function isAreaIconId(value: string): value is AreaIconId {
  return value in ICON_MAP;
}

export function coerceAreaIcon(value: unknown): AreaIconId {
  if (typeof value === 'string' && isAreaIconId(value)) {
    return value;
  }
  return DEFAULT_AREA_ICON;
}

export function getAreaIconComponent(id: string | null | undefined): LucideIcon {
  if (id && isAreaIconId(id)) {
    return ICON_MAP[id];
  }
  return ICON_MAP.folder;
}
