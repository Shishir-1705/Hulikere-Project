import React, { useEffect, useMemo, useState } from 'react';
import { AddAssetModal } from './components/AddAssetModal';
import { AssetDetailDrawer } from './components/AssetDetailDrawer';
import { AssetSidebar } from './components/AssetSidebar';
import { ComplaintsPage } from './components/ComplaintsPage';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { PrintRegisterPage } from './components/PrintRegisterPage';
import { PublicReportPage } from './components/PublicReportPage';
import { ReportProblemModal } from './components/ReportProblemModal';
import { VillageMap } from './components/VillageMap';
import { WardOverview } from './components/WardOverview';
import { loadSavedLanguage, saveLanguage } from './i18n/translations';
import {
  createDefaultForm,
  createMaintenanceEntry,
  flattenAssets,
  formToAsset,
  generateNextId,
  getStatusMeta,
  getStatusValue,
} from './utils/assetHelpers';
import {
  clearAllPhotos,
  deletePhoto,
  generatePhotoId,
  savePhotoBlob,
} from './utils/photoStorage';
import {
  clearAuthSession,
  exportAssetsJson,
  loadAssets,
  loadAuthSession,
  resetAssets,
  saveAssets,
  saveAuthSession,
} from './utils/storage';

const DEFAULT_VISIBLE_LAYERS = {
  waterTanks: true,
  roads: true,
  publicBuildings: true,
  streetLights: true,
  wards: true,
};

