import Papa from "papaparse";

export function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const critical = results.errors.find((e) => e.type !== "FieldMismatch");
          if (critical) return reject(new Error(`Error parseando CSV: ${critical.message}`));
        }
        if (results.data.length === 0) return reject(new Error("El CSV no contiene datos"));
        resolve(results.data);
      },
      error: (err) => reject(err),
    });
  });
}

export function parseCSVString(csvText: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  return result.data;
}
