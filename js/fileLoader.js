// fileLoader.js
// Lógica para cargar archivos (xlsx/csv) y procesar matrices como LINEA BASE
import { mostrarAlerta } from './utils.js';

export async function handleFileLoad(inputFile, datosManuales, actualizarTablaManual) {
    const f = inputFile.files[0];
    if (!f) {
        mostrarAlerta('Selecciona un archivo .xlsx/.csv primero.', 'error');
        return;
    }
    const name = f.name.toLowerCase();
    try {
        if (name.endsWith('.csv')) {
            const text = await f.text();
            const rows = text.split(/\r\n|\n/).map(r => r.split(','));
            procesarMatrizComoLineaBase(rows, datosManuales, actualizarTablaManual);
        } else {
            const ab = await f.arrayBuffer();
            const workbook = XLSX.read(ab, { type: 'array' });
            const sheetName = workbook.SheetNames.includes('LINEA BASE') ? 'LINEA BASE' : workbook.SheetNames[0];
            const ws = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
            procesarMatrizComoLineaBase(rows, datosManuales, actualizarTablaManual);
        }
    } catch (err) {
        console.error(err);
        mostrarAlerta('Error leyendo archivo. Revisa formato.', 'error');
    }
}

export function procesarMatrizComoLineaBase(rows, datosManuales, actualizarTablaManual) {
    let headerIndex = -1;
    for (let i = 0; i < Math.min(8, rows.length); i++) {
        const r = rows[i].map(c => (c || '').toString().trim().toLowerCase());
        if (r.includes('carga') && (r.includes('potencia') || r.includes('potencia (w)'))) {
            headerIndex = i;
            break;
        }
    }
    if (headerIndex === -1) headerIndex = 0;
    const headers = (rows[headerIndex] || []).map(h => (h || '').toString().trim());
    const idxCarga = headers.findIndex(h => /carga/i.test(h));
    const idxPot = headers.findIndex(h => /potencia/i.test(h));
    const idxHoras = [];
    headers.forEach((h, i) => {
        if (/^\s*(\d|1\d|2[0-3])\s*$/.test(String(h))) idxHoras.push(i);
    });
    if (idxHoras.length === 0 && idxPot !== -1) {
        for (let k = idxPot + 1; k < headers.length && idxHoras.length < 24; k++) idxHoras.push(k);
    }
    if (idxCarga === -1 || idxPot === -1 || idxHoras.length === 0) {
        mostrarAlerta('No se encontraron encabezados válidos (Carga/Potencia/0..23).', 'error');
        console.warn('Encabezados detectados:', headers);
        return;
    }
    const parsed = [];
    for (let r = headerIndex + 1; r < rows.length; r++) {
        const fila = rows[r];
        if (!fila || fila.length === 0) continue;
        const nombre = fila[idxCarga];
        if (!nombre) continue;
        const potRaw = String(fila[idxPot] || '').replace(/\s/g, '').replace(',', '.');
        const potencia = Number(potRaw) || 0;
        let horasEncendido = 0;
        idxHoras.forEach(ci => {
            const v = fila[ci];
            if (v === 1 || v === '1' || String(v).trim().toLowerCase() === 'x' || String(v).trim().toLowerCase() === 'on') horasEncendido++;
        });
        const energia = (potencia / 1000) * horasEncendido;
        parsed.push({
            Carga: String(nombre),
            Potencia_W: potencia,
            HorasEncendido: horasEncendido,
            Energia_kWh: energia,
            HoraInicio: 0,
            HoraFin: 0
        });
    }
    if (parsed.length === 0) {
        mostrarAlerta('No se encontraron filas válidas en el archivo.', 'error');
        return;
    }
    datosManuales.length = 0;
    parsed.forEach(p => datosManuales.push(p));
    actualizarTablaManual();
    mostrarAlerta(`Archivo procesado: ${parsed.length} cargas importadas.`, 'success');
}