// templateDownload.js
// Lógica para descargar la plantilla de Excel
import { mostrarAlerta } from './utils.js';

export function descargarPlantilla() {
    // Ruta relativa para que funcione en GitHub Pages y en cualquier hosting estático
    const url = new URL('./assets/Plantilla_Lista_de_cargas.xlsx', window.location.href).toString();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Lista_de_cargas.xlsx'; // sugerencia de nombre (algunos navegadores pueden ignorarlo)
    document.body.appendChild(a);
    a.click();
    a.remove();
    mostrarAlerta('Plantilla descargada: Plantilla_Lista_de_cargas.xlsx', 'success');
}