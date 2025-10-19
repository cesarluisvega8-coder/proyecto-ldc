// manualEntry.js
// Lógica para agregar entradas manuales a datosManuales

export function addManualEntry(datosManuales, nombre, potencia, hi, hf, actualizarTablaManual, mostrarAlerta) {
    if (!nombre || isNaN(potencia) || isNaN(hi) || isNaN(hf)) {
        mostrarAlerta('Completa todos los campos con valores válidos.', 'error');
        return false;
    }
    let dur = hf - hi;
    if (dur < 0) dur += 24;
    if (hi === 0 && hf === 24) dur = 24;
    const energia = (potencia / 1000) * dur;
    datosManuales.push({
        Carga: nombre,
        Potencia_W: Number(potencia),
        HoraInicio: Number(hi),
        HoraFin: Number(hf),
        HorasEncendido: Number(dur),
        Energia_kWh: Number(energia)
    });
    actualizarTablaManual();
    mostrarAlerta('Carga agregada correctamente.', 'success');
    return true;
}