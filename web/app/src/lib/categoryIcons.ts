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
import categoryIconIdList from '@bluetasks/server-data/category-icon-ids.json';

const RAW_CATEGORY_ICON_IDS = categoryIconIdList as readonly string[];

export const DEFAULT_CATEGORY_ICON = 'folder' as const;

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

export type CategoryIconId = keyof typeof ICON_MAP;

function assertIconMapMatchesServerData(): void {
  for (const id of RAW_CATEGORY_ICON_IDS) {
    if (!(id in ICON_MAP)) {
      throw new Error(
        `server/data/category-icon-ids.json contains "${id}" but ICON_MAP has no Lucide entry`,
      );
    }
  }
  for (const key of Object.keys(ICON_MAP)) {
    if (!RAW_CATEGORY_ICON_IDS.includes(key)) {
      throw new Error(`ICON_MAP has "${key}" missing from server/data/category-icon-ids.json`);
    }
  }
}

assertIconMapMatchesServerData();

export const CATEGORY_ICON_IDS = RAW_CATEGORY_ICON_IDS as readonly CategoryIconId[];

export function isCategoryIconId(value: string): value is CategoryIconId {
  return value in ICON_MAP;
}

export function coerceCategoryIcon(value: unknown): CategoryIconId {
  if (typeof value === 'string' && isCategoryIconId(value)) {
    return value;
  }
  return DEFAULT_CATEGORY_ICON;
}

export function getCategoryIconComponent(id: string | null | undefined): LucideIcon {
  if (id && isCategoryIconId(id)) {
    return ICON_MAP[id];
  }
  return ICON_MAP.folder;
}
