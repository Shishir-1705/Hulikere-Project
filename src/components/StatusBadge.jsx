import React from 'react';
import { translateStatus } from '../i18n/translations';
import { getStatusMeta } from '../utils/assetHelpers';

export function StatusBadge({ value, size = 'sm', lang = 'en' }) {
  const meta = getStatusMeta(value);
  const label = translateStatus(value, lang);
  const sizeClass =
    size === 'md'
      ? 'px-2.5 py-1 text-xs font-semibold'
      : 'px-2 py-0.5 text-[11px] font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full whitespace-nowrap ${meta.pillClass} ${sizeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      {label}
    </span>
  );
}
