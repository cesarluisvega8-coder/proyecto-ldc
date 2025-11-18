// tableHelpers.js
// Funciones para crear y actualizar la tabla de cargas manuales

import { escapeHtml } from './utils.js';

export function buildHourOptions(selected) {
    let s = '';
    for (let h = 0; h <= 24; h++) {
        const label = h.toString().padStart(2, '0') + ':00';
        s += `<option value="${h}" ${h === Number(selected) ? 'selected' : ''}>${label}</option>`;
    }
    return s;
}

export function crearFilaTabla(itemIndex, obj, datosManuales, actualizarTablaManual, mostrarAlerta, onEditRanges) {
    const tr = document.createElement('tr');
    const potencia = Number(obj.Potencia_W || 0);
    const hi = (obj.HoraInicio !== undefined && obj.HoraInicio !== null) ? Number(obj.HoraInicio) : null;
    const hf = (obj.HoraFin !== undefined && obj.HoraFin !== null) ? Number(obj.HoraFin) : null;
    const dur = Number(obj.HorasEncendido || 0);
    const ener = Number(obj.Energia_kWh || 0);
    const tipo = String(obj.Tipo_carga || '').trim();
    // Mostrar Rangos como texto si existen.
    // Si no hay Rangos: solo mostrar selects cuando existen HoraInicio/HoraFin; de lo contrario dejar en blanco.
    let horariosHtml = '';
    if (Array.isArray(obj.Rangos) && obj.Rangos.length > 0) {
        horariosHtml = `<div class="text-start small">${obj.Rangos.map(r=>String(r.inicio).padStart(2,'0')+':00-'+String(r.fin).padStart(2,'0')+':00').join(', ')}</div>`;
    } else if (hi !== null && hf !== null) {
        horariosHtml = `<div class="d-flex align-items-center gap-1">`
            + `<select class="form-select form-select-sm" data-field="HoraInicio">${buildHourOptions(hi)}</select>`
            + `<select class="form-select form-select-sm" data-field="HoraFin">${buildHourOptions(hf)}</select>`
            + `</div>`;
    } else {
        horariosHtml = `<div class="text-start small text-muted"></div>`; // vacío cuando no hay horario definido
    }

    tr.innerHTML = `
        <td>${itemIndex + 1}</td>
        <td style="min-width:160px"><input class="form-control form-control-sm" data-field="Carga" value="${escapeHtml(String(obj.Carga||''))}"></td>
        <td style="min-width:150px"><input class="form-control form-control-sm" data-field="Tipo_carga" placeholder="Tipo (opcional)" value="${escapeHtml(tipo)}"></td>
        <td><input class="form-control form-control-sm" type="number" step="any" data-field="Potencia_W" value="${potencia}"></td>
        <td class="text-start">${horariosHtml}</td>
        <td><input class="form-control form-control-sm text-center" data-field="HorasEncendido" value="${dur.toFixed(2)}" readonly></td>
        <td><input class="form-control form-control-sm text-end" data-field="Energia_kWh" value="${ener.toFixed(3)}" readonly></td>
        <td>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary btn-edit-ranges">✏️</button>
                <button class="btn btn-sm btn-danger btn-remove">🗑</button>
            </div>
        </td>
    `;

    // attach listeners for inputs & selects
    const inputs = tr.querySelectorAll('input[data-field], select[data-field]');
    inputs.forEach(inp => {
        inp.addEventListener('change', () => {
            const cargaVal = tr.querySelector('input[data-field="Carga"]').value.trim() || 'Sin nombre';
            const tipoVal = tr.querySelector('input[data-field="Tipo_carga"]').value.trim();
            const potVal = parseFloat(tr.querySelector('input[data-field="Potencia_W"]').value) || 0;
            // if there's a select HoraInicio in row
            const hiSelect = tr.querySelector('select[data-field="HoraInicio"]');
            const hfSelect = tr.querySelector('select[data-field="HoraFin"]');
            let hiVal = hiSelect ? parseFloat(hiSelect.value) || 0 : null;
            let hfVal = hfSelect ? parseFloat(hfSelect.value) || 0 : null;
            let durVal = Number(obj.HorasEncendido) || 0;
            if (hiSelect && hfSelect) {
                durVal = hfVal - hiVal;
                if (durVal < 0) durVal += 24;
                if (hiVal === 0 && hfVal === 24) durVal = 24;
            }
            const enVal = (potVal / 1000) * durVal;
            datosManuales[itemIndex].Carga = cargaVal;
            datosManuales[itemIndex].Tipo_carga = tipoVal;
            datosManuales[itemIndex].Potencia_W = potVal;
            if (hiSelect && hfSelect) {
                datosManuales[itemIndex].HoraInicio = hiVal;
                datosManuales[itemIndex].HoraFin = hfVal;
                datosManuales[itemIndex].HorasEncendido = Number(durVal);
                datosManuales[itemIndex].Energia_kWh = Number(enVal);
            }
            tr.querySelector('input[data-field="HorasEncendido"]').value = durVal.toFixed(2);
            tr.querySelector('input[data-field="Energia_kWh"]').value = enVal.toFixed(3);
        });
    });

    tr.querySelector('.btn-remove').addEventListener('click', () => {
        datosManuales.splice(itemIndex, 1);
        actualizarTablaManual();
        mostrarAlerta('Carga eliminada.', 'info');
    });

    const editRangesBtn = tr.querySelector('.btn-edit-ranges');
    if(editRangesBtn){
        editRangesBtn.addEventListener('click', async ()=>{
            if(typeof onEditRanges === 'function'){
                // pass current ranges (if any) to the modal handler in mainApp
                await onEditRanges(itemIndex);
                // after editing, refresh table
                actualizarTablaManual();
            } else {
                mostrarAlerta('Editor de rangos no disponible.', 'error');
            }
        });
    }

    return tr;
}

export function actualizarTablaManual(tbody, datosManuales, crearFilaTabla, mostrarAlerta, onEditRanges, filterFn) {
    tbody.innerHTML = '';
    const predicate = typeof filterFn === 'function' ? filterFn : () => true;
    const anyVisible = datosManuales.some(d => predicate(d));
    if (datosManuales.length === 0 || !anyVisible) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-muted">Sin registros — agrega datos manualmente o carga un archivo</td>`;
        tbody.appendChild(tr);
        return;
    }
    datosManuales.forEach((d, i) => {
        if (!predicate(d)) return;
        const fila = crearFilaTabla(
            i,
            d,
            datosManuales,
            () => actualizarTablaManual(tbody, datosManuales, crearFilaTabla, mostrarAlerta, onEditRanges, filterFn),
            mostrarAlerta,
            onEditRanges
        );
        tbody.appendChild(fila);
    });
}