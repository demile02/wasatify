'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  Home,
  ImageIcon,
  Mail,
  Megaphone,
  MessageSquareText,
  Settings,
  Smartphone,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SectionCard } from '@/components/shared/section-card';
import { Button } from '@/components/ui/button';
import {
  getDefaultQuickAccessKeys,
  getQuickAccessItems,
  getQuickAccessKeys,
  mergeQuickAccessPreferences,
  quickAccessLimits,
  type QuickAccessRole,
} from '@/lib/quick-access';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

type QuickAccessSettingsProps = {
  profile: Profile;
};

const iconMap = {
  Home,
  BookOpen,
  ClipboardCheck,
  MessageSquareText,
  BarChart3,
  Megaphone,
  Mail,
  Award,
  Settings,
  Users,
  ImageIcon,
};

export function QuickAccessSettings({ profile }: QuickAccessSettingsProps) {
  const router = useRouter();
  const role: QuickAccessRole = profile.role === 'student' ? 'student' : 'teacher';
  const availableItems = getQuickAccessItems(role);
  const initialKeys = useMemo(() => getQuickAccessKeys(profile.quick_access, role), [profile.quick_access, role]);
  const [selectedKeys, setSelectedKeys] = useState(initialKeys);
  const [savedKeys, setSavedKeys] = useState(initialKeys);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCount = selectedKeys.length;
  const isTooFew = selectedCount < quickAccessLimits.min;
  const isTooMany = selectedCount > quickAccessLimits.max;
  const hasChanges = selectedKeys.join('|') !== savedKeys.join('|');
  const canSave = hasChanges && !isTooFew && !isTooMany && !isSaving;
  const selectedItemMap = new Map(availableItems.map((item) => [item.key, item]));
  const selectedItems = selectedKeys
    .map((key) => selectedItemMap.get(key))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  useEffect(() => {
    setSelectedKeys(initialKeys);
    setSavedKeys(initialKeys);
  }, [initialKeys]);

  function toggleKey(key: string) {
    setSelectedKeys((currentKeys) => {
      if (currentKeys.includes(key)) return currentKeys.filter((currentKey) => currentKey !== key);

      if (currentKeys.length >= quickAccessLimits.max) {
        toast.warning(`Maksimal ${quickAccessLimits.max} menu di navigasi bawah.`);
        return currentKeys;
      }

      return [...currentKeys, key];
    });
  }

  function moveKey(key: string, direction: -1 | 1) {
    setSelectedKeys((currentKeys) => {
      const index = currentKeys.indexOf(key);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= currentKeys.length) return currentKeys;

      const nextKeys = [...currentKeys];
      const [movedKey] = nextKeys.splice(index, 1);
      nextKeys.splice(nextIndex, 0, movedKey);
      return nextKeys;
    });
  }

  function resetDefault() {
    setSelectedKeys(getDefaultQuickAccessKeys(role));
  }

  async function saveQuickAccess() {
    if (isTooFew) {
      toast.warning(`Pilih minimal ${quickAccessLimits.min} menu.`);
      return;
    }

    if (isTooMany) {
      toast.warning(`Pilih maksimal ${quickAccessLimits.max} menu.`);
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user || user.id !== profile.id) throw new Error('Sesi akun tidak valid. Silakan masuk kembali.');

      const quickAccess = mergeQuickAccessPreferences(profile.quick_access, role, selectedKeys);
      const { error } = await supabase
        .from('profiles')
        .update({
          quick_access: quickAccess,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSavedKeys(selectedKeys);
      toast.success('Akses cepat mobile berhasil disimpan.');
      router.refresh();
    } catch (error) {
      console.error('Quick access save failed', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan akses cepat mobile.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SectionCard className="xl:col-span-2">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-ink">Atur Navigasi Bawah</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Pilih menu yang muncul di bottom navbar mobile. Desktop sidebar tidak berubah.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-primary/10 bg-mint/45 px-4 py-2 text-sm font-bold text-primary">
          {selectedCount} dari {quickAccessLimits.max} dipilih
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableItems.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;
              const checked = selectedKeys.includes(item.key);

              return (
                <label
                  key={item.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition',
                    checked
                      ? 'border-primary/25 bg-mint/60 text-primary'
                      : 'border-border bg-white text-foreground hover:border-primary/20 hover:bg-mint/30',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleKey(item.key)}
                    className="h-4 w-4 accent-primary"
                  />
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 truncate text-sm font-bold">{item.label}</span>
                </label>
              );
            })}
          </div>

          {(isTooFew || isTooMany) && (
            <p className="mt-4 rounded-xl border border-gold/20 bg-cream px-4 py-3 text-sm font-semibold text-ink">
              {isTooFew
                ? `Pilih minimal ${quickAccessLimits.min} menu untuk navigasi bawah.`
                : `Pilih maksimal ${quickAccessLimits.max} menu untuk navigasi bawah.`}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">Preview urutan</p>
            <Button type="button" variant="ghost" size="sm" onClick={resetDefault} disabled={isSaving}>
              Default
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            {selectedItems.map((item, index) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] ?? Home;

              return (
                <div key={item.key} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{item.shortLabel}</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0 || isSaving}
                      onClick={() => moveKey(item.key, -1)}
                      aria-label={`Naikkan ${item.label}`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === selectedItems.length - 1 || isSaving}
                      onClick={() => moveKey(item.key, 1)}
                      aria-label={`Turunkan ${item.label}`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={saveQuickAccess} disabled={!canSave}>
          {isSaving ? 'Menyimpan...' : 'Simpan Akses Cepat'}
        </Button>
        <Button type="button" variant="outline" onClick={resetDefault} disabled={isSaving}>
          Gunakan Default
        </Button>
      </div>
    </SectionCard>
  );
}
