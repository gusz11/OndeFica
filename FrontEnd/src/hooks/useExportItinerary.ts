import { useState } from "react";
import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { File } from "expo-file-system";
import type { ItineraryItem } from "../types/models";
import type { Summary } from "../utils/itinerary";
import { itineraryHtml } from "../utils/pdf";

export function useExportItinerary() {
  const [exporting, setExporting] = useState(false);
  const exportPdf = async (
    items: ItineraryItem[],
    summary: Summary,
    tripName?: string,
  ): Promise<void> => {
    if (exporting || items.length === 0) return;
    setExporting(true);
    let uri: string | undefined;
    try {
      const html = itineraryHtml(items, summary, tripName);
      if (Platform.OS === "web") {
        await Print.printAsync({ html });
        return;
      }
      if (!(await Sharing.isAvailableAsync()))
        throw new Error("Compartilhamento indisponível neste dispositivo.");
      const result = await Print.printToFileAsync({ html });
      uri = result.uri;
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar programação",
        UTI: ".pdf",
      });
    } finally {
      // Exported itineraries are personal data: remove our temporary file after sharing.
      if (uri) {
        try {
          new File(uri).delete();
        } catch {
          /* OS may already have removed the temporary file. */
        }
      }
      setExporting(false);
    }
  };
  return { exporting, exportPdf };
}
