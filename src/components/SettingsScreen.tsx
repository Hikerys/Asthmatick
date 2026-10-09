import React, { useState, useRef } from "react";
import { AppSettings, DatabaseBackup, NotificationSound, APP_VERSION } from "../types";
import {
  createDatabaseBackup,
  restoreDatabaseBackup,
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
import { exportDatabaseFile } from "../filePickerExport";
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
    "none" | "notifications" | "sound" | "theme" | "info" | "export" | "import"
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
  const [importJsonText, setImportJsonText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const schedCount = loadScheduleEvents().length;
  const attackCount = loadAttacks().length;
  const notesCount = loadNotes().length;
  const totalCount = schedCount + attackCount + notesCount;
  const backupFilename = `asthmatick_backup_${new Date().toISOString().slice(0, 10)}.json`;

  const handleCopyExportJson = async () => {
    try {
      const backup = createDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      await navigator.clipboard.writeText(jsonStr);
      setExportNotice("✓ Данные скопированы в буфер обмена!");
      setTimeout(() => setExportNotice(null), 3500);
    } catch (err) {
      setExportNotice("Ошибка копирования в буфер обмена.");
    }
  };

  const handleExportToFile = async () => {
    try {
      const backup = createDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const res = await exportDatabaseFile(backupFilename, jsonStr);
      if (res.message) {
        setExportNotice(res.message);
      }
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      setExportNotice("Ошибка при сохранении файла: " + (err?.message || err));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        processImportJson(text);
      } catch (err) {
        setImportStatus("Ошибка чтения файла резервной копии.");
      }
    };
    reader.readAsText(file);
  };

  const processImportJson = (text: string) => {
    try {
      const parsed: DatabaseBackup = JSON.parse(text);
      if (!parsed.packageId || parsed.packageId !== "app.asthma.tick") {
        if (!confirm("Файл не помечен как резервная копия Asthmatick. Всё равно восстановить данные?")) {
          return;
        }
      }
      const success = restoreDatabaseBackup(parsed);
      if (success) {
        setImportStatus("✓ База данных успешно восстановлена!");
        onDataRestored();
        setTimeout(() => {
          setActiveModal("none");
          setImportStatus(null);
          setImportJsonText("");
        }, 1500);
      } else {
        setImportStatus("Ошибка: поврежденная структура данных.");
      }
    } catch (err) {
      setImportStatus("Ошибка: некорректный JSON формат.");
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

  const handleSetTheme = (theme: "light" | "dark") => {
    const updated: AppSettings = { ...settings, theme };
    saveSettings(updated);
    onUpdateSettings(updated);
    setTimeout(() => setActiveModal("none"), 300);
  };

  const handleSetSound = (sound: NotificationSound) => {
    playSoundPreview(sound);
    const updated: AppSettings = { ...settings, notificationSound: sound };
    saveSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <section className="screen set on" id="set">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json,application/json"
        className="hidden"
      />

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
          <div>{settings.theme === "dark" ? "Тёмная" : "Светлая"}</div>
        </div>
        <ChevronRightIcon />
      </div>

      {/* 3. Импортировать данные */}
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

      {/* 4. Экспортировать данные */}
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

      {/* 5. Справочная информация */}
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
          <div>О приложении</div>
        </div>
        <ChevronRightIcon />
      </div>

      {/* MODAL: Theme Sheet (Matching AsthmatickDesign.html) */}
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
          <span>Светлая</span>
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
          <span>Тёмная</span>
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
            <div style={{ fontWeight: 700, fontSize: "16px" }}>Включить напоминания</div>
            <div style={{ fontSize: "13px", color: "var(--sub)", marginTop: "2px" }}>
              Оповещения о приёме лекарств по плану
            </div>
          </div>
          <span className={`r ${notificationGranted ? "on" : ""}`} style={{ background: notificationGranted ? "var(--teal)" : "transparent", borderColor: notificationGranted ? "var(--teal)" : "var(--sub)" }}>
            {notificationGranted && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", display: "block" }} />}
          </span>
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
            Скачать файл на устройства
          </button>

          <button
            type="button"
            onClick={handleCopyExportJson}
            className="btn-secondary"
          >
            Скопировать JSON в буфер обмена
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
          Выберите файл резервной копии .json или вставьте текст ниже:
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
          style={{ marginBottom: "14px" }}
        >
          Выбрать файл .json с устройства
        </button>

        <div className="form-group">
          <label className="form-label">Или вставьте JSON текст:</label>
          <textarea
            rows={3}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Вставьте сюда скопированный JSON код..."
            className="form-textarea"
            style={{ fontSize: "13px" }}
          />
        </div>

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

        {importJsonText.trim().length > 0 && (
          <button
            type="button"
            onClick={() => processImportJson(importJsonText)}
            className="btn-primary"
            style={{ marginBottom: "8px" }}
          >
            Восстановить из вставленного текста
          </button>
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
    </section>
  );
}
