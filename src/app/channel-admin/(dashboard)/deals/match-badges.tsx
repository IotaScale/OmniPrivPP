import React from 'react';
import { AlertTriangle, Copy, ShieldX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  MATCH_REASON_LABELS,
  matchSeverity,
  type DealMatchKind,
  type DealMatchReason,
} from '@/lib/utils/deal-matching';

const SEVERITY_CONF = {
  blocked: {
    label: 'Blocked by protected deal',
    icon: ShieldX,
    className: 'bg-rose-600 text-[#ffffff] border-rose-600 dark:bg-rose-500/25 dark:text-rose-200 dark:border-rose-500/60',
  },
  conflict: {
    label: 'Conflict',
    icon: AlertTriangle,
    className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
  duplicate: {
    label: 'Duplicate',
    icon: Copy,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
} as const;

/** Worst-severity row badge: Blocked > Conflict > Duplicate, with the match count. */
export function MatchSeverityBadge({
  matches,
  size = 'sm',
}: {
  matches: Array<{ kind: DealMatchKind; blocking: boolean }>;
  size?: 'sm' | 'md';
}) {
  const severity = matchSeverity(matches);
  if (!severity) return null;
  const conf = SEVERITY_CONF[severity];
  const Icon = conf.icon;
  return (
    <Badge
      size={size}
      className={conf.className}
      title={`${matches.length} possible ${matches.length === 1 ? 'match' : 'matches'}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{conf.label}</span>
      <span className="tabular-nums opacity-80">· {matches.length}</span>
    </Badge>
  );
}

/** Small badge for one match: duplicate (amber) / conflict (red), strong red when blocking. */
export function MatchKindBadge({ kind, blocking }: { kind: DealMatchKind; blocking: boolean }) {
  if (blocking) {
    return (
      <Badge size="sm" className={SEVERITY_CONF.blocked.className}>
        <ShieldX className="h-3 w-3" aria-hidden="true" />
        Blocking
      </Badge>
    );
  }
  return kind === 'conflict' ? (
    <Badge size="sm" variant="danger">
      Conflict · other partner
    </Badge>
  ) : (
    <Badge size="sm" variant="warning">
      Duplicate · same partner
    </Badge>
  );
}

export function MatchReasonChips({ reasons }: { reasons: DealMatchReason[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {reasons.map((r) => (
        <span
          key={r}
          className="inline-flex items-center rounded-md border border-line bg-surface-hover px-1.5 py-0.5 text-[0.6875rem] font-medium text-ink-soft"
        >
          {MATCH_REASON_LABELS[r]}
        </span>
      ))}
    </span>
  );
}
