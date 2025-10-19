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

export function crearFilaTabla(itemIndex, obj, datosManuales, actualizarTablaManual, mostrarAlerta) {
    const tr = document.createElement('tr');
    const potencia = Number(obj.Potencia_W || 0);
    const hi = Number(obj.HoraInicio || 0);
    const hf = Number(obj.HoraFin || 0);
    const dur = Number(obj.HorasEncendido || 0);
    const ener = Number(obj.Energia_kWh || 0);

    tr.innerHTML = `
      <td>${itemIndex + 1}</td>
      <td style="min-width:160px"><input class="form-control form-control-sm" data-field="Carga" value="${escapeHtml(String(obj.Carga||''))}"></td>
      <td><input class="form-control form-control-sm" type="number" step="any" data-field="Potencia_W" value="${potencia}"></td>
      <td>
        <select class="form-select form-select-sm" data-field="HoraInicio">${buildHourOptions(hi)}</select>
      </td>
      <td>
        <select class="form-select form-select-sm" data-field="HoraFin">${buildHourOptions(hf)}</select>
      </td>
      <td><input class="form-control form-control-sm text-center" data-field="HorasEncendido" value="${dur.toFixed(2)}" readonly></td>
      <td><input class="form-control form-control-sm text-end" data-field="Energia_kWh" value="${ener.toFixed(3)}" readonly></td>
      <td><button class="btn btn-sm btn-danger btn-remove">🗑</button></td>
    `;

    // attach listeners for inputs & selects
    const inputs = tr.querySelectorAll('input[data-field], select[data-field]');
    inputs.forEach(inp => {
        inp.addEventListener('change', () => {
            const cargaVal = tr.querySelector('input[data-field="Carga"]').value.trim() || 'Sin nombre';
            const potVal = parseFloat(tr.querySelector('input[data-field="Potencia_W"]').value) || 0;
            const hiVal = parseFloat(tr.querySelector('select[data-field="HoraInicio"]').value) || 0;
            const hfVal = parseFloat(tr.querySelector('select[data-field="HoraFin"]').value) || 0;
            let durVal = hfVal - hiVal;
            if (durVal < 0) durVal += 24;
            if (hiVal === 0 && hfVal === 24) durVal = 24;
            const enVal = (potVal / 1000) * durVal;
            datosManuales[itemIndex].Carga = cargaVal;
            datosManuales[itemIndex].Potencia_W = potVal;
            datosManuales[itemIndex].HoraInicio = hiVal;
            datosManuales[itemIndex].HoraFin = hfVal;
            datosManuales[itemIndex].HorasEncendido = Number(durVal);
            datosManuales[itemIndex].Energia_kWh = Number(enVal);
            tr.querySelector('input[data-field="HorasEncendido"]').value = durVal.toFixed(2);
            tr.querySelector('input[data-field="Energia_kWh"]').value = enVal.toFixed(3);
        });
    });

    tr.querySelector('.btn-remove').addEventListener('click', () => {
        datosManuales.splice(itemIndex, 1);
        actualizarTablaManual();
        mostrarAlerta('Carga eliminada.', 'info');
    });

    return tr;
}

export function actualizarTablaManual(tbody, datosManuales, crearFilaTabla, mostrarAlerta) {
    tbody.innerHTML = '';
    if (datosManuales.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="8" class="text-muted">Sin registros — agrega datos manualmente o carga un archivo</td>`;
        tbody.appendChild(tr);
        return;
    }
    datosManuales.forEach((d, i) => {
        const fila = crearFilaTabla(i, d, datosManuales, () => actualizarTablaManual(tbody, datosManuales, crearFilaTabla, mostrarAlerta), mostrarAlerta);
        tbody.appendChild(fila);
    });
}