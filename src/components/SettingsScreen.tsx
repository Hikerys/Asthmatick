import React, { useState } from "react";
import { AppSettings, NotificationSound, APP_VERSION } from "../types";
import {
  exportSQLiteBackup,
  importSQLiteBackup,
  saveSettings,
  loadScheduleEvents,
  loadAttacks,
  loadNotes,
} from "../storage";
import {
  checkNotificationPermission,
  requestNotificationPermission,
  checkExactAlarmPermission,
  openExactAlarmSettings,
  sendTestNotification,
  SOUND_OPTIONS,
  playSoundPreview,
} from "../notifications";
import { ChevronRightIcon, LungLogo } from "./Icons";
import { ModalSheet } from "./ModalSheet";

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onDataRestored: () => void;
  onShowOnboarding: () => void;
}

export function SettingsScreen({
  settings,
  onUpdateSettings,
  onDataRestored,
  onShowOnboarding,
}: SettingsScreenProps) {
  const [activeModal, setActiveModal] = useState<
    "none" | "notifications" | "sound" | "theme" | "info" | "export" | "import" | "privacy" | "terms"
  >("none");
  const [notificationGranted, setNotificationGranted] = useState(
    settings.notificationsEnabled
  );
  const [exactAlarmGranted, setExactAlarmGranted] = useState(true);

  const refreshPermissions = async () => {
    const notif = await checkNotificationPermission();
    const exact = await checkExactAlarmPermission();
    setNotificationGranted(notif);
    setExactAlarmGranted(exact);
  };

  React.useEffect(() => {
    refreshPermissions();
    const handleFocus = () => {
      refreshPermissions();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const schedCount = loadScheduleEvents().length;
  const attackCount = loadAttacks().length;
  const notesCount = loadNotes().length;
  const totalCount = schedCount + attackCount + notesCount;
  const backupFilename = `asthmatick_backup_${new Date().toISOString().slice(0, 10)}.db`;

  const handleExportToFile = async () => {
    try {
      const saved = await exportSQLiteBackup(backupFilename);
      setExportNotice(saved ? "✓ Резервная копия SQLite сохранена." : "Сохранение отменено.");
    } catch (err: any) {
      setExportNotice("Ошибка экспорта: " + (err?.message || err));
    }
  };

  const handleImportFromFile = async () => {
    try {
      const restored = await importSQLiteBackup();
      if (restored) {
        onDataRestored();
        setImportStatus("✓ База данных восстановлена.");
        setTimeout(() => {
          setActiveModal("none");
          setImportStatus(null);
        }, 1500);
      }
    } catch (err: any) {
      setImportStatus("Ошибка импорта: выберите корректную копию Asthmatick .db. " + (err?.message || ""));
    }
  };

  const handleToggleNotifications = async () => {
    if (!notificationGranted) {
      const granted = await requestNotificationPermission();
      setNotificationGranted(granted);
      const exact = await checkExactAlarmPermission();
      setExactAlarmGranted(exact);
      const updated: AppSettings = { ...settings, notificationsEnabled: granted };
      saveSettings(updated);
      onUpdateSettings(updated);
      if (granted) {
        await sendTestNotification();
      }
    } else {
      setNotificationGranted(false);
      const updated: AppSettings = { ...settings, notificationsEnabled: false };
      saveSettings(updated);
      onUpdateSettings(updated);
    }
  };

  const handleSetTheme = (theme: "light" | "dark" | "system") => {
    const updated: AppSettings = { ...settings, theme };
    saveSettings(updated);
    onUpdateSettings(updated);
    setTimeout(() => setActiveModal("none"), 250);
  };

  const handleSetLanguage = (language: AppSettings["language"]) => {
    document.documentElement.lang = language;
    const updated: AppSettings = { ...settings, language };
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  const handleSetSound = (sound: NotificationSound) => {
    playSoundPreview(sound);
    const updated: AppSettings = { ...settings, notificationSound: sound };
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <section className="screen set on" id="set">
      {/* Flex column wrapper to push legal footer to the very bottom */}
      <div className="settings-content">

      {/* Group 1: Предпочтения */}
      <div className="m3-settings-group">
        <div className="m3-settings-group-title">Предпочтения</div>
        <div className="m3-settings-group-card">
          {/* 1. Уведомления */}
          <div
            className="card tap"
            onClick={() => setActiveModal("notifications")}
          >
            <div className="ic b">
              <svg viewBox="0 0 28 28" fill="none" stroke="#2f7be0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 21c1.5-1.5 2-3 2-6v-3a6 6 0 0112 0v3c0 3 .5 4.5 2 6zM11.5 24a2.5 2.5 0 005 0" />
                <path d="M14 4v2" />
              </svg>
            </div>
            <div className="t">
              <b>Уведомления</b>
              <div>{settings.notificationsEnabled ? "Включены (напоминания активны)" : "Напоминания и оповещения"}</div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* 2. Звук уведомления */}
          <div
            className="card tap"
            onClick={() => setActiveModal("sound")}
          >
            <div className="ic g">
              <svg viewBox="0 0 28 28" fill="none" stroke="#1a9b8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 6 7 10 3 10 3 18 7 18 12 22 12 6" />
                <path d="M16.5 9.5a5 5 0 010 9" />
                <path d="M19.8 6.2a9.5 9.5 0 010 15.6" />
              </svg>
            </div>
            <div className="t">
              <b>Звук уведомления</b>
              <div>
                {SOUND_OPTIONS.find((s) => s.id === (settings.notificationSound || "system"))?.title || "Системный"}
              </div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* 3. Тема приложения */}
          <div
            className="card tap"
            id="themeRow"
            onClick={() => setActiveModal("theme")}
          >
            <div className="ic p">
              <svg viewBox="0 0 28 28" fill="none" stroke="#7b4bc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 3h10l5 5v15a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                <path d="M17 3v5h5M9 13h8M9 17h8M9 21h5" />
              </svg>
            </div>
            <div className="t">
              <b>Тема приложения</b>
              <div>
                {settings.theme === "dark"
                  ? "Тёмная"
                  : settings.theme === "system"
                  ? "Как в системе (MD3)"
                  : "Светлая"}
              </div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>

      {/* Group 2: Резервное копирование */}
      <div className="m3-settings-group">
        <div className="m3-settings-group-title">Резервное копирование</div>
        <div className="m3-settings-group-card">
          {/* Импортировать данные */}
          <div
            className="card tap"
            onClick={() => {
              setImportStatus(null);
              setActiveModal("import");
            }}
          >
            <div className="ic g">
              <svg viewBox="0 0 28 28" fill="none" stroke="#1a9b8c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 20a6 6 0 01-.5-12 8 8 0 0115 1.5A5 5 0 0121 20" />
                <path d="M14 25v-9M10.5 19.5L14 16l3.5 3.5" />
              </svg>
            </div>
            <div className="t">
              <b>Импортировать данные</b>
              <div>Загрузить из резервной копии</div>
            </div>
            <ChevronRightIcon />
          </div>

          {/* Экспортировать данные */}
          <div
            className="card tap"
            onClick={() => {
              setExportNotice(null);
              setActiveModal("export");
            }}
          >
            <div className="ic b">
              <svg viewBox="0 0 28 28" fill="none" stroke="#2f7be0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 20a6 6 0 01-.5-12 8 8 0 0115 1.5A5 5 0 0121 20" />
                <path d="M14 15v9M10.5 20.5L14 24l3.5-3.5" />
              </svg>
            </div>
            <div className="t">
              <b>Экспортировать данные</b>
              <div>Сохранить на устройство ({totalCount} записей)</div>
            </div>
            <ChevronRightIcon />
          </div>
        </div>
      </div>

      {/* Group 3: О приложении */}
      <div className="m3-settings-group about-group">
        <div className="m3-settings-group-title">О приложении</div>
        <div className="m3-settings-group-card">
          {/* Справочная информация */}
          <div
            className="card tap"
            onClick={() => setActiveModal("info")}
          >
            <div className="ic p">
              <svg viewBox="0 0 28 28" fill="none" stroke="#7b4bc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="14" cy="14" r="11" />
                <path d="M14 12.5V20M14 8.5v.5" />
              </svg>
            </div>
            <div className="t">
              <b>Справочная информация</b>
              <div>О приложении и версия</div>
            </div>
            <ChevronRightIcon />
          </div>
          <div className="card language-setting">
            <div className="ic g" aria-hidden="true">
              <svg viewBox="0 0 28 28" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="14" cy="14" r="10" />
                <path d="M4 14h20M14 4c-3 3-4.5 6.3-4.5 10S11 21 14 24M14 4c3 3 4.5 6.3 4.5 10S17 21 14 24" />
              </svg>
            </div>
            <div className="t"><b>Язык / Language</b><div>Русский / English</div></div>
            <div className="language-switch" role="group" aria-label="Language / Язык">
              <button type="button" className={settings.language === "ru" ? "selected" : ""} onClick={() => handleSetLanguage("ru")} aria-pressed={settings.language === "ru"}>RU</button>
              <button type="button" className={settings.language === "en" ? "selected" : ""} onClick={() => handleSetLanguage("en")} aria-pressed={settings.language === "en"}>EN</button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Theme Sheet */}
      <ModalSheet
        isOpen={activeModal === "theme"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Тема приложения</h3>
        <button
          type="button"
          className={`opt tap ${settings.theme === "light" ? "on" : ""}`}
          onClick={() => handleSetTheme("light")}
        >
          <div className="ic g">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>Светлая</div>
            <div style={{ fontSize: "12px", color: "var(--sub)", marginTop: "2px" }}>
              Классическая бирюзовая палитра
            </div>
          </div>
          <span className="r" />
        </button>
        <button
          type="button"
          className={`opt tap ${settings.theme === "dark" ? "on" : ""}`}
          onClick={() => handleSetTheme("dark")}
        >
          <div className="ic p">
            <svg viewBox="0 0 24 24">
              <path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>Тёмная</div>
            <div style={{ fontSize: "12px", color: "var(--sub)", marginTop: "2px" }}>
              Глубокая тёмная палитра
            </div>
          </div>
          <span className="r" />
        </button>
        <button
          type="button"
          className={`opt tap ${settings.theme === "system" ? "on" : ""}`}
          onClick={() => handleSetTheme("system")}
        >
          <div className="ic b">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="3" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div>Как в системе (MD3)</div>
            <div style={{ fontSize: "12px", color: "var(--sub)", marginTop: "2px" }}>
              По обоям телефона (Material You)
            </div>
          </div>
          <span className="r" />
        </button>
      </ModalSheet>

      {/* MODAL: Notifications Sheet */}
      <ModalSheet
        isOpen={activeModal === "notifications"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Уведомления</h3>
        <div className="opt tap" onClick={handleToggleNotifications} style={{ justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "16px" }}>Включить напоминания</div>
            <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
              Оповещения о приёме лекарств по плану
            </div>
          </div>
          <div className={`m3-switch ${notificationGranted ? "on" : ""}`}>
            <div className="m3-switch-thumb">
              {notificationGranted && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Exact Alarm status & guidance on Android */}
        <div
          style={{
            background: exactAlarmGranted ? "var(--tint)" : "#fff7ed",
            border: `1.5px solid ${exactAlarmGranted ? "var(--border)" : "#fdba74"}`,
            borderRadius: "16px",
            padding: "14px",
            marginTop: "12px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>
              {exactAlarmGranted ? "⏱️" : "⚠️"}
            </span>
            <div style={{ fontSize: "13px", lineHeight: 1.45, color: "var(--text)", flex: 1 }}>
              <strong>
                {exactAlarmGranted
                  ? "Точные напоминания активны"
                  : "Точные будильники не разрешены"}
              </strong>
              <div style={{ marginTop: "4px", color: exactAlarmGranted ? "var(--sub)" : "#9a3412" }}>
                {exactAlarmGranted
                  ? "Напоминания доставляются точно минута в минуту, даже в режиме энергосбережения и блокировки."
                  : "Без разрешения «Будильники и напоминания» Android задерживает оповещения от 15 минут до нескольких часов в целях экономии батареи."}
              </div>
              {!exactAlarmGranted && (
                <button
                  type="button"
                  onClick={async () => {
                    await openExactAlarmSettings();
                  }}
                  className="btn-secondary"
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    fontSize: "13px",
                    padding: "8px 12px",
                    background: "#ea580c",
                    color: "#fff",
                    borderColor: "#ea580c",
                    fontWeight: 600,
                  }}
                >
                  Разрешить «Будильники и напоминания»
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Recommendation banner for battery optimization */}
        <div
          style={{
            background: "var(--tint)",
            border: "1.5px solid var(--border)",
            borderRadius: "16px",
            padding: "14px",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "20px", lineHeight: 1 }}>💡</span>
            <div style={{ fontSize: "13px", lineHeight: 1.45, color: "var(--text)" }}>
              <strong>Фоновая работа:</strong> Чтобы Android (особенно на устройствах Xiaomi, Samsung, Huawei) не откладывал напоминания, отключите «Оптимизацию батареи» и разрешите автозапуск / фоновую активность для Asthmatick в настройках телефона.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => sendTestNotification(settings.notificationSound || "system")}
          className="btn-secondary"
          style={{ marginBottom: "10px" }}
        >
          🔔 Отправить тестовое уведомление
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("none")}
          className="btn-primary"
        >
          Готово
        </button>
      </ModalSheet>

      {/* MODAL: Sound Sheet */}
      <ModalSheet
        isOpen={activeModal === "sound"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Звук уведомления</h3>
        <div style={{ fontSize: "14px", color: "var(--sub)", marginBottom: "14px" }}>
          Выберите мелодию для напоминаний. Нажмите, чтобы прослушать:
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {SOUND_OPTIONS.map((opt) => {
            const isSelected = (settings.notificationSound || "system") === opt.id;
            return (
              <button
                type="button"
                key={opt.id}
                className={`opt tap ${isSelected ? "on" : ""}`}
                onClick={() => handleSetSound(opt.id)}
                style={{ justifyContent: "space-between" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                  <div className={`ic ${opt.id === "system" ? "b" : opt.id === "sound_chime" ? "g" : opt.id === "sound_breeze" ? "b" : opt.id === "sound_digital" ? "p" : "g"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 010 7.07" />
                    </svg>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                      {opt.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
                      {opt.subtitle}
                    </div>
                  </div>
                </div>
                <span className={`r ${isSelected ? "on" : ""}`} style={{ background: isSelected ? "var(--teal)" : "transparent", borderColor: isSelected ? "var(--teal)" : "var(--sub)" }}>
                  {isSelected && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => sendTestNotification(settings.notificationSound || "system")}
          className="btn-secondary"
          style={{ marginBottom: "8px" }}
        >
          🔔 Проверить текущий звук уведомлением
        </button>

        <button
          type="button"
          onClick={() => setActiveModal("none")}
          className="btn-primary"
        >
          Готово
        </button>
      </ModalSheet>

      {/* MODAL: Export Sheet */}
      <ModalSheet
        isOpen={activeModal === "export"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Экспорт базы данных</h3>

        <div
          style={{
            background: "var(--tint)",
            borderRadius: "16px",
            padding: "14px",
            marginBottom: "14px",
            fontSize: "14px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "8px" }}>Готово к экспорту:</div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--sub)", marginBottom: "4px" }}>
            <span>Расписание приёма:</span>
            <b style={{ color: "var(--text)" }}>{schedCount}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--sub)", marginBottom: "4px" }}>
            <span>Зафиксировано приступов:</span>
            <b style={{ color: "var(--text)" }}>{attackCount}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--sub)" }}>
            <span>Заметок:</span>
            <b style={{ color: "var(--text)" }}>{notesCount}</b>
          </div>
        </div>

        {exportNotice && (
          <div
            style={{
              background: "rgba(26, 155, 140, 0.15)",
              color: "var(--teal)",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            {exportNotice}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={handleExportToFile}
            className="btn-primary"
          >
            Сохранить файл .db
          </button>

        </div>
      </ModalSheet>

      {/* MODAL: Import Sheet */}
      <ModalSheet
        isOpen={activeModal === "import"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Импорт базы данных</h3>

        <div style={{ fontSize: "14px", color: "var(--sub)", marginBottom: "12px" }}>
          Выберите резервную копию Asthmatick в формате SQLite (.db). Текущие записи будут заменены данными из файла.
        </div>

        <button
          type="button"
          onClick={handleImportFromFile}
          className="btn-primary"
          style={{ marginBottom: "14px" }}
        >
          Выбрать файл .db с устройства
        </button>

        {importStatus && (
          <div
            style={{
              background: importStatus.startsWith("✓") ? "rgba(26, 155, 140, 0.15)" : "rgba(240, 106, 104, 0.15)",
              color: importStatus.startsWith("✓") ? "var(--teal)" : "#f06a68",
              padding: "12px",
              borderRadius: "12px",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            {importStatus}
          </div>
        )}

        <button
          type="button"
          onClick={() => setActiveModal("none")}
          className="btn-secondary"
        >
          Отмена
        </button>
      </ModalSheet>

      {/* MODAL: Info Sheet */}
      <ModalSheet
        isOpen={activeModal === "info"}
        onClose={() => setActiveModal("none")}
      >
        <h3>Справочная информация</h3>

        <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
          <div style={{ display: "inline-flex", marginBottom: "8px" }}>
            <LungLogo size={56} />
          </div>
          <div style={{ fontSize: "24px", fontWeight: 800 }}>Asthmatick</div>
          <div style={{ fontSize: "14px", color: "var(--sub)" }}>
            Трекер приступов и дневник астмы
          </div>
        </div>

        <div
          style={{
            background: "var(--tint)",
            borderRadius: "16px",
            padding: "14px",
            fontSize: "14px",
            marginBottom: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--sub)" }}>Package ID:</span>
            <b style={{ fontFamily: "monospace" }}>app.asthma.tick</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "var(--sub)" }}>Версия:</span>
            <b>{APP_VERSION}</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--sub)" }}>Хранение данных:</span>
            <b style={{ color: "var(--teal)" }}>100% Локально</b>
          </div>
        </div>

        <div
          style={{
            background: "rgba(248, 176, 75, 0.15)",
            border: "1.5px solid rgba(248, 176, 75, 0.35)",
            borderRadius: "14px",
            padding: "12px 14px",
            fontSize: "13px",
            lineHeight: 1.45,
            marginBottom: "16px",
          }}
        >
          <strong>Медицинский отказ:</strong> Данное приложение не является медицинским продуктом и служит исключительно для трекера и контроля расписания.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setActiveModal("none");
              onShowOnboarding();
            }}
            className="btn-secondary"
          >
            Повторить вступительную инструкцию
          </button>
          <button
            type="button"
            onClick={() => setActiveModal("none")}
            className="btn-primary"
          >
            Понятно
          </button>
        </div>
      </ModalSheet>

      {/* Legal footer links */}
      <div
        className="settings-footer"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "18px",
          padding: "40px 16px 12px",
          marginTop: "auto",
          opacity: 0.45,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveModal("privacy")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "12px",
            color: "var(--sub)",
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
        >
          Политика конфиденциальности
        </button>
        <span style={{ fontSize: "12px", color: "var(--sub)" }}>·</span>
        <button
          type="button"
          onClick={() => setActiveModal("terms")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: "12px",
            color: "var(--sub)",
            cursor: "pointer",
            fontFamily: "inherit",
            lineHeight: 1.4,
          }}
        >
          Пользовательское соглашение
        </button>
      </div>

      </div>{/* end flex wrapper */}

      {/* MODAL: Privacy Policy */}
      <ModalSheet
        isOpen={activeModal === "privacy"}
        onClose={() => setActiveModal("none")}
        className="legal-modal"
      >
        <h3>Политика конфиденциальности</h3>

        <div style={{ fontSize: "13px", color: "var(--sub)", marginBottom: "16px" }}>
          Последнее обновление: 13 октября 2026
        </div>

        <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text)", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>1. Хранение данных</div>
            <div style={{ color: "var(--sub)" }}>
              Все данные приложения (расписание приёма, записи о приступах, заметки и настройки) хранятся исключительно локально на вашем устройстве. Мы не собираем, не передаём и не имеем доступа к вашим персональным данным.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>2. Сторонние сервисы</div>
            <div style={{ color: "var(--sub)" }}>
              Приложение не использует сторонние аналитические системы, рекламные сети и не отправляет никаких данных на внешние серверы. Интернет-соединение не требуется и не используется.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>3. Разрешения</div>
            <div style={{ color: "var(--sub)" }}>
              Приложение запрашивает разрешение на отправку уведомлений исключительно для напоминаний о приёме лекарств. Никакие другие разрешения не запрашиваются.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>4. Удаление данных</div>
            <div style={{ color: "var(--sub)" }}>
              Все данные удаляются при удалении приложения с устройства.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal("none")}
          className="btn-primary"
        >
          Понятно
        </button>
      </ModalSheet>

      {/* MODAL: Terms of Use */}
      <ModalSheet
        isOpen={activeModal === "terms"}
        onClose={() => setActiveModal("none")}
        className="legal-modal"
      >
        <h3>Пользовательское соглашение</h3>

        <div style={{ fontSize: "13px", color: "var(--sub)", marginBottom: "16px" }}>
          Последнее обновление: 13 октября 2026
        </div>

        <div style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text)", display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>1. Назначение приложения</div>
            <div style={{ color: "var(--sub)" }}>
              Asthmatick — персональный трекер для отслеживания приступов астмы и контроля расписания приёма лекарств. Приложение не является медицинским продуктом и не предназначено для постановки диагнозов или замены консультации врача.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>2. Ответственность</div>
            <div style={{ color: "var(--sub)" }}>
              Разработчики приложения не несут ответственности за медицинские решения, принятые на основе данных из приложения. При любых вопросах о здоровье обращайтесь к квалифицированному медицинскому специалисту.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>3. Использование</div>
            <div style={{ color: "var(--sub)" }}>
              Используя приложение, вы соглашаетесь с условиями данного соглашения. Приложение предоставляется «как есть» без каких-либо гарантий работоспособности.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>4. Изменения</div>
            <div style={{ color: "var(--sub)" }}>
              Разработчик оставляет за собой право обновлять данное соглашение. Актуальная версия всегда доступна в разделе настроек приложения.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal("none")}
          className="btn-primary"
        >
          Понятно
        </button>
      </ModalSheet>
    </section>
  );
}
