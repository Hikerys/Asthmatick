import React, { useState, useEffect, useCallback, useRef } from "react";
import { App as CapApp } from "@capacitor/app";
import {
  ScheduleEvent,
  AttackRecord,
  NoteRecord,
  AppSettings,
  TimelineItem,
} from "./types";
import {
  loadScheduleEvents,
  saveScheduleEvents,
  loadAttacks,
  saveAttacks,
  loadNotes,
  saveNotes,
  loadSettings,
  saveSettings,
  formatDateKey,
  getScheduleStatusInfo,
} from "./storage";
import { syncScheduleNotifications, clearAllNotifications } from "./notifications";
import { triggerBack } from "./navigation";
import { Header } from "./components/Header";
import { BottomNav, NavTab } from "./components/BottomNav";
import { MyDayScreen } from "./components/MyDayScreen";
import { CalendarScreen } from "./components/CalendarScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { OnboardingModal } from "./components/OnboardingModal";
import { FabMenu } from "./components/FabMenu";
import { AddScheduleModal } from "./components/AddScheduleModal";
import { AddAttackModal } from "./components/AddAttackModal";
import { AddNoteModal } from "./components/AddNoteModal";
import { ItemDetailModal } from "./components/ItemDetailModal";

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(() =>
    loadScheduleEvents()
  );
  const [attacks, setAttacks] = useState<AttackRecord[]>(() => loadAttacks());
  const [notes, setNotes] = useState<NoteRecord[]>(() => loadNotes());

  const [currentTab, setCurrentTab] = useState<NavTab>("myday");
  const [tabHistory, setTabHistory] = useState<NavTab[]>(["myday"]);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !settings.hasSeenOnboarding
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => {
      setToastMessage(null);
    }, 3800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Active add modals
  const [activeModal, setActiveModal] = useState<
    "none" | "schedule" | "attack" | "note"
  >("none");

  // Selected item for viewing details
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  // Item being edited
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);

  // Navigation tab selection
  const handleSelectTab = (tab: NavTab) => {
    if (tab === currentTab) return;
    if (tab === "myday") {
      setTabHistory(["myday"]);
    } else {
      setTabHistory((prev) => [...prev.filter((t) => t !== tab), tab]);
    }
    setCurrentTab(tab);
  };

  // Back action: closes top window/modal, or navigates back to previous section / myday, or exits
  const handleGoBack = useCallback(() => {
    // 1. Try modal back handlers (ModalSheet)
    const handled = triggerBack();
    if (handled) return;

    // 2. Tab navigation back
    if (tabHistory.length > 1) {
      const next = [...tabHistory];
      next.pop();
      const prevTab = next[next.length - 1] || "myday";
      setTabHistory(next);
      setCurrentTab(prevTab);
      return;
    }

    if (currentTab !== "myday") {
      setTabHistory(["myday"]);
      setCurrentTab("myday");
      return;
    }

    // 3. At root tab with no modals: exit app on Android
    CapApp.exitApp();
  }, [currentTab, tabHistory]);

  // Android hardware / gesture back button handler
  useEffect(() => {
    let removeListener: (() => void) | undefined;
    CapApp.addListener("backButton", () => {
      handleGoBack();
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      if (removeListener) removeListener();
    };
  }, [handleGoBack]);

  // Screen horizontal swipe right gesture to go back (from section to home)
  const screenSwipeStartXRef = useRef(0);
  const screenSwipeStartYRef = useRef(0);
  const screenSwipeStartTimeRef = useRef(0);

  const handleScreenTouchStart = (e: React.TouchEvent) => {
    screenSwipeStartXRef.current = e.touches[0].clientX;
    screenSwipeStartYRef.current = e.touches[0].clientY;
    screenSwipeStartTimeRef.current = Date.now();
  };

  const handleScreenTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - screenSwipeStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - screenSwipeStartYRef.current;
    const elapsed = Date.now() - screenSwipeStartTimeRef.current;

    // Swipe right across screen: back gesture
    if (deltaX > 75 && deltaX > Math.abs(deltaY) * 1.4 && elapsed < 450) {
      handleGoBack();
    }
  };

  // Sync theme attribute and class to HTML root and body
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.dataset.theme = "dark";
      document.body.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
      delete document.body.dataset.theme;
    }
    document.documentElement.className = settings.theme;
    document.body.className = settings.theme;
  }, [settings.theme]);

  // Global ripple effect handler matching AsthmatickDesign.html
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest(".tap");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const s = Math.max(r.width, r.height) * 2;
      const i = document.createElement("span");
      i.className = "rip";
      i.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
      el.appendChild(i);
      setTimeout(() => i.remove(), 650);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  // Sync notifications when schedule or settings change
  useEffect(() => {
    if (settings.notificationsEnabled) {
      syncScheduleNotifications(scheduleEvents, settings.notificationSound || "system");
    } else {
      clearAllNotifications();
    }
  }, [scheduleEvents, settings.notificationsEnabled, settings.notificationSound]);

  // Re-sync notifications when app resumes from background or settings
  useEffect(() => {
    const handleResume = () => {
      if (document.visibilityState === "visible" && settings.notificationsEnabled) {
        syncScheduleNotifications(scheduleEvents, settings.notificationSound || "system");
      }
    };
    window.addEventListener("focus", handleResume);
    document.addEventListener("visibilitychange", handleResume);
    return () => {
      window.removeEventListener("focus", handleResume);
      document.removeEventListener("visibilitychange", handleResume);
    };
  }, [scheduleEvents, settings.notificationsEnabled]);

  const refreshAllData = () => {
    setScheduleEvents(loadScheduleEvents());
    setAttacks(loadAttacks());
    setNotes(loadNotes());
    setSettings(loadSettings());
  };

  const handleCompleteOnboarding = () => {
    const updated = { ...settings, hasSeenOnboarding: true };
    saveSettings(updated);
    setSettings(updated);
    setShowOnboarding(false);
  };

  // Add / Save Schedule
  const handleSaveSchedule = (
    data: Omit<ScheduleEvent, "id" | "createdAt" | "completedDates">
  ) => {
    if (editingItem && editingItem.type === "schedule") {
      const updated = scheduleEvents.map((ev) =>
        ev.id === editingItem.id ? { ...ev, ...data } : ev
      );
      saveScheduleEvents(updated);
      setScheduleEvents(updated);
      setEditingItem(null);
    } else {
      const newEvent: ScheduleEvent = {
        id: "sched-" + Date.now(),
        ...data,
        completedDates: [],
        createdAt: Date.now(),
      };
      const updated = [...scheduleEvents, newEvent];
      saveScheduleEvents(updated);
      setScheduleEvents(updated);
    }
    setActiveModal("none");
  };

  // Add / Save Attack
  const handleSaveAttack = (data: Omit<AttackRecord, "id" | "createdAt">) => {
    if (editingItem && editingItem.type === "attack") {
      const updated = attacks.map((att) =>
        att.id === editingItem.id ? { ...att, ...data } : att
      );
      saveAttacks(updated);
      setAttacks(updated);
      setEditingItem(null);
    } else {
      const newAttack: AttackRecord = {
        id: "att-" + Date.now(),
        ...data,
        createdAt: Date.now(),
      };
      const updated = [newAttack, ...attacks];
      saveAttacks(updated);
      setAttacks(updated);
    }
    setActiveModal("none");
  };

  // Add / Save Note
  const handleSaveNote = (data: Omit<NoteRecord, "id" | "createdAt">) => {
    if (editingItem && editingItem.type === "note") {
      const updated = notes.map((n) =>
        n.id === editingItem.id ? { ...n, ...data } : n
      );
      saveNotes(updated);
      setNotes(updated);
      setEditingItem(null);
    } else {
      const newNote: NoteRecord = {
        id: "note-" + Date.now(),
        ...data,
        createdAt: Date.now(),
      };
      const updated = [newNote, ...notes];
      saveNotes(updated);
      setNotes(updated);
    }
    setActiveModal("none");
  };

  // Toggle Complete on an item
  const handleToggleComplete = (item: TimelineItem) => {
    const now = new Date();
    const todayStr = formatDateKey(now);

    if (item.type === "schedule") {
      const ev = item.raw;
      const isDone = ev.completedDates?.includes(todayStr);

      if (!isDone) {
        const status = getScheduleStatusInfo(ev, todayStr, now);
        if (status.isTooEarly) {
          showToast(`Еще слишком рано! Отметить выполнение можно с ${status.windowStartTime} по ${status.windowEndTime}`);
          return;
        }
        if (status.isMissed) {
          showToast(`Время выполнения пропущено! Отметить можно было только до ${status.windowEndTime}`);
          return;
        }

        const nowTimeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
        const updatedDates = [...(ev.completedDates || []), todayStr];
        const updatedTimes = { ...(ev.completionTimes || {}), [todayStr]: nowTimeStr };

        const updated = scheduleEvents.map((s) =>
          s.id === ev.id ? { ...s, completedDates: updatedDates, completionTimes: updatedTimes } : s
        );
        saveScheduleEvents(updated);
        setScheduleEvents(updated);
        showToast(`✓ Выполнено в ${nowTimeStr}!`);
      } else {
        const updatedDates = (ev.completedDates || []).filter((d) => d !== todayStr);
        const updatedTimes = { ...(ev.completionTimes || {}) };
        delete updatedTimes[todayStr];

        const updated = scheduleEvents.map((s) =>
          s.id === ev.id ? { ...s, completedDates: updatedDates, completionTimes: updatedTimes } : s
        );
        saveScheduleEvents(updated);
        setScheduleEvents(updated);
        showToast("Событие возвращено в запланированные.");
      }
    } else if (item.type === "attack") {
      const updated = attacks.map((att) =>
        att.id === item.id ? { ...att, completed: !att.completed } : att
      );
      saveAttacks(updated);
      setAttacks(updated);
    } else if (item.type === "note") {
      const updated = notes.map((n) =>
        n.id === item.id ? { ...n, completed: !n.completed } : n
      );
      saveNotes(updated);
      setNotes(updated);
    }

    setSelectedItem(null);
  };

  // Delete an item
  const handleDeleteItem = (item: TimelineItem) => {
    if (!confirm("Вы уверены, что хотите удалить эту запись?")) return;

    if (item.type === "schedule") {
      const updated = scheduleEvents.filter((ev) => ev.id !== item.id);
      saveScheduleEvents(updated);
      setScheduleEvents(updated);
    } else if (item.type === "attack") {
      const updated = attacks.filter((att) => att.id !== item.id);
      saveAttacks(updated);
      setAttacks(updated);
    } else if (item.type === "note") {
      const updated = notes.filter((n) => n.id !== item.id);
      saveNotes(updated);
      setNotes(updated);
    }

    setSelectedItem(null);
  };

  // Edit an item
  const handleEditItem = (item: TimelineItem) => {
    setSelectedItem(null);
    setEditingItem(item);
    if (item.type === "schedule") {
      setActiveModal("schedule");
    } else if (item.type === "attack") {
      setActiveModal("attack");
    } else if (item.type === "note") {
      setActiveModal("note");
    }
  };

  return (
    <div className="app" id="app">
      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleCompleteOnboarding}
      />

      {/* Main Header */}
      <Header />

      {/* Screen Views */}
      <main
        onTouchStart={handleScreenTouchStart}
        onTouchEnd={handleScreenTouchEnd}
      >
        {currentTab === "myday" && (
          <MyDayScreen
            scheduleEvents={scheduleEvents}
            attacks={attacks}
            notes={notes}
            onSelectItem={(item) => setSelectedItem(item)}
            onToggleCompleteItem={handleToggleComplete}
          />
        )}

        {currentTab === "calendar" && (
          <CalendarScreen
            scheduleEvents={scheduleEvents}
            attacks={attacks}
            notes={notes}
            onSelectItem={(item) => setSelectedItem(item)}
            onToggleCompleteItem={handleToggleComplete}
          />
        )}

        {currentTab === "settings" && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
            onDataRestored={refreshAllData}
            onShowOnboarding={() => setShowOnboarding(true)}
          />
        )}
      </main>

      {/* Floating Action Button (+) - shown only in My Day */}
      <button
        type="button"
        id="fab"
        aria-label="Добавить"
        className={`fab tap ${currentTab !== "myday" ? "hide" : ""}`}
        onClick={() => setIsFabOpen(true)}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 4v16M4 12h16" />
        </svg>
      </button>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
      />

      {/* FAB Popup menu */}
      <FabMenu
        isOpen={isFabOpen}
        onClose={() => setIsFabOpen(false)}
        onSelectOption={(opt) => {
          setEditingItem(null);
          setActiveModal(opt);
        }}
      />

      {/* Add / Edit Schedule Modal */}
      <AddScheduleModal
        isOpen={activeModal === "schedule"}
        initial={editingItem?.type === "schedule" ? editingItem.raw : null}
        onClose={() => {
          setActiveModal("none");
          setEditingItem(null);
        }}
        onSave={handleSaveSchedule}
      />

      {/* Add / Edit Attack Modal */}
      <AddAttackModal
        isOpen={activeModal === "attack"}
        initial={editingItem?.type === "attack" ? editingItem.raw : null}
        onClose={() => {
          setActiveModal("none");
          setEditingItem(null);
        }}
        onSave={handleSaveAttack}
      />

      {/* Add / Edit Note Modal */}
      <AddNoteModal
        isOpen={activeModal === "note"}
        initial={editingItem?.type === "note" ? editingItem.raw : null}
        onClose={() => {
          setActiveModal("none");
          setEditingItem(null);
        }}
        onSave={handleSaveNote}
      />

      {/* Item Detail / Actions Modal */}
      <ItemDetailModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        currentDateStr={formatDateKey(new Date())}
        onClose={() => setSelectedItem(null)}
        onToggleComplete={handleToggleComplete}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className="toast-banner tap"
          onClick={() => setToastMessage(null)}
          role="alert"
        >
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
