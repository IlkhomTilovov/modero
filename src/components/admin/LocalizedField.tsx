import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { CatalogLanguage } from '@/hooks/useLanguages';

interface BaseProps {
  label: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  languages: CatalogLanguage[];
  required?: boolean;
  placeholder?: string;
  className?: string;
}

function useActiveTab(languages: CatalogLanguage[]) {
  const [active, setActive] = useState(languages[0]?.code);
  const current = languages.some((l) => l.code === active) ? active : languages[0]?.code;
  return [current, setActive] as const;
}

/** One text input per active catalog language, switchable via small tabs. */
export function LocalizedField({ label, value, onChange, languages, required, placeholder, className }: BaseProps) {
  const [active, setActive] = useActiveTab(languages);
  if (languages.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="h-8">
          {languages.map((l) => (
            <TabsTrigger key={l.code} value={l.code} className="text-xs px-2.5 py-1">
              {l.code.toUpperCase()}
              {required && !value[l.code]?.trim() && <span className="ml-1 text-destructive">•</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {languages.map((l) => (
          <TabsContent key={l.code} value={l.code} className="mt-2">
            <Input
              value={value[l.code] ?? ''}
              onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
              placeholder={placeholder ?? l.name}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** Same as LocalizedField but with a multi-line textarea per language. */
export function LocalizedTextarea({
  label,
  value,
  onChange,
  languages,
  required,
  placeholder,
  className,
  rows = 4,
}: BaseProps & { rows?: number }) {
  const [active, setActive] = useActiveTab(languages);
  if (languages.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList className="h-8">
          {languages.map((l) => (
            <TabsTrigger key={l.code} value={l.code} className="text-xs px-2.5 py-1">
              {l.code.toUpperCase()}
              {required && !value[l.code]?.trim() && <span className="ml-1 text-destructive">•</span>}
            </TabsTrigger>
          ))}
        </TabsList>
        {languages.map((l) => (
          <TabsContent key={l.code} value={l.code} className="mt-2">
            <Textarea
              value={value[l.code] ?? ''}
              onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
              placeholder={placeholder ?? l.name}
              rows={rows}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
