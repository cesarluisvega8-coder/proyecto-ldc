function procesarDatos(datos) {
  if (!datos || datos.length === 0) return null;

  const potencias = datos
    .map(d => parseFloat(parseFloat(d.Potencia_kW).toFixed(2)))
    .filter(v => !isNaN(v));

  if (potencias.length === 0) return null;

  const energiaTotal = potencias.reduce((a, b) => a + b, 0);
  const potenciaMedia = energiaTotal / potencias.length;
  const potenciaPico = Math.max(...potencias);

  const potenciasOrdenadas = [...potencias].sort((a, b) => b - a);
  const total = potenciasOrdenadas.length;
  const porcentaje = potenciasOrdenadas.map((_, i) => (i / (total - 1)) * 100);

  return { energiaTotal, potenciaMedia, potenciaPico, potenciasOrdenadas, porcentaje };
}

function generarDatosPrueba() {
  const datos = [];
  const fechaBase = new Date(2025, 0, 1);
  for (let d = 0; d < 10; d++) {
    for (let h = 0; h < 24; h++) {
      const potencia = 5 + 3 * Math.sin((Math.PI * h) / 12) + Math.random() * 2;
      const fecha = new Date(fechaBase);
      fecha.setDate(fecha.getDate() + d);
      const fechaStr = fecha.toISOString().split("T")[0];
      datos.push({ Fecha: fechaStr, Hora: h, Potencia_kW: parseFloat(potencia.toFixed(2)) });
    }
  }
  return datos;
}
