let datosManuales = [];
let chartLDC;

// ======== CARGAR CSV o XLSX ========
document.getElementById("loadBtn").addEventListener("click", () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) {
    alert("Selecciona un archivo CSV o XLSX primero.");
    return;
  }

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".csv")) {
    // 📄 Si es CSV → usar PapaParse
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        manejarDatosCargados(results.data);
      }
    });
  } else if (fileName.endsWith(".xlsx")) {
    // 📘 Si es Excel → usar SheetJS
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      manejarDatosCargados(sheet);
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Formato no soportado. Usa un archivo CSV o XLSX.");
  }
});

// ======== FUNCIÓN GENERAL DE PROCESAMIENTO ========
function manejarDatosCargados(data) {
  const datos = data.map(d => ({
    Fecha: d.Fecha || d.fecha,
    Hora: parseInt(d.Hora || d.hora),
    Potencia_kW: parseFloat(d.Potencia_kW || d.potencia || d.Potencia)
  })).filter(d => !isNaN(d.Potencia_kW));

  if (datos.length === 0) {
    alert("No se encontraron datos válidos. Asegúrate de usar columnas: Fecha, Hora, Potencia_kW.");
    return;
  }

  datosManuales = datos;
  actualizarTablaManual();
  alert(`Archivo cargado correctamente (${datos.length} registros). Presiona 'Generar métricas y gráficas' para visualizar los resultados.`);
}


// ======== AGREGAR MANUAL ========
document.getElementById("addManualBtn").addEventListener("click", () => {
  const fecha = document.getElementById("manualFecha").value;
  const hora = document.getElementById("manualHora").value;
  const potencia = document.getElementById("manualPotencia").value;

  if (!fecha || hora === "" || potencia === "") {
    alert("Completa todos los campos.");
    return;
  }

  datosManuales.push({
    Fecha: fecha,
    Hora: parseInt(hora),
    Potencia_kW: parseFloat(potencia)
  });
  actualizarTablaManual();
});

// ======== GENERAR DATOS DE PRUEBA ========
document.getElementById("generateBtn").addEventListener("click", () => {
  datosManuales = generarDatosPrueba();
  actualizarTablaManual();
  alert("Datos de prueba generados. Presiona 'Generar métricas y gráficas'.");
});

// ======== LIMPIAR TODO ========
document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("¿Seguro que deseas limpiar todos los datos?")) {
    datosManuales = [];
    actualizarTablaManual();
    limpiarResultados();
  }
});

// ======== BOTÓN PARA PROCESAR DATOS ========
document.getElementById("processBtn").addEventListener("click", () => {
  if (datosManuales.length === 0) {
    alert("No hay datos para procesar.");
    return;
  }
  procesarYMostrar(datosManuales);
});

// ======== ACTUALIZA TABLA ========
function actualizarTablaManual() {
  const tbody = document.querySelector("#tablaManual tbody");
  tbody.innerHTML = "";

  datosManuales.forEach((d, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.Fecha}</td>
      <td>${d.Hora}</td>
      <td>
        <input type="number" class="form-control form-control-sm text-center" 
               value="${parseFloat(d.Potencia_kW).toFixed(2)}" 
               onchange="editarPotencia(${i}, this.value)">
      </td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="eliminarDato(${i})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ======== EDITAR O ELIMINAR DATOS ========
function eliminarDato(idx) {
  datosManuales.splice(idx, 1);
  actualizarTablaManual();
}

function editarPotencia(idx, nuevoValor) {
  const val = parseFloat(nuevoValor);
  if (isNaN(val) || val < 0) {
    alert("Introduce un valor de potencia válido.");
    return;
  }
  datosManuales[idx].Potencia_kW = val;
}

// ======== LIMPIAR RESULTADOS ========
function limpiarResultados() {
  document.getElementById("energiaTotal").textContent = "-";
  document.getElementById("potenciaMedia").textContent = "-";
  document.getElementById("potenciaPico").textContent = "-";
  if (chartLDC) {
    chartLDC.destroy();
    chartLDC = null;
  }
}

// ======== PROCESAR Y MOSTRAR ========
function procesarYMostrar(datos) {
  const resultado = procesarDatos(datos);
  if (!resultado) {
    alert("No se encontraron datos válidos de potencia.");
    return;
  }
  actualizarMetricas(resultado);
  graficarLDC(resultado);
}

function actualizarMetricas(r) {
  document.getElementById("energiaTotal").textContent = r.energiaTotal.toFixed(2);
  document.getElementById("potenciaMedia").textContent = r.potenciaMedia.toFixed(2);
  document.getElementById("potenciaPico").textContent = r.potenciaPico.toFixed(2);
}

function graficarLDC(r) {
  const ctx = document.getElementById("ldcChart").getContext("2d");
  if (chartLDC) chartLDC.destroy();

  chartLDC = new Chart(ctx, {
    type: "line",
    data: {
      labels: r.porcentaje,
      datasets: [{
        label: "Potencia (kW)",
        data: r.potenciasOrdenadas,
        borderColor: "#007bff",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.15
      }]
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          title: { display: true, text: "Duración (% del tiempo)" },
          ticks: { callback: v => v.toFixed(0) + "%" }
        },
        y: {
          title: { display: true, text: "Potencia (kW)" },
          ticks: { callback: v => v.toFixed(2) }
        }
      }
    }
  });
}
