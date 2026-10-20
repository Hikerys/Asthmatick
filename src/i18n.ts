import type { AppSettings } from "./types";

// Russian is the source copy used by the existing interface. Keep translations
// separate from saved user records so a language switch never changes their data.
const lines = `+15 мин|+15 min
+5 мин|+5 min
−15 мин|−15 min
−5 мин|−5 min
1. Назначение приложения|1. Purpose of the app
1. Хранение данных|1. Data storage
100% Локально|100% local
100% конфиденциальность|100% privacy
2. Ответственность|2. Responsibility
2. Сторонние сервисы|2. Third-party services
3. Использование|3. Use
3. Разрешения|3. Permissions
4. Изменения|4. Changes
4. Удаление данных|4. Data deletion
Asthmatick — персональный трекер для отслеживания приступов астмы и контроля расписания приёма лекарств. Приложение не является медицинским продуктом и не предназначено для постановки диагнозов или замены консультации врача.|Asthmatick is a personal tracker for asthma symptoms and medication schedules. It is not a medical device and cannot diagnose conditions or replace medical advice.
Asthmatick: Время по плану|Asthmatick: Scheduled time
Asthmatick: Тестовое напоминание|Asthmatick: Test reminder
Август|August
Апрель|April
Без разрешения «Будильники и напоминания» Android задерживает оповещения от 15 минут до нескольких часов в целях экономии батареи.|Without the Alarms & reminders permission, Android may delay alerts by 15 minutes or several hours to save battery.
Будни|Weekdays
Быстрые шаблоны|Quick presets
ВС|SU
ВТ|TU
Важное предупреждение|Important notice
Вернуть в запланированные|Mark as planned
Версия:|Version:
Включены (напоминания активны)|On (reminders active)
Включить напоминания|Enable reminders
Внимание: Зафиксировано удушье!|Warning: Severe breathing difficulty recorded!
Время|Time
Время приёма|Medication time
Вс|Sun
Все|Every day
Все ваши данные сохраняются исключительно локально на вашем устройстве.|All your data is stored only on your device.
Все данные приложения (расписание приёма, записи о приступах, заметки и настройки) хранятся исключительно локально на вашем устройстве. Мы не собираем, не передаём и не имеем доступа к вашим персональным данным.|All app data (medication schedules, symptom records, notes, and settings) is stored only on your device. We do not collect, share, or access your personal data.
Все данные удаляются при удалении приложения с устройства.|All data is deleted when you uninstall the app.
Всё в порядке. Продолжайте план.|All clear. Keep following your plan.
Вт|Tue
Вчера|Yesterday
Вы уверены, что хотите удалить эту запись?|Are you sure you want to delete this entry?
Выберите мелодию для напоминаний. Нажмите, чтобы прослушать:|Choose a reminder sound. Tap to preview:
Выберите резервную копию Asthmatick в формате SQLite (.db). Текущие записи будут заменены данными из файла.|Choose an Asthmatick SQLite backup (.db). Current entries will be replaced with the file's data.
Выбор времени|Choose time
Выбор даты|Choose date
Выбор тяжести и фиксация времени|Choose severity and record time
Выбрать|Select
Выбрать дату|Select date
Выбрать дату конца|Select end date
Выбрать дату начала|Select start date
Выбрать файл .db с устройства|Choose a .db file
Выполнено|Completed
Выраженная одышка|Moderate shortness of breath
Глубокая тёмная палитра|Deep dark palette
Готово|Done
Готово к экспорту:|Ready to export:
Далее|Next
Данное приложение не является медицинским продуктом и служит исключительно для трекера и контроля расписания.|This app is not a medical device. It is intended only for tracking and scheduling.
Данное приложение не является медицинским продуктом и служит только для трекера и дневника.|This app is not a medical device. It is intended only as a tracker and diary.
Дата|Date
Дата конца|End date
Дата начала|Start date
Декабрь|December
Дней с приступами:|Days with symptoms:
Дни недели (|Days of the week (
Добавить|Add
Добро пожаловать в Asthmatick|Welcome to Asthmatick
Доброе утро!|Good morning!
Доброй ночи!|Good night!
Добрый вечер!|Good evening!
Добрый день!|Good afternoon!
Дозировка, после еды, примечание|Dose, after meals, notes
Дополнительные детали или самочувствие|Additional details or how you feel
Ещё запланировано сегодня:|Still planned today:
За выбранный период|In selected period
Завтра|Tomorrow
Заголовок / описание события|Title / event description
Загрузить из резервной копии|Restore from backup
Закрыть|Close
Заметка|Note
Заметка (необязательно)|Note (optional)
Заметка / принятые меры (необязательно)|Notes / actions taken (optional)
Заметок:|Notes:
Запланировано|Planned
Зафиксирована выраженная одышка.|Moderate shortness of breath recorded.
Зафиксирована легкая одышка.|Mild shortness of breath recorded.
Зафиксировано приступов:|Symptoms recorded:
Зафиксировать|Record
Зафиксировать приступ / состояние|Record symptom / condition
Звук уведомления|Notification sound
Импорт SQLite доступен в приложении Android.|SQLite import is available in the Android app.
Импорт базы данных|Import database
Импортировать данные|Import data
Используя приложение, вы соглашаетесь с условиями данного соглашения. Приложение предоставляется «как есть» без каких-либо гарантий работоспособности.|By using the app, you agree to these terms. The app is provided as is, without warranties.
Июль|July
Июнь|June
Как в системе (MD3)|Follow system (MD3)
Календарь|Calendar
Классическая бирюзовая палитра|Classic teal palette
Колокольчик|Chime
Легкая одышка|Mild shortness of breath
Легкое|Mild
Легкое (Легкая одышка)|Mild (shortness of breath)
Легкое состояние|Mild condition
Лёгкие|Mild
Лёгкий бриз|Gentle breeze
Май|May
Маримба|Marimba
Март|March
Медицинский отказ:|Medical disclaimer:
Месяц|Month
Мой день|My day
Мягкий переливающийся звон|Soft shimmering chime
На сегодня расписание пусто|Nothing scheduled today
Нажмите кнопку «+» ниже, чтобы добавить приём лекарств, зафиксировать состояние или сделать заметку.|Tap + below to add medication, record a symptom, or write a note.
Назад|Back
Название|Title
Название или лекарство|Title or medication
Напоминания доставляются точно минута в минуту, даже в режиме энергосбережения и блокировки.|Reminders arrive on time, even in battery-saving mode and when the phone is locked.
Напоминания и оповещения|Reminders and alerts
Напоминания о приёме лекарств и ингаляций|Medication and inhaler reminders
Например: Пробежка, холодный воздух|For example: Running, cold air
Например: Прогулка на свежем воздухе|For example: A walk outdoors
Например: Респисальф|For example: Inhaler
Настройка времени и дней недели приёма|Set medication time and days
Настройки|Settings
Настройте стрелками или выберите быстрый шаблон|Use the arrows or choose a preset
Начать|Get started
Не удалось сохранить данные. Проверьте свободное место и перезапустите приложение.|Could not save data. Check available storage and restart the app.
Неделя|Week
Нет завершённых приёмов|No completed doses
Нет записей и приступов на выбранный день.|No entries or symptoms for this day.
Новая заметка|New note
Ноябрь|November
О приложении|About
О приложении и версия|App information and version
Октябрь|October
Оповещения о приёме лекарств по плану|Scheduled medication alerts
Отмена|Cancel
Ошибка импорта: выберите корректную копию Asthmatick .db.|Import error: choose a valid Asthmatick .db backup.
Ошибка экспорта:|Export error:
ПН|MO
ПТ|FR
Период статистики|Statistics period
Пн|Mon
По|To
По обоям телефона (Material You)|Match wallpaper (Material You)
Повторить вступительную инструкцию|Show introduction again
Подробности (необязательно)|Details (optional)
Пока нет завершённых приёмов|No completed doses yet
Политика конфиденциальности|Privacy policy
Пользовательское соглашение|Terms of use
Пометить выполненным|Mark as completed
Понятно|Got it
Последнее обновление: 13 октября 2026|Last updated: October 13, 2026
Предпочтения|Preferences
Предыдущий месяц|Previous month
Предыдущий период|Previous period
Прибавить минуту|Add one minute
Прибавить час|Add one hour
Приложение запрашивает разрешение на отправку уведомлений исключительно для напоминаний о приёме лекарств. Никакие другие разрешения не запрашиваются.|The app requests notification permission only for medication reminders. It requests no other permissions.
Приложение не использует сторонние аналитические системы, рекламные сети и не отправляет никаких данных на внешние серверы. Интернет-соединение не требуется и не используется.|The app uses no third-party analytics or ads and sends no data to external servers. An internet connection is not needed.
Примечание / Описание|Note / Description
Приступ / Состояние|Symptom / Condition
Приступ астмы|Asthma attack
Приступы|Symptoms
Причина / триггер (необязательно)|Cause / trigger (optional)
Приёмы по расписанию|Scheduled doses
Пропущено|Missed
Пропущено (время приёма истекло)|Missed (time window expired)
Простая заметка|Simple note
Пт|Fri
Разработчик оставляет за собой право обновлять данное соглашение. Актуальная версия всегда доступна в разделе настроек приложения.|The developer may update these terms. The current version is always available in the app settings.
Разработчики приложения не несут ответственности за медицинские решения, принятые на основе данных из приложения. При любых вопросах о здоровье обращайтесь к квалифицированному медицинскому специалисту.|The developers are not responsible for medical decisions based on app data. Consult a qualified healthcare professional about any health concerns.
Разрешить «Будильники и напоминания»|Allow Alarms & reminders
Расписание приёма:|Medication schedule:
Редактировать|Edit
Редактировать заметку|Edit note
Редактировать событие|Edit event
Редактировать состояние|Edit condition
Резервное копирование|Backup
С|From
СБ|SA
СР|WE
Самочувствие, комментарий, детали|How you feel, comments, details
Самочувствие, комментарий, пикфлоуметрия|Wellbeing, comments, peak flow
Сб|Sat
Светлая|Light
Свой период|Custom range
Сегодня|Today
Сентябрь|September
Системный|System
Системный звук|System sound
Следуйте плану — дышите легче|Follow your plan, breathe easier
Следующий месяц|Next month
Следующий период|Next period
Смахните вниз для закрытия|Swipe down to close
Событие в расписание|Schedule an event
Событие возвращено в запланированные.|Event returned to planned.
Событие расписания|Scheduled event
События на этот день (|Events for this day (
Сохранение отменено.|Save cancelled.
Сохранить|Save
Сохранить на устройство (|Save to device (
Сохранить файл .db|Save .db file
Спокойное гармоничное созвучие|Calm, harmonious sound
Справочная информация|Information
Ср|Wed
Среднее|Moderate
Среднее (Выраженная одышка)|Moderate (shortness of breath)
Среднее состояние|Moderate condition
Средние|Moderate
Стандартный сигнал вашего устройства|Your device's default sound
Статистика|Statistics
Статус|Status
Тема приложения|App theme
Точные будильники не разрешены|Exact alarms not allowed
Точные напоминания активны|Exact reminders active
Трекер приступов и дневник астмы|Asthma tracker and diary
Тяжелое|Severe
Тяжелое (Удушье)|Severe (choking)
Тяжелое состояние|Severe condition
Тяжесть|Severity
Тяжесть состояния|Symptom severity
Тяжёлые|Severe
Тёмная|Dark
Тёплый акустический тон|Warm acoustic tone
Убавить минуту|Subtract one minute
Убавить час|Subtract one hour
Уведомление от Asthmatick: Проверка напоминаний успешна!|Asthmatick notification: Reminders work!
Уведомления|Notifications
Удалить|Delete
Удобный и надёжный трекер расписания и контроля приступов астмы.|A simple, reliable medication and asthma symptom tracker.
Удушье|Severe breathing difficulty
Укажите корректный период: дата начала должна быть раньше даты конца.|Choose a valid range: the start date must be before the end date.
Учитываются записи текущего расписания с даты их создания. Удалённые записи в статистику не входят.|Statistics include current scheduled entries from their creation date. Deleted entries are excluded.
Февраль|February
Фоновая работа:|Background activity:
Хранение данных:|Data storage:
ЧТ|TH
Чт|Thu
Что вы хотите добавить?|What would you like to add?
Чтобы Android (особенно на устройствах Xiaomi, Samsung, Huawei) не откладывал напоминания, отключите «Оптимизацию батареи» и разрешите автозапуск / фоновую активность для Asthmatick в настройках телефона.|To avoid delayed reminders on Android (especially Xiaomi, Samsung, and Huawei), disable battery optimization and allow Asthmatick to start automatically and run in the background.
Чёткий современный двойной сигнал|Clear modern double tone
Шаг 1 из 3|Step 1 of 3
Шаг 2 из 3|Step 2 of 3
Шаг 3 из 3|Step 3 of 3
Экспорт SQLite доступен в приложении Android.|SQLite export is available in the Android app.
Экспорт базы данных|Export database
Экспортировать данные|Export data
Электронный сигнал|Digital tone
Январь|January
выполнено|completed
записей)|entries)
из 7)|of 7)
минуты|minutes
планируется|planned
пропущено|missed
часы|hours
⏱️ Сейчас|⏱️ Now
⏳ Запланировано|⏳ Planned
☀️ День 13:00|☀️ Afternoon 13:00
✓ База данных восстановлена.|✓ Database restored.
✓ Выполнено|✓ Completed
✓ Резервная копия SQLite сохранена.|✓ SQLite backup saved.
🌅 Утро 08:00|🌅 Morning 08:00
🌆 Вечер 19:00|🌆 Evening 19:00
🌙 На ночь 22:00|🌙 Bedtime 22:00
🔔 Отправить тестовое уведомление|🔔 Send test notification
🔔 Проверить текущий звук уведомлением|🔔 Test current sound with a notification`;