export default function App() {
  const getNormalizedPath = () => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname.replace(/\/+$/, '') || '/';
  };

  const [routePath, setRoutePath] = useState(() => getNormalizedPath());
  const [lang, setLang] = useState(() => loadSavedLanguage());
  const [session, setSession] = useState(() => loadAuthSession());
  const [data, setData] = useState(() => loadAssets());
  const [activeView, setActiveView] = useState('home'); // 'home' | 'map' | 'dashboard' | 'complaints' | 'wards' | 'register'
  const [listDrawerOpen, setListDrawerOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [visibleLayers, setVisibleLayers] = useState(DEFAULT_VISIBLE_LAYERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedRef, setSelectedRef] = useState(null); // { category, id }
  const [focusRequest, setFocusRequest] = useState(null);
  const [toast, setToast] = useState(null);

  // Add Asset modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCategory, setAddCategory] = useState('waterTanks');
  const [addForm, setAddForm] = useState(() =>
    createDefaultForm('waterTanks', data.wards)
  );
  const [addPhotoDraft, setAddPhotoDraft] = useState(null);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);

  // Report Problem modal state
  const [reportTarget, setReportTarget] = useState(null);

  const isAdmin = session?.role === 'admin';

  useEffect(() => {
    document.documentElement.lang = lang;
    saveLanguage(lang);
  }, [lang]);

  useEffect(() => {
    const handlePopState = () => setRoutePath(getNormalizedPath());
    const handleStorageSync = () => setData(loadAssets());
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const navigateToPath = (path) => {
    const normalized = path.replace(/\/+$/, '') || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setRoutePath(normalized);
  };

  const showToast = (message) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const commitData = (nextData, toastMessage) => {
    setData(nextData);
    saveAssets(nextData);
    if (toastMessage) showToast(toastMessage);
  };

  const handleLoginSuccess = (nextSession) => {
    setSession(nextSession);
    saveAuthSession(nextSession);
    setActiveView('home');
    showToast(`${nextSession.roleLabel}`);
  };

  const handleLogout = () => {
    clearAuthSession();
    setSession(null);
    setAddModalOpen(false);
    setIsPickingOnMap(false);
    setReportTarget(null);
    setSelectedRef(null);
  };

  const allAssets = useMemo(() => flattenAssets(data), [data]);

  const totalCounts = useMemo(
    () => ({
      all: allAssets.length,
      waterTanks: data.waterTanks.length,
      roads: data.roads.length,
      publicBuildings: data.publicBuildings.length,
      streetLights: data.streetLights.length,
    }),
    [allAssets.length, data]
  );

  const complaints = data.complaints || [];
  const openComplaintsCount = useMemo(
    () => complaints.filter((c) => c.status !== 'Resolved').length,
    [complaints]
  );

  // Assets matching search + ward + condition (further filtered by layer toggles for map)
  const searchedAndFilteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allAssets.filter((item) => {
      if (wardFilter !== 'all' && item.ward !== wardFilter) return false;

      if (statusFilter !== 'all') {
        const bucket = getStatusMeta(getStatusValue(item)).bucket;
        if (bucket !== statusFilter) return false;
      }

      if (q) {
        const haystack = [
          item.id,
          item.name?.en,
          item.name?.kn,
          item.ward,
          item.type,
          item.poleNumber,
          item.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allAssets, wardFilter, statusFilter, searchQuery]);

  const sidebarAssets = useMemo(() => {
    if (categoryFilter === 'all') return searchedAndFilteredAssets;
    return searchedAndFilteredAssets.filter((i) => i.category === categoryFilter);
  }, [searchedAndFilteredAssets, categoryFilter]);

  const mapVisibleAssets = useMemo(
    () => searchedAndFilteredAssets.filter((i) => Boolean(visibleLayers[i.category])),
    [searchedAndFilteredAssets, visibleLayers]
  );

  const selectedAssetObj = useMemo(() => {
    if (!selectedRef) return null;
    const list = data[selectedRef.category] || [];
    const found = list.find((item) => item.id === selectedRef.id);
    if (!found) return null;
    return { category: selectedRef.category, asset: found };
  }, [data, selectedRef]);

  const selectedAssetComplaints = useMemo(() => {
    if (!selectedAssetObj) return [];
    return complaints.filter(
      (c) => c.assetId === selectedAssetObj.asset.id && c.status !== 'Resolved'
    );
  }, [complaints, selectedAssetObj]);

  const allSelectedAssetComplaints = useMemo(() => {
    if (!selectedAssetObj) return [];
    return complaints.filter((c) => c.assetId === selectedAssetObj.asset.id);
  }, [complaints, selectedAssetObj]);

  const selectedAssetKey = selectedAssetObj
    ? `${selectedAssetObj.category}:${selectedAssetObj.asset.id}`
    : null;

  const handleToggleLayer = (layerKey) => {
    setVisibleLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleSelectAsset = (category, id, shouldFocus = true) => {
    setSelectedRef({ category, id });
    setVisibleLayers((prev) => ({ ...prev, [category]: true }));
    if (activeView !== 'map') setActiveView('map');
    setListDrawerOpen(false);

    if (shouldFocus) {
      const found = (data[category] || []).find((a) => a.id === id);
      if (found) {
        setFocusRequest({
          type: 'asset',
          category,
          asset: found,
          seq: Date.now(),
        });
      }
    }
  };

  const handleUpdateAsset = (category, updatedAsset) => {
    if (!isAdmin) return;
    const nextList = (data[category] || []).map((item) =>
      item.id === updatedAsset.id ? updatedAsset : item
    );
    commitData({ ...data, [category]: nextList }, `${updatedAsset.id} ✓`);
  };

  const handleDeleteAsset = (category, id) => {
    if (!isAdmin) return;
    const target = (data[category] || []).find((item) => item.id === id);
    if (target?.photoId) {
      deletePhoto(target.photoId);
    }
    const nextList = (data[category] || []).filter((item) => item.id !== id);
    if (selectedRef?.category === category && selectedRef?.id === id) {
      setSelectedRef(null);
    }
    commitData({ ...data, [category]: nextList }, `${id} removed`);
  };

  const handleResetData = () => {
    if (!isAdmin || isResetting) return;
    setIsResetting(true);
    setTimeout(async () => {
      await clearAllPhotos();
      const fresh = resetAssets();
      setData(fresh);
      setSelectedRef(null);
      setVisibleLayers(DEFAULT_VISIBLE_LAYERS);
      setCategoryFilter('all');
      setWardFilter('all');
      setStatusFilter('all');
      setSearchQuery('');
      setFocusRequest({ type: 'recenter', seq: Date.now() });
      setIsResetting(false);
      showToast(
        lang === 'kn' ? 'ಮಾದರಿ ದತ್ತಾಂಶ ಮರುಹೊಂದಿಸಲಾಗಿದೆ' : 'Restored demo data'
      );
    }, 220);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setWardFilter('all');
    setStatusFilter('all');
    setVisibleLayers(DEFAULT_VISIBLE_LAYERS);
  };

  const handleInspectWard = (ward) => {
    setWardFilter(ward.ward);
    setCategoryFilter('all');
    setStatusFilter('all');
    setVisibleLayers(DEFAULT_VISIBLE_LAYERS);
    setActiveView('map');
    setFocusRequest({ type: 'ward', ward, seq: Date.now() });
  };

  const handleOpenAssetWithResetFilters = (category, id) => {
    setSearchQuery('');
    setCategoryFilter('all');
    setWardFilter('all');
    setStatusFilter('all');
    setVisibleLayers((prev) => ({ ...prev, [category]: true }));
    handleSelectAsset(category, id, true);
  };

  const handleOpenComplaintOnMap = (complaint) => {
    if (complaint.assetId) {
      handleOpenAssetWithResetFilters(complaint.assetCategory, complaint.assetId);
      return;
    }
    if (Array.isArray(complaint.coordinates) && complaint.coordinates.length === 2) {
      setSearchQuery('');
      setCategoryFilter('all');
      setWardFilter('all');
      setStatusFilter('all');
      setSelectedRef(null);
      setActiveView('map');
      setFocusRequest({
        type: 'coordinates',
        coordinates: complaint.coordinates,
        label: `${complaint.id} • ${complaint.assetName?.en || 'Reported Issue'}`,
        seq: Date.now(),
      });
    }
  };

  // Public /report complaint handler (no login required, creates status: "New")
  const handleSubmitPublicComplaint = async ({
    problemType,
    coordinates,
    ward,
    description,
    phone,
    photoDraft,
  }) => {
    const latest = loadAssets();
    const existingComplaints = latest.complaints || [];
    const newComplaintId = generateNextId('complaints', existingComplaints);
    const today = new Date().toISOString().slice(0, 10);

    let photoId = null;
    if (photoDraft?.blob) {
      photoId = generatePhotoId('CMP');
      try {
        await savePhotoBlob(photoId, photoDraft.blob, {
          complaintId: newComplaintId,
        });
      } catch {
        photoId = null;
      }
    }

    const newComplaint = {
      id: newComplaintId,
      assetId: null,
      assetCategory: problemType.assetCategory,
      assetName: {
        en: `${problemType.en} Issue`,
        kn: `${problemType.kn} ಸಮಸ್ಯೆ`,
      },
      problemType: problemType.key,
      ward,
      coordinates,
      date: today,
      description,
      reportedBy: phone ? `Citizen (${phone})` : 'Citizen (/report)',
      ...(phone ? { phone } : {}),
      status: 'New',
      source: 'public',
      ...(photoId ? { photoId } : {}),
    };

    const nextData = {
      ...latest,
      complaints: [newComplaint, ...existingComplaints],
    };
    commitData(nextData);
    return newComplaint;
  };

  // Complaints handlers
  const handleReportProblemSubmit = async ({
    category,
    asset,
    date,
    description,
    reportedBy,
    markPoorOnSubmit,
    photoDraft,
  }) => {
    if (!isAdmin) return;
    const newComplaintId = generateNextId('complaints', complaints);
    let photoId = null;
    if (photoDraft?.blob) {
      photoId = generatePhotoId('CMP');
      try {
        await savePhotoBlob(photoId, photoDraft.blob, {
          complaintId: newComplaintId,
          assetId: asset.id,
        });
      } catch {
        photoId = null;
      }
    }

    const newComplaint = {
      id: newComplaintId,
      assetId: asset.id,
      assetCategory: category,
      assetName: asset.name,
      ward: asset.ward,
      date,
      description,
      reportedBy,
      status: 'Open',
      ...(photoId ? { photoId } : {}),
    };

    const historyEntry = createMaintenanceEntry(
      `Problem reported (${newComplaintId})`,
      description,
      reportedBy,
      date
    );

    const nextAssetList = (data[category] || []).map((item) => {
      if (item.id !== asset.id) return item;
      const statusPatch = markPoorOnSubmit
        ? category === 'streetLights'
          ? { status: 'faulty' }
          : { condition: 'poor' }
        : {};
      return {
        ...item,
        ...statusPatch,
        maintenanceHistory: [historyEntry, ...(item.maintenanceHistory || [])],
      };
    });

    commitData(
      {
        ...data,
        [category]: nextAssetList,
        complaints: [newComplaint, ...complaints],
      },
      `${newComplaintId} (Open) ✓`
    );
    setReportTarget(null);
  };

  const handleUpdateComplaintStatus = (complaintId, nextStatus, customNote = '') => {
    if (!isAdmin) return;
    const target = complaints.find((c) => c.id === complaintId);
    if (!target) return;

    const today = new Date().toISOString().slice(0, 10);
    const nextComplaints = complaints.map((c) => {
      if (c.id !== complaintId) return c;
      if (nextStatus === 'Resolved') {
        return {
          ...c,
          status: 'Resolved',
          resolvedDate: today,
          resolutionNotes: customNote || 'Issue repaired and verified.',
        };
      }
      return {
        ...c,
        status: nextStatus,
      };
    });

    const cat = target.assetCategory;
    const historyAction =
      nextStatus === 'Resolved'
        ? `Complaint ${target.id} resolved`
        : `Complaint ${target.id} marked In Progress`;
    const historyNotes =
      customNote ||
      (nextStatus === 'Resolved'
        ? `Resolved: ${target.description}`
        : `Work started: ${target.description}`);

    const historyEntry = createMaintenanceEntry(
      historyAction,
      historyNotes,
      session?.displayName || 'Admin / PDO',
      today
    );

    const nextAssetList = target.assetId
      ? (data[cat] || []).map((item) => {
          if (item.id !== target.assetId) return item;

          let conditionPatch = {};
          if (nextStatus === 'Resolved') {
            conditionPatch =
              cat === 'streetLights'
                ? { status: 'working' }
                : cat === 'roads'
                ? { condition: 'good', lastRepaired: today }
                : { condition: 'good' };
          } else if (nextStatus === 'In Progress' && cat !== 'streetLights') {
            if (item.condition === 'poor') {
              conditionPatch = { condition: 'fair' };
            }
          }

          return {
            ...item,
            ...conditionPatch,
            maintenanceHistory: [historyEntry, ...(item.maintenanceHistory || [])],
          };
        })
      : data[cat] || [];

    commitData(
      {
        ...data,
        [cat]: nextAssetList,
        complaints: nextComplaints,
      },
      `${target.id} → ${nextStatus}${target.assetId ? ` • ${target.assetId}` : ''}`
    );
  };

  // Add Modal handlers
  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    const initialCat =
      categoryFilter !== 'all' ? categoryFilter : 'waterTanks';
    setAddCategory(initialCat);
    setAddForm(createDefaultForm(initialCat, data.wards));
    setAddPhotoDraft(null);
    setIsPickingOnMap(false);
    setAddModalOpen(true);
    setActiveView('map');
  };

  const handleChangeAddCategory = (nextCategory) => {
    const defaults = createDefaultForm(nextCategory, data.wards);
    setAddCategory(nextCategory);
    setAddForm({
      ...defaults,
      nameEn: addForm.nameEn,
      nameKn: addForm.nameKn,
      ward: addForm.ward,
      notes: addForm.notes,
    });
  };

  const handleStartPickOnMap = () => {
    setActiveView('map');
    setListDrawerOpen(false);
    if (addCategory === 'roads') {
      setAddForm((prev) => ({ ...prev, polylinePoints: [] }));
    }
    setIsPickingOnMap(true);
  };

  const handleMapPickPoint = (latlng) => {
    if (addCategory === 'roads') {
      setAddForm((prev) => ({
        ...prev,
        polylinePoints: [...(prev.polylinePoints || []), latlng],
      }));
    } else {
      setAddForm((prev) => ({
        ...prev,
        lat: latlng[0],
        lng: latlng[1],
      }));
    }
  };

  const handleSubmitNewAsset = async (e) => {
    e.preventDefault();
    if (!isAdmin || !addForm.nameEn.trim()) return;
    const nextId = generateNextId(addCategory, data[addCategory]);
    let photoId = null;
    if (addPhotoDraft?.blob) {
      photoId = generatePhotoId('ASSET');
      try {
        await savePhotoBlob(photoId, addPhotoDraft.blob, { assetId: nextId });
      } catch {
        photoId = null;
      }
    }

    const newAsset = formToAsset(addCategory, { ...addForm, photoId }, nextId);
    const nextData = {
      ...data,
      [addCategory]: [newAsset, ...(data[addCategory] || [])],
    };
    commitData(nextData, `${nextId} ✓`);
    setAddModalOpen(false);
    setAddPhotoDraft(null);
    setIsPickingOnMap(false);
    setVisibleLayers((prev) => ({ ...prev, [addCategory]: true }));
    setSelectedRef({ category: addCategory, id: nextId });
    setFocusRequest({
      type: 'asset',
      category: addCategory,
      asset: newAsset,
      seq: Date.now(),
    });
  };

  if (routePath === '/report') {
    return (
      <PublicReportPage
        wards={data.wards}
        onSubmitPublicComplaint={handleSubmitPublicComplaint}
        onGoToPortal={() => navigateToPath('/')}
      />
    );
  }

  if (!session) {
    return (
      <LoginPage
        lang={lang}
        onChangeLang={setLang}
        onLoginSuccess={handleLoginSuccess}
        onOpenPublicReport={() => navigateToPath('/report')}
      />
    );
  }

  const pickMode = isPickingOnMap
    ? {
        active: true,
        mode: addCategory === 'roads' ? 'road' : 'point',
        points:
          addCategory === 'roads'
            ? addForm.polylinePoints || []
            : [[Number(addForm.lat), Number(addForm.lng)]],
        onDone: () => setIsPickingOnMap(false),
      }
    : null;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-slate-50 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      <Header
        activeView={activeView}
        onChangeView={setActiveView}
        lang={lang}
        onChangeLang={setLang}
        user={session}
        isAdmin={isAdmin}
        isResetting={isResetting}
        hasRealOsmData={Boolean(data.meta?.hasRealOsmData)}
        openComplaintsCount={openComplaintsCount}
        onOpenAddModal={handleOpenAddModal}
        onExportJson={() => {
          exportAssetsJson(data);
          showToast(lang === 'kn' ? 'JSON ರಫ್ತು ಮಾಡಲಾಗಿದೆ' : 'Exported JSON');
        }}
        onResetData={handleResetData}
        onLogout={handleLogout}
      />

      {activeView === 'home' ? (
        <HomePage
          lang={lang}
          data={data}
          isAdmin={isAdmin}
          isResetting={isResetting}
          onNavigate={setActiveView}
          onOpenPublicReport={() => navigateToPath('/report')}
          onResetData={handleResetData}
          onExportJson={() => {
            exportAssetsJson(data);
            showToast(lang === 'kn' ? 'JSON ರಫ್ತು ಮಾಡಲಾಗಿದೆ' : 'Exported JSON');
          }}
        />
      ) : activeView === 'wards' ? (
        <WardOverview lang={lang} data={data} onInspectWard={handleInspectWard} />
      ) : activeView === 'dashboard' ? (
        <Dashboard
          lang={lang}
          data={data}
          onOpenAssetOnMap={handleOpenAssetWithResetFilters}
          onInspectWard={handleInspectWard}
        />
      ) : activeView === 'complaints' ? (
        <ComplaintsPage
          lang={lang}
          complaints={complaints}
          wards={data.wards}
          isAdmin={isAdmin}
          onUpdateComplaintStatus={handleUpdateComplaintStatus}
          onOpenComplaintOnMap={handleOpenComplaintOnMap}
        />
      ) : activeView === 'register' ? (
        <PrintRegisterPage data={data} lang={lang} />
      ) : (
        <main className="flex-1 flex relative min-h-0 overflow-hidden">
          {/* Slide-over Directory Drawer */}
          <AssetSidebar
            lang={lang}
            isOpen={listDrawerOpen}
            onClose={() => setListDrawerOpen(false)}
            filteredAssets={sidebarAssets}
            totalCounts={totalCounts}
            wards={data.wards}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            wardFilter={wardFilter}
            onWardChange={setWardFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            selectedAssetKey={selectedAssetKey}
            onSelectAsset={(cat, id) => handleSelectAsset(cat, id, true)}
            onClearFilters={handleClearFilters}
          />

          {/* Full-Screen Leaflet Map Canvas */}
          <VillageMap
            lang={lang}
            wards={data.wards}
            filteredAssets={mapVisibleAssets}
            totalCounts={totalCounts}
            visibleLayers={visibleLayers}
            onToggleLayer={handleToggleLayer}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            wardFilter={wardFilter}
            onWardChange={setWardFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClearFilters={handleClearFilters}
            onOpenListDrawer={() => setListDrawerOpen(true)}
            selectedAssetKey={selectedAssetKey}
            focusRequest={focusRequest}
            onSelectAsset={(cat, id) => handleSelectAsset(cat, id, false)}
            pickMode={pickMode}
            onMapPickPoint={handleMapPickPoint}
          />

          {/* Right Asset Details Side Panel */}
          {selectedAssetObj && (
            <AssetDetailDrawer
              lang={lang}
              selected={selectedAssetObj}
              wards={data.wards}
              isAdmin={isAdmin}
              assetComplaints={selectedAssetComplaints}
              allAssetComplaints={allSelectedAssetComplaints}
              onClose={() => setSelectedRef(null)}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
              onReportProblem={(cat, asset) => setReportTarget({ category: cat, asset })}
              onViewComplaints={() => setActiveView('complaints')}
            />
          )}
        </main>
      )}

      {isAdmin && (
        <>
          <AddAssetModal
            lang={lang}
            isOpen={addModalOpen}
            isHiddenForPick={isPickingOnMap}
            category={addCategory}
            form={addForm}
            wards={data.wards}
            existingAssets={data}
            onChangeCategory={handleChangeAddCategory}
            onChangeForm={setAddForm}
            photoDraft={addPhotoDraft}
            onChangePhotoDraft={setAddPhotoDraft}
            onStartPickOnMap={handleStartPickOnMap}
            onClose={() => {
              setAddModalOpen(false);
              setAddPhotoDraft(null);
              setIsPickingOnMap(false);
            }}
            onSubmit={handleSubmitNewAsset}
          />

          <ReportProblemModal
            lang={lang}
            isOpen={Boolean(reportTarget)}
            target={reportTarget}
            defaultReporter={session?.displayName}
            onClose={() => setReportTarget(null)}
            onSubmit={handleReportProblemSubmit}
          />
        </>
      )}

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[700] bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold border border-slate-700 print:hidden">
          {toast}
        </div>
      )}
    </div>
  );
}
