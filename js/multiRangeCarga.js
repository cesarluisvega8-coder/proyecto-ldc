// Lógica para formulario de cargas con múltiples rangos horarios
// Este módulo exporta funciones para manejar el array de rangos y la UI del modal

export function crearModalRangosCarga({onGuardar}) {
    // Crea y muestra el modal, retorna promesa con los rangos definidos
    // onGuardar(rangosArray) se llama al guardar
    // ...implementación en mainApp.js
}

export function calcularEnergiaMultiRango(potencia, rangos) {
    // potencia en W, rangos: [{inicio, fin}]
    let totalHoras = 0;
    rangos.forEach(r => {
        let h = r.fin - r.inicio;
        if (h < 0) h += 24;
        totalHoras += h;
    });
    return (potencia/1000) * totalHoras;
}