const english = new Map(lines.split("\n").map((line) => {
  const separator = line.indexOf("|");
  return [line.slice(0, separator), line.slice(separator + 1)] as const;
}));

export function getLocale(language: AppSettings["language"]): string {
  return language === "en" ? "en-US" : "ru-RU";
}

export function currentLocale(): string {
  return document.documentElement.lang === "en" ? "en-US" : "ru-RU";
}

export function translate(source: string, language: AppSettings["language"]): string {
  if (language === "ru") return source;
  const trimmed = source.trim();
  if (!trimmed) return source;
  let result = english.get(trimmed);
  if (!result) {
    // Interpolated labels are assembled by React as one text node.
    const patterns: [RegExp, (...matches: string[]) => string][] = [
      [/^Сегодня, (\d+) (.+)$/u, (_, day, month) => `Today, ${day} ${translate(month, "en")}`],
      [/^(\d+) (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)$/iu, (_, day, month) => `${day} ${new Date(2026, ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"].indexOf(month.toLowerCase()), 1).toLocaleDateString("en-US", { month: "long" })}`],
      [/^Шаг (\d+) из (\d+)$/u, (_, step, total) => `Step ${step} of ${total}`],
      [/^✓ Выполнено в (.+)!$/u, (_, time) => `✓ Completed at ${time}!`],
      [/^Еще слишком рано! Отметить выполнение можно с (.+) по (.+)$/u, (_, start, end) => `Too early! You can mark this complete from ${start} to ${end}`],
      [/^Время выполнения пропущено! Отметить можно было только до (.+)$/u, (_, time) => `Missed! You could mark this complete until ${time}`],
      [/^Выполнено (\d+)% приёмов$/u, (_, percent) => `${percent}% of doses completed`],
      [/^Сохранить на устройство \((\d+) записей\)$/u, (_, count) => `Save to device (${count} entries)`],
      [/^Дни недели \((\d+) из 7\)$/u, (_, count) => `Days of the week (${count} of 7)`],
      [/^События на этот день \((\d+)\)$/u, (_, count) => `Events for this day (${count})`],
      [/^Напоминания \((.+)\)$/u, (_, sound) => `Reminders (${translate(sound, "en")})`],
      [/^Звук: (.+)\. Уведомления успешно работают!$/u, (_, sound) => `Sound: ${translate(sound, "en")}. Notifications are working!`],
      [/^✓ Выполнено в (.+) \(по плану: (.+)\)$/u, (_, time, scheduled) => `✓ Completed at ${time} (scheduled: ${scheduled})`],
      [/^❌ Пропущено \(доступно было до (.+)\)$/u, (_, time) => `❌ Missed (available until ${time})`],
      [/^⏳ Запланировано \(доступно с (.+) до (.+)\)$/u, (_, start, end) => `⏳ Planned (available ${start}–${end})`],
    ];
    for (const [pattern, replace] of patterns) {
      const match = trimmed.match(pattern);
      if (match) { result = replace(...match); break; }
    }
  }
  if (!result) return source;
  return source.replace(trimmed, result);
}

type TextTranslation = { original: string; rendered: string };
const textCache = new WeakMap<Text, TextTranslation>();
const attributeCache = new WeakMap<Element, Map<string, TextTranslation>>();
const attributes = ["aria-label", "title", "placeholder"];

/** Translate UI copy after React commits, including sheets rendered in portals. */
export function observeTranslations(root: Element, language: AppSettings["language"]): () => void {
  let currentLanguage = language;
  const visit = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const current = text.data;
      const old = textCache.get(text);
      const original = old && current === old.rendered ? old.original : current;
      const rendered = translate(original, currentLanguage);
      textCache.set(text, { original, rendered });
      if (current !== rendered) text.data = rendered;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    let stored = attributeCache.get(element);
    if (!stored) { stored = new Map(); attributeCache.set(element, stored); }
    for (const name of attributes) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const old = stored.get(name);
      const original = old && current === old.rendered ? old.original : current;
      const rendered = translate(original, currentLanguage);
      stored.set(name, { original, rendered });
      if (current !== rendered) element.setAttribute(name, rendered);
    }
    element.childNodes.forEach(visit);
  };
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") visit(mutation.target);
      else if (mutation.type === "attributes") visit(mutation.target);
      else mutation.addedNodes.forEach(visit);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  visit(root);
  return () => observer.disconnect();
}
