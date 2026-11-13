import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  MapPin,
  Phone,
  Search,
  Wrench,
} from 'lucide-react';
import {
  getLocalizedName,
  getSecondaryName,
  tr,
  translateStatus,
  translateWardShort,
} from '../i18n/translations';
import { ASSET_CATEGORIES, formatDate } from '../utils/assetHelpers';
import { CategoryIcon } from './CategoryIcon';
import { StoredPhoto } from './StoredPhoto';

function ComplaintStatusBadge({ status, lang }) {
  const s = String(status || 'Open');
  const label = translateStatus(s, lang);
  if (s === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" />
        {label}
      </span>
    );
  }
  if (s === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Wrench className="w-3 h-3" />
        {label}
      </span>
    );
  }
  if (s === 'New') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-300">
        <Info className="w-3 h-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <AlertTriangle className="w-3 h-3" />
      {label}
    </span>
  );
}

export function ComplaintsPage({
  lang = 'en',
  complaints,
  wards,
  isAdmin,
  onUpdateComplaintStatus,
  onOpenComplaintOnMap,
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesById, setNotesById] = useState({});

  const counts = useMemo(() => {
    const res = {
      all: complaints.length,
      New: 0,
      Open: 0,
      'In Progress': 0,
      Resolved: 0,
    };
    for (const c of complaints) {
      if (res[c.status] !== undefined) res[c.status] += 1;
    }
    return res;
  }, [complaints]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...complaints]
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
      .filter((c) => {
        if (statusFilter !== 'all' && c.status !== statusFilter) return false;
        if (wardFilter !== 'all' && c.ward !== wardFilter) return false;
        if (q) {
          const text = [
            c.id,
            c.assetId,
            c.assetName?.en,
            c.assetName?.kn,
            c.ward,
            c.description,
            c.reportedBy,
            c.phone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      });
  }, [complaints, statusFilter, wardFilter, searchQuery]);

  const handleStatusAction = (complaint, nextStatus) => {
    const customNote = (notesById[complaint.id] || '').trim();
    onUpdateComplaintStatus(complaint.id, nextStatus, customNote);
    setNotesById((prev) => ({ ...prev, [complaint.id]: '' }));
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-5 lg:p-6">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Heading */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {tr(lang, 'complaintsTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin ? tr(lang, 'complaintsAdminSub') : tr(lang, 'complaintsViewerSub')}
            </p>
          </div>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              key: 'all',
              label: tr(lang, 'totalComplaints'),
              count: counts.all,
              color: 'text-slate-900',
            },
            {
              key: 'New',
              label: tr(lang, 'complaintNew'),
              count: counts.New,
              color: 'text-sky-700',
            },
            {
              key: 'Open',
              label: tr(lang, 'complaintOpen'),
              count: counts.Open,
              color: 'text-rose-600',
            },
            {
              key: 'In Progress',
              label: tr(lang, 'complaintInProgress'),
              count: counts['In Progress'],
              color: 'text-amber-600',
            },
            {
              key: 'Resolved',
              label: tr(lang, 'complaintResolved'),
              count: counts.Resolved,
              color: 'text-emerald-700',
            },
          ].map((card) => (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              className={`text-left bg-white rounded-2xl border p-4 shadow-sm transition ${
                statusFilter === card.key
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">{card.label}</p>
              <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${card.color}`}>
                {card.count}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(lang, 'searchComplaintsPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            aria-label={tr(lang, 'wardLabel')}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allWards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.ward}>
                {getLocalizedName(w, lang)}
              </option>
            ))}
          </select>
        </div>

        {/* Complaints List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              {tr(lang, 'noMatchingComplaints')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {tr(lang, 'noMatchingComplaintsSub')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => {
              const catMeta = ASSET_CATEGORIES[c.assetCategory] || ASSET_CATEGORIES.waterTanks;
              const assetObj = { name: c.assetName };
              const primaryName =
                getLocalizedName(assetObj, lang) || c.assetId || c.problemLabel || c.id;
              const secondaryName = getSecondaryName(assetObj, lang);
              const canOpenMap = Boolean(
                c.assetId || (Array.isArray(c.coordinates) && c.coordinates.length === 2)
              );

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${catMeta.bgClass}`}
                      >
                        <CategoryIcon category={c.assetCategory} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {c.id}
                          </span>
                          <ComplaintStatusBadge status={c.status} lang={lang} />
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {translateWardShort(c.ward, lang)}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {tr(lang, 'reportedPrefix')} {formatDate(c.date)} •{' '}
                            {tr(lang, 'byPrefix')} {c.reportedBy || '—'}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                          {primaryName}
                          {c.assetId && (
                            <span className="text-xs font-mono font-normal text-slate-500 ml-1.5">
                              ({c.assetId})
                            </span>
                          )}
                        </h3>
                        {secondaryName && (
                          <p className="text-xs text-slate-500">{secondaryName}</p>
                        )}
                        {c.phone && (
                          <p className="text-xs text-sky-800 font-semibold mt-1 inline-flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{tr(lang, 'phonePrefix')}</span>
                            <a href={`tel:${c.phone}`} className="hover:underline">
                              {c.phone}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    {canOpenMap && (
                      <button
                        type="button"
                        onClick={() => onOpenComplaintOnMap(c)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition self-start shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{tr(lang, 'openOnMap')}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100 leading-relaxed">
                    {c.description}
                  </p>

                  {c.photoId && (
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-sm">
                        <StoredPhoto
                          photoId={c.photoId}
                          alt={`${c.id} ${primaryName}`}
                          loadingLabel={tr(lang, 'loadingPhoto')}
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {tr(lang, 'attachedPhotoBadge')}
                      </span>
                    </div>
                  )}

                  {c.status === 'Resolved' && c.resolutionNotes && (
                    <div className="text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl px-3.5 py-2">
                      <strong>
                        {tr(lang, 'resolutionPrefix')} ({formatDate(c.resolvedDate)}):
                      </strong>{' '}
                      {c.resolutionNotes}
                    </div>
                  )}

                  {/* Admin Controls */}
                  {isAdmin && c.status !== 'Resolved' && (
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={notesById[c.id] || ''}
                        onChange={(e) =>
                          setNotesById((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder={tr(lang, 'optionalActionNotePlaceholder')}
                        className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        {(c.status === 'New' || c.status === 'Open') && (
                          <button
                            type="button"
                            onClick={() => handleStatusAction(c, 'In Progress')}
                            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition"
                          >
                            {tr(lang, 'markInProgress')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusAction(c, 'Resolved')}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                        >
                          {tr(lang, 'markResolved')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
