import { registerPlugin, Capacitor } from "@capacitor/core";

export interface FilePickerExportPluginInterface {
  exportFile(options: {
    filename: string;
    data: string;
    mimeType?: string;
  }): Promise<{ success: boolean; uri?: string; cancelled?: boolean }>;
}

export const FilePickerExport = registerPlugin<FilePickerExportPluginInterface>(
  "FilePickerExport"
);

export async function exportDatabaseFile(
  filename: string,
  dataString: string
): Promise<{ success: boolean; cancelled?: boolean; message?: string }> {
  // 1. If running as Capacitor native app (Android)
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await FilePickerExport.exportFile({
        filename,
        data: dataString,
        mimeType: "application/json",
      });
      if (res.success) {
        return { success: true, message: "Файл успешно сохранён на устройство!" };
      }
      if (res.cancelled) {
        return { success: false, cancelled: true, message: "Выбор директории отменён." };
      }
    } catch (err: any) {
      console.warn("Native FilePickerExport failed:", err);
      // Fallback to web approach if native plugin failed
    }
  }

  // 2. Browser with File System Access API (allows picking folder & saving file)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: "Резервная копия JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(dataString);
      await writable.close();
      return { success: true, message: "Файл успешно сохранён в выбранную папку!" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, cancelled: true, message: "Выбор папки отменён." };
      }
      console.warn("showSaveFilePicker failed:", err);
    }
  }

  // 3. Fallback: Browser direct blob download via anchor
  try {
    const blob = new Blob([dataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true, message: `Файл отправлен на скачивание: ${filename}` };
  } catch (err: any) {
    return {
      success: false,
      message: "Не удалось сохранить файл: " + (err?.message || err),
    };
  }
}
