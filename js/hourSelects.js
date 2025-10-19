// hourSelects.js
// Lógica para llenar y manejar selects de horas

export function llenarSelectHoras(selectInicio, selectFin, totalInput) {
    selectInicio.innerHTML = '';
    selectFin.innerHTML = '';
    for (let h = 0; h <= 24; h++) {
        const label = h.toString().padStart(2, '0') + ':00';
        const opt1 = document.createElement('option');
        opt1.value = h;
        opt1.textContent = label;
        const opt2 = opt1.cloneNode(true);
        selectInicio.appendChild(opt1);
        selectFin.appendChild(opt2);
    }
    selectInicio.value = '0';
    selectFin.value = '1';
    if (totalInput) totalInput.value = '1.00';
}

export function actualizarTotalInterfaz(selectInicio, selectFin, totalInput) {
    const hi = parseFloat(selectInicio.value);
    const hf = parseFloat(selectFin.value);
    if (isNaN(hi) || isNaN(hf)) {
        if (totalInput) totalInput.value = '';
        return;
    }
    let dur = hf - hi;
    if (dur < 0) dur += 24;
    if (hi === 0 && hf === 24) dur = 24;
    if (totalInput) totalInput.value = dur.toFixed(2);
}