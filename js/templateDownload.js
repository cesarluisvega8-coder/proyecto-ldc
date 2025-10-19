// templateDownload.js
// Lógica para descargar la plantilla de Excel
import { mostrarAlerta } from './utils.js';

export function descargarPlantilla() {
    const wb = XLSX.utils.book_new();
    const header = ['Item', 'Carga', 'Potencia (W)'];
    for (let h = 0; h < 24; h++) header.push(String(h));
    const wsData = [header];
    for (let i = 1; i <= 30; i++) {
        const row = [i, `Carga ${i}`, '', ...Array.from({ length: 24 }, () => 0)];
        wsData.push(row);
    }
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'LINEA BASE');
    XLSX.writeFile(wb, 'Plantilla_LINEA_BASE.xlsx');
    mostrarAlerta('Plantilla descargada: Plantilla_LINEA_BASE.xlsx', 'success');
}