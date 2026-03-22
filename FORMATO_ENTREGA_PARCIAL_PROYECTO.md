# FORMATO DE ENTREGA PARCIAL DE PROYECTO CULMINANTE

## Información General del Proyecto (portada)

**Nombre del proyecto:** Solanlyze - Cuadro de Carga y Análisis Energético

**Programa académico:** Ingeniería Eléctrica / Ingeniería de Sistemas

**Asesor disciplinar:** [Por completar]

**Asesor metodológico:** [Por completar]

**Integrantes del equipo:**
- [Nombre completo 1] - [Código estudiantil]
- [Nombre completo 2] - [Código estudiantil]
- [Nombre completo 3] - [Código estudiantil]

**Institución:** [Nombre de la institución educativa]

**Fecha de entrega:** 15 de marzo de 2026

---

## 1. Introducción

Solanlyze es una aplicación web innovadora desarrollada para facilitar la construcción y análisis de cuadros de carga eléctrica, permitiendo a usuarios visualizar patrones de consumo energético mediante gráficas interactivas y exportables. El proyecto surge de la necesidad crítica de simplificar el análisis energético en residencias y pequeños negocios, donde tradicionalmente se requieren conocimientos técnicos avanzados y software costoso.

La plataforma ofrece una interfaz intuitiva que permite ingresar datos de consumo eléctrico a través de múltiples métodos (plantillas Excel, ingreso manual, selección de electrodomésticos predefinidos) y genera automáticamente visualizaciones profesionales como cuadros de carga (LDC), mapas de calor y curvas de consumo temporal. 

El problema central que aborda el proyecto es la barrera técnica y económica que enfrentan los usuarios para analizar su consumo energético, resultando en ineficiencias, costos elevados y falta de conciencia sobre patrones de uso. Solanlyze democratiza el acceso a herramientas de análisis energético profesional, permitiendo tomar decisiones informadas para optimizar el consumo y reducir costos.

Este documento presenta la estructura completa del proyecto, incluyendo la formulación del problema, marco teórico-técnico, objetivos, metodología de desarrollo, y resultados esperados, proporcionando una visión integral de la solución tecnológica propuesta.

---

## 2. Formulación del Problema

### 2.1 Descripción del problema

El análisis de consumo energético eléctrico representa un desafío significativo para usuarios residenciales y pequeñas empresas en el contexto actual de eficiencia energética y sostenibilidad. La situación problemática se manifiesta en múltiples dimensiones:

**Contexto actual:**
- Las herramientas comerciales disponibles requieren licencias costosas (ETAP, DIgSILENT con costos superiores a $10,000)
- El software académico como MATLAB demanda conocimientos avanzados de programación
- Los métodos manuales son propensos a errores y requieren tiempo considerable
- Existe una brecha digital en el análisis energético entre profesionales y usuarios finales

**Situación problemática:**
Los usuarios carecen de acceso a herramientas que permitan:
- Visualizar patrones de consumo horario
- Identificar picos de demanda y optimizar su uso
- Generar informes técnicos para toma de decisiones
- Simular escenarios de consumo y ahorro

**Consecuencias:**
- Facturas eléctricas elevadas por falta de optimización
- Desconocimiento de oportunidades de ahorro energético
- Ineficiencias en el uso de equipos eléctricos
- Barreras para la adopción de energías renovables

**Evidencia del problema:**
Estudios demuestran que los hogares podrían reducir entre 15-25% su consumo eléctrico con análisis adecuados, pero menos del 5% tiene acceso a herramientas profesionales.

### 2.2 Justificación

El desarrollo de Solanlyze es fundamental por múltiples razones:

**Importancia técnica:**
- Democratiza el análisis energético profesional
- Implementa algoritmos estándar de la industria eléctrica
- Proporciona precisión en cálculos de consumo y demanda

**Impacto socioeconómico:**
- **Beneficiarios directos:** Hogares, pequeñas empresas, estudiantes, técnicos
- **Ahorro económico:** Potencial reducción del 15-25% en facturas eléctricas
- **Accesibilidad:** Gratuito y sin requerimientos de instalación
- **Escalabilidad:** Adaptable a diferentes contextos geográficos

**Relevancia ambiental:**
- Promueve consumo consciente y eficiente
- Contribuye a la reducción de huella de carbono
- Facilita la transición hacia energías renovables
- Apuesta objetivos de desarrollo sostenible (ODS 7: Energía asequible y no contaminante)

**Innovación tecnológica:**
- Primera herramienta web gratuita con análisis completo LDC
- Integración de IA para asistencia al usuario
- Interfaz intuitiva sin sacrificing capacidades técnicas
- Funcionamiento offline y multiplataforma

### 2.3 Pregunta del proyecto o problema central

**¿Cómo desarrollar una plataforma web accesible y gratuita que permita a usuarios sin conocimientos técnicos especializados realizar análisis completos de consumo energético mediante cuadros de carga y visualizaciones interactivas para optimizar el uso de electricidad en residencias y pequeños negocios?**

---

## 3. Marco Teórico – Técnico

### 3.1 Conceptos teóricos relevantes

**Cuadro de Carga (LDC - Load Duration Curve):**
El cuadro de carga es una herramienta fundamental en ingeniería eléctrica que representa la potencia demandada ordenada según su duración en el tiempo. Permite identificar:
- Potencia máxima demandada
- Duración de diferentes niveles de carga
- Factor de carga del sistema
- Oportunidades de gestión de demanda

**Perfil Horario de Consumo:**
Representación del consumo energético a lo largo de las 24 horas del día, permitiendo identificar:
- Horas pico y valle
- Patrones de comportamiento del usuario
- Correlación con actividades diarias
- Oportunidades de desplazamiento de carga

**Métricas Energéticas Clave:**
- **Energía consumida (kWh):** Integración temporal de la potencia
- **Potencia media:** Consumo promedio en un período determinado
- **Potencia pico:** Máxima demanda instantánea
- **Factor de carga:** Relación entre consumo promedio y máximo

**Mapa de Calor Energético:**
Visualización matricial que muestra patrones de consumo mediante codificación de colores, facilitando la identificación visual de:
- Zonas de alto consumo
- Patrones temporales
- Correlaciones entre cargas

### 3.2 Antecedentes o trabajos relacionados

**Software Comercial:**
- **ETAP:** Herramienta líder con costos >$10,000, enfocada en proyectos industriales
- **DIgSILENT PowerFactory:** Solución académica/comercial con curva de aprendizaje elevada
- **SKM Power Tools:** Software especializado para ingenieros eléctricos

**Herramientas Académicas:**
- **MATLAB/Simulink:** Plataforma versátil pero requiere programación avanzada
- **PSAT (Power System Analysis Toolbox):** Herramienta gratuita pero compleja
- **OpenDSS:** Software de código abierto para análisis de distribución

**Aplicaciones Comerciales Modernas:**
- **Sense Energy Monitor:** Sistema hardware + software para monitoreo en tiempo real
- **Neurio:** Dispositivo IoT con análisis básico de consumo
- **Smappee:** Plataforma comercial con enfoque en automatización

**Proyectos Open Source:**
- **OpenEnergyMonitor:** Enfoque en hardware y medición
- **Energy-Plus:** Simulación energética de edificios
- **PVWatts:** Calculadora solar de NREL

**Innovación de Solanlyze:**
A diferencia de las soluciones existentes, Solanlyze combina:
- Accesibilidad web sin instalación
- Análisis profesional completo
- Interfaz intuitiva para no técnicos
- Gratuidad total
- Funcionamiento offline

### 3.3 Marco técnico o tecnológico

**Arquitectura Frontend:**
- **HTML5:** Estructura semántica y accesibilidad
- **CSS3:** Estilos modernos con animaciones y temas
- **JavaScript ES6+:** Lógica de programación modular

**Framework UI y Diseño:**
- **Bootstrap 5.3.3:** Sistema de diseño responsivo
- **Google Fonts (Inter, Outfit):** Tipografía moderna y legible
- **CSS Grid/Flexbox:** Layouts adaptables

**Visualización de Datos:**
- **Chart.js 4.4.0:** Gráficas interactivas (LDC, consumo temporal)
- **Plotly 2.30.0:** Mapas de calor avanzados
- **Canvas API:** Renderizado optimizado de gráficas

**Procesamiento de Datos:**
- **SheetJS (XLSX):** Lectura y escritura de archivos Excel
- **Algoritmos propios:** Cálculo de métricas energéticas
- **LocalStorage:** Persistencia de datos del usuario

**Exportación y Reportes:**
- **jsPDF:** Generación de documentos PDF
- **html2canvas:** Captura de gráficas como imágenes
- **Blob API:** Manejo de archivos en el navegador

**Inteligencia Artificial:**
- **Chatbase:** Chatbot para asistencia al usuario
- **Procesamiento natural:** Respuestas contextualizadas

**Optimización y Rendimiento:**
- **Lazy Loading:** Carga diferida de componentes
- **Debouncing/Throttling:** Optimización de eventos
- **Service Workers:** Funcionamiento offline

**Herramientas de Desarrollo:**
- **Git:** Control de versiones
- **GitHub:** Hosting y colaboración
- **VS Code:** Entorno de desarrollo
- **Chrome DevTools:** Depuración y optimización

---

## 4. Objetivos del Proyecto

### 4.1 Objetivo General

Desarrollar una aplicación web accesible, gratuita y profesional que permita realizar análisis completos de consumo energético mediante cuadros de carga, visualizaciones interactivas y generación de informes técnicos, democratizando el acceso a herramientas de análisis energético para usuarios sin conocimientos técnicos especializados.

### 4.2 Objetivos Específicos

1. **Diseñar e implementar una interfaz intuitiva y accesible** que permita el ingreso de datos de consumo eléctrico mediante múltiples métodos (plantillas Excel, ingreso manual, selección de electrodomésticos predefinidos) garantizando una experiencia de usuario satisfactoria.

2. **Desarrollar algoritmos de procesamiento y cálculo** para determinar métricas energéticas precisas incluyendo consumo diario/mensual/anual, potencia media y pico, factor de carga, y energía acumulada por tipo de carga.

3. **Crear visualizaciones interactivas y profesionales** implementando cuadros de carga LDC, mapas de calor energéticos y curvas de consumo temporal con capacidad de filtrado por períodos y tipos de carga.

4. **Implementar un sistema completo de exportación** que permita generar informes técnicos en PDF y gráficas en PNG con formato profesional, incluyendo métricas por perfil horario y análisis comparativos.

5. **Integrar características avanzadas de usabilidad** incluyendo tema claro/oscuro, asistencia mediante chatbot con IA, análisis por perfiles horarios personalizados, y funcionamiento offline para máxima accesibilidad.

---

## 5. Alcances y Limitaciones

### 5.1 Alcances

**Análisis Energético Completo:**
- Cálculo de cuadros de carga (LDC) para períodos diarios, mensuales y anuales
- Determinación de potencia pico, media y energía consumida
- Análisis por perfiles horarios (día/noche/personalizado)
- Identificación de patrones de consumo y oportunidades de optimización

**Métodos de Ingreso de Datos:**
- **Plantillas Excel:** Importación desde archivos .xlsx con formato predefinido
- **Ingreso Manual:** Formularios intuitivos para agregar cargas individuales
- **Galería de Electrodomésticos:** Selección rápida de equipos comunes con potencias preconfiguradas
- **Edición y Eliminación:** Modificación dinámica de datos ingresados

**Visualizaciones Profesionales:**
- **Cuadro de Carga LDC:** Curvas de duración de carga con análisis por período
- **Mapas de Calor:** Representación matricial de consumo temporal
- **Consumo Temporal:** Gráficas lineales con múltiples modos de visualización
- **Métricas por Perfil:** Análisis filtrado por franjas horarias específicas

**Sistema de Exportación:**
- **Informes PDF:** Generación de reportes completos con portada y análisis
- **Gráficas PNG:** Exportación individual de visualizaciones
- **Datos en Excel:** Descarga de tablas con métricas calculadas
- **Formato Profesional:** Diseño optimizado para presentaciones técnicas

**Características de Usabilidad:**
- **Diseño Responsivo:** Compatible con dispositivos móviles y escritorio
- **Tema Claro/Oscuro:** Adaptación automática a preferencias del usuario
- **Asistencia Inteligente:** Chatbot con IA para guía en tiempo real
- **Funcionamiento Offline:** Operación sin conexión a internet
- **Multiidioma:** Interfaz completamente en español

**Aspectos Técnicos:**
- **Rendimiento Optimizado:** Procesamiento eficiente de grandes volúmenes de datos
- **Accesibilidad:** Cumplimiento de estándares WCAG para inclusión
- **Seguridad:** Procesamiento local de datos sin envío a servidores externos
- **Compatibilidad:** Funcionamiento en navegadores modernos (Chrome, Edge, Firefox)

### 5.2 Limitaciones

**Limitaciones Técnicas:**
- **Dependencia del Navegador:** Requiere navegadores modernos con soporte JavaScript ES6+
- **Procesamiento Local:** Limitado por capacidad computacional del dispositivo del usuario
- **Almacenamiento:** Restringido a LocalStorage (aproximadamente 5-10 MB)
- **Precisión Numérica:** Limitaciones de punto flotante en cálculos complejos

**Limitaciones Funcionales:**
- **Sistemas Eléctricos:** Enfoque en sistemas monofásicos residenciales y pequeños comerciales
- **Complejidad:** No maneja sistemas trifásicos complejos o instalaciones industriales grandes
- **Datos Históricos:** No integra con medidores inteligentes o datos en tiempo real
- **Simulación Avanzada:** Limitada a análisis básicos sin modelado detallado de redes

**Limitaciones de Usuario:**
- **Conocimientos Técnicos:** Requiere comprensión básica de conceptos eléctricos
- **Precisión de Datos:** Calidad del análisis depende de exactitud de información ingresada
- **Idioma:** Actualmente disponible solo en español
- **Accesibilidad:** Algunas funcionalidades pueden requerir capacidades visuales

**Limitaciones de Infraestructura:**
- **Conexión a Internet:** Necesaria para carga inicial de dependencias y chatbot
- **Actualizaciones:** Requiere conexión para actualizaciones de seguridad y funcionalidades
- **Soporte Técnico:** Limitado a documentación y chatbot, sin soporte humano directo
- **Integración:** No se integra con sistemas de gestión energética existentes

**Limitaciones de Escalabilidad:**
- **Concurrencia:** Limitado por capacidades del navegador individual
- **Base de Usuarios:** No maneja múltiples usuarios con datos compartidos
- **Colaboración:** Sin funcionalidades de trabajo en equipo
- **Empresarial:** No adaptado para implementaciones corporativas grandes

---

## 6. Metodología

### 6.1 Etapas del proyecto

**Etapa 1: Investigación y Análisis de Requisitos (Semanas 1-2)**
- **Análisis de necesidades:** Identificación de problemas reales de usuarios mediante entrevistas y encuestas
- **Estudio de mercado:** Investigación de soluciones existentes y análisis competitivo
- **Definición de requisitos:** Especificación funcional y no funcional del sistema
- **Análisis técnico:** Evaluación de tecnologías y arquitectura apropiada
- **Validación:** Presentación de propuesta a stakeholders y recolección de feedback

**Etapa 2: Diseño de Arquitectura y UI/UX (Semanas 3-4)**
- **Arquitectura técnica:** Definición de estructura modular y patrones de diseño
- **Diseño de interfaz:** Creación de wireframes, mockups y prototipos interactivos
- **Experiencia de usuario:** Definición de flujos de navegación y interacciones
- **Diseño visual:** Selección de paleta de colores, tipografía y componentes
- **Pruebas de usabilidad:** Evaluación de prototipos con usuarios potenciales

**Etapa 3: Desarrollo del Core Funcional (Semanas 5-8)**
- **Configuración del entorno:** Preparación de herramientas de desarrollo y control de versiones
- **Módulo de datos:** Implementación de ingreso, validación y almacenamiento de datos
- **Algoritmos de cálculo:** Desarrollo de motor de procesamiento energético
- **Gestión de archivos:** Implementación de importación/exportación Excel
- **Validación:** Pruebas unitarias y de integración de funcionalidades básicas

**Etapa 4: Desarrollo de Visualizaciones (Semanas 9-10)**
- **Integración Chart.js:** Configuración y personalización de librería de gráficas
- **Desarrollo LDC:** Implementación de cuadros de carga con múltiples períodos
- **Mapas de calor:** Integración Plotly para visualizaciones matriciales
- **Gráficas temporales:** Desarrollo de curvas de consumo con modos múltiples
- **Interactividad:** Implementación de filtros, zoom y herramientas de análisis

**Etapa 5: Características Avanzadas (Semanas 11-12)**
- **Sistema de exportación:** Desarrollo de generación PDF y captura de gráficas
- **Análisis por perfiles:** Implementación de métricas horarias personalizadas
- **Tema dinámico:** Desarrollo de modo claro/oscuro con persistencia
- **Chatbot integración:** Configuración y personalización de asistente IA
- **Optimización:** Mejora de rendimiento y experiencia de usuario

**Etapa 6: Pruebas y Optimización (Semanas 13-14)**
- **Pruebas funcionales:** Verificación completa de todas las funcionalidades
- **Pruebas de compatibilidad:** Validación en múltiples navegadores y dispositivos
- **Pruebas de rendimiento:** Optimización de tiempos de carga y procesamiento
- **Pruebas de usabilidad:** Evaluación final con usuarios reales
- **Corrección de errores:** Solución de bugs identificados durante testing

**Etapa 7: Documentación y Despliegue (Semanas 15-16)**
- **Documentación técnica:** Elaboración de README y código comentado
- **Manual de usuario:** Creación de guía completa en formato HTML
- **Preparación de despliegue:** Configuración de GitHub Pages y optimización
- **Lanzamiento:** Publicación oficial y promoción inicial
- **Monitoreo:** Seguimiento de uso y recolección de feedback inicial

**Etapa 8: Evaluación y Mejora Continua (Semana 17)**
- **Análisis de resultados:** Evaluación de objetivos cumplidos vs. planeados
- **Lecciones aprendidas:** Documentación de experiencias y mejoras
- **Plan de mantenimiento:** Definición de roadmap futuro
- **Presentación final:** Entrega de proyecto culminante

### 6.2 Herramientas y técnicas

**Metodología de Desarrollo:**
- **Desarrollo Ágil:** Iteraciones cortas con entregas incrementales
- **Scrum adaptado:** Sprints de 2 semanas con planificación y retrospectiva
- **Kanban:** Visualización de flujo de trabajo y limitación de trabajo en progreso
- **Continuous Integration:** Integración y pruebas automáticas con cada cambio

**Control de Versiones y Colaboración:**
- **Git:** Sistema de control de versiones distribuido
- **GitHub:** Plataforma de hosting y colaboración
- **Branching Strategy:** Flujo GitFlow con ramas feature, develop, master
- **Pull Requests:** Revisión de código antes de integración

**Herramientas de Desarrollo:**
- **VS Code:** Entorno de desarrollo integrado con extensiones especializadas
- **Chrome DevTools:** Depuración, profiling y análisis de rendimiento
- **Postman:** Pruebas de APIs y endpoints externos
- **Figma:** Diseño y prototipado de interfaces

**Testing y Calidad:**
- **Pruebas manuales:** Exploración funcional en múltiples escenarios
- **Pruebas cruzadas:** Validación en Chrome, Firefox, Edge, Safari
- **Pruebas responsivas:** Verificación en móviles, tablets, escritorio
- **Análisis de rendimiento:** Google PageSpeed Insights y Lighthouse

**Documentación:**
- **Markdown:** Formato ligero para documentación técnica
- **README.md:** Documentación principal del proyecto
- **HTML/CSS:** Manual de usuario interactivo
- **Comentarios de código:** Documentación inline para mantenibilidad

**Despliegue y Distribución:**
- **GitHub Pages:** Hosting gratuito para sitios estáticos
- **GitHub Actions:** Automatización de despliegue continuo
- **CDN:** Distribución de contenido para mejor rendimiento
- **Dominio personalizado:** Configuración de URL profesional

**Monitoreo y Análisis:**
- **Google Analytics:** Análisis de tráfico y uso de la aplicación
- **GitHub Insights:** Métricas de actividad del repositorio
- **User feedback:** Recolección de comentarios y sugerencias
- **Performance monitoring:** Seguimiento de tiempos de carga

---

## 7. Cronograma preliminar

| Actividad | Semana 1 | Semana 2 | Semana 3 | Semana 4 | Semana 5 | Semana 6 | Semana 7 | Semana 8 | Semana 9 | Semana 10 | Semana 11 | Semana 12 | Semana 13 | Semana 14 | Semana 15 | Semana 16 | Semana 17 |
|-----------|----------|----------|----------|----------|----------|----------|----------|----------|----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|-----------|
| **Investigación y Requisitos** | ████ | ████ | | | | | | | | | | | | | | | |
| **Diseño UI/UX y Arquitectura** | | | ████ | ████ | | | | | | | | | | | | | |
| **Desarrollo Core Funcional** | | | | | ████ | ████ | ████ | ████ | | | | | | | | | |
| **Desarrollo Visualizaciones** | | | | | | | | | ████ | ████ | | | | | | | |
| **Características Avanzadas** | | | | | | | | | | | ████ | ████ | | | | | |
| **Pruebas y Optimización** | | | | | | | | | | | | | ████ | ████ | | | |
| **Documentación y Despliegue** | | | | | | | | | | | | | | | | ████ | ████ |
| **Evaluación Final** | | | | | | | | | | | | | | | | | ████ |

**Hitos Principales:**
- **Semana 2:** Entrega de especificaciones de requisitos completas
- **Semana 4:** Aprobación de diseño UI/UX y arquitectura técnica
- **Semana 8:** Versión funcional con core básico operativo
- **Semana 10:** Visualizaciones principales implementadas y funcionando
- **Semana 12:** Versión beta completa con todas las características
- **Semana 14:** Producto final probado y optimizado
- **Semana 16:** Lanzamiento oficial y documentación completa
- **Semana 17:** Evaluación final y presentación del proyecto

**Entregables por Etapa:**
- **Etapa 1:** Documento de requisitos, análisis competitivo
- **Etapa 2:** Mockups, prototipos interactivos, arquitectura técnica
- **Etapa 3:** Módulo de datos funcional, algoritmos de cálculo
- **Etapa 4:** Visualizaciones interactivas operativas
- **Etapa 5:** Sistema completo con características avanzadas
- **Etapa 6:** Informe de pruebas, producto optimizado
- **Etapa 7:** Documentación completa, sitio publicado
- **Etapa 8:** Presentación final, lecciones aprendidas

---

## 8. Presupuesto

### 8.1 Recursos Humanos

**Personal Técnico:**
- **Desarrollador Full Stack Senior:** 160 horas × $25/hora = $4,000
- **Diseñador UI/UX:** 40 horas × $30/hora = $1,200
- **Ingeniero Eléctrico Consultor:** 20 horas × $35/hora = $700
- **Tester QA:** 30 horas × $20/hora = $600

**Subtotal Recursos Humanos:** $6,500

### 8.2 Recursos Tecnológicos

**Software y Licencias:**
- **Suite Adobe Creative Cloud:** $50/mes × 4 meses = $200
- **Herramientas de desarrollo:** $100 (licencias varias)
- **Dominio personalizado:** $15/año
- **Certificado SSL:** $50/año

**Infraestructura:**
- **GitHub Pro:** $4/mes × 4 meses = $16
- **Servicios en la nube (APIs adicionales):** $100
- **Backup y almacenamiento:** $50

**Subtotal Recursos Tecnológicos:** $531

### 8.3 Recursos Operativos

**Costos Operativos:**
- **Internet y comunicaciones:** $100
- **Materiales de oficina:** $50
- **Capacitación y cursos:** $200
- **Transporte y viáticos:** $150

**Subtotal Recursos Operativos:** $500

### 8.4 Presupuesto Detallado

| Categoría | Concepto | Cantidad | Costo Unitario | Costo Total |
|-----------|----------|----------|----------------|-------------|
| **Personal** | Desarrollador Senior | 160 horas | $25/hora | $4,000 |
| | Diseñador UI/UX | 40 horas | $30/hora | $1,200 |
| | Ingeniero Consultor | 20 horas | $35/hora | $700 |
| | Tester QA | 30 horas | $20/hora | $600 |
| **Software** | Adobe Creative Cloud | 4 meses | $50/mes | $200 |
| | Herramientas desarrollo | Vario | - | $100 |
| **Infraestructura** | Dominio .com | 1 año | $15/año | $15 |
| | Certificado SSL | 1 año | $50/año | $50 |
| | GitHub Pro | 4 meses | $4/mes | $16 |
| | APIs externas | - | - | $100 |
| **Operativos** | Internet | 4 meses | $25/mes | $100 |
| | Materiales oficina | - | - | $50 |
| | Capacitación | - | - | $200 |
| | Transporte | - | - | $150 |
| **Subtotal** | | | | **$7,481** |

### 8.5 Resumen Presupuestario

**Costos Directos:** $7,481
- Recursos Humanos: $6,500 (86.9%)
- Recursos Tecnológicos: $531 (7.1%)
- Recursos Operativos: $450 (6.0%)

**Contingencia (10%):** $748
- Imprevistos y cambios en alcance
- Ajustes en precios de licencias
- Tiempo adicional de desarrollo

**Total del Proyecto:** $8,229

### 8.6 Análisis de Costo-Beneficio

**Inversión:** $8,229
**Beneficios Esperados:**
- **Impacto Social:** Democratización del análisis energético
- **Beneficio Económico Usuarios:** Ahorro potencial del 15-25% en facturas
- **Retorno Académico:** Proyecto culminante de alto impacto
- **Portafolio Profesional:** Pieza destacada para equipo desarrollador

**Sostenibilidad:**
- **Costos mantenimiento:** $100/año (dominio, hosting)
- **Actualizaciones:** Desarrollo voluntario del equipo
- **Escalabilidad:** Modelo gratuito con opciones premium futuras

---

## 9. Bibliografía

### 9.1 Referencias Técnicas y Normativas

**Estándares IEEE:**
- IEEE Standard 1159-2019. "IEEE Recommended Practice for Monitoring Electric Power Quality." IEEE, 2019.
- IEEE Std 141-1993. "IEEE Recommended Practice for Electric Power Distribution for Industrial Plants." IEEE, 1993.
- IEEE Std 241-1990. "IEEE Recommended Practice for Electric Power Systems in Commercial Buildings." IEEE, 1990.

**Normativas IEC:**
- IEC 61000-4-30:2015. "Electromagnetic compatibility (EMC) - Testing and measurement techniques - Power quality measurement methods." International Electrotechnical Commission, 2015.
- IEC 60870-5-103:1997. "Telecontrol equipment and systems - Part 5-103: Transmission protocols - Companion standard for the informative interface of protection equipment." IEC, 1997.

### 9.2 Libros de Referencia en Ingeniería Eléctrica

**Análisis de Sistemas de Potencia:**
- Grainger, J. J., & Stevenson, W. D. (2016). "Power System Analysis." McGraw-Hill Education, 6th Edition.
- El-Hawary, M. E. (2018). "Electrical Energy Systems." CRC Press, 2nd Edition.
- Glover, J. D., Sarma, M. S., & Overbye, T. J. (2016). "Power System Analysis and Design." Cengage Learning, 6th Edition.

**Calidad de Energía:**
- Dugan, R. C., McGranaghan, M. F., & Beaty, H. W. (2012). "Electrical Power Systems Quality." McGraw-Hill Professional, 3rd Edition.
- Bollen, M. H. J. (2000). "Understanding Power Quality Problems: Voltage Sags and Interruptions." Wiley-IEEE Press.

### 9.3 Referencias de Desarrollo Web y Tecnologías

**Documentación Técnica:**
- Mozilla Developer Network. "JavaScript Reference." https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference
- Bootstrap Documentation. "Bootstrap 5.3.3." https://getbootstrap.com/docs/5.3/
- Chart.js Documentation. "Chart.js 4.4.0." https://www.chartjs.org/docs/latest/
- Plotly JavaScript Documentation. "Plotly.js 2.30.0." https://plotly.com/javascript/

**Libros de Desarrollo Web:**
- Flanagan, D. (2020). "JavaScript: The Definitive Guide." O'Reilly Media, 7th Edition.
- Resig, J., Bibeault, B., & Maras, J. (2016). "Learning jQuery Fourth Edition." Packt Publishing.
- Duckett, J. (2019). "HTML and CSS: Design and Build Websites." Wiley.

### 9.4 Referencias de Análisis Energético y Eficiencia

**Investigaciones Académicas:**
- International Energy Agency (IEA). (2023). "World Energy Outlook 2023." IEA Publications.
- U.S. Department of Energy. (2022). "Building Energy Data Book." DOE/EERE-2022.
- Pérez-Lombard, L., Ortiz, J., & Pout, C. (2008). "A review on buildings energy consumption information." Energy and Buildings, 40(3), 394-398.

**Guías Prácticas:**
- ASHRAE. (2019). "ASHRAE Handbook—HVAC Applications." American Society of Heating, Refrigerating and Air-Conditioning Engineers.
- U.S. Energy Information Administration. "Residential Energy Consumption Survey (RECS)." https://www.eia.gov/consumption/residential/

### 9.5 Referencias de Diseño y Experiencia de Usuario

**Diseño UI/UX:**
- Norman, D. (2013). "The Design of Everyday Things." Basic Books, Revised and Expanded Edition.
- Krug, S. (2014). "Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability." New Riders, 3rd Edition.
- Nielsen Norman Group. "Usability Guidelines." https://www.nngroup.com/articles/

**Visualización de Datos:**
- Tufte, E. R. (2001). "The Visual Display of Quantitative Information." Graphics Press, 2nd Edition.
- Few, S. (2012). "Show Me the Numbers: Designing Tables and Graphs to Enlighten." Analytics Press, 2nd Edition.

### 9.6 Referencias de Metodología y Gestión de Proyectos

**Metodologías Ágiles:**
- Schwaber, K., & Sutherland, J. (2020). "The Scrum Guide." https://scrumguides.org/
- Cohn, M. (2005). "Agile Estimating and Planning." Prentice Hall.
- Beck, K., & Andres, C. (2004). "Extreme Programming Explained: Embrace Change." Addison-Wesley, 2nd Edition.

**Gestión de Proyectos:**
- Project Management Institute. (2021). "A Guide to the Project Management Body of Knowledge (PMBOK® Guide)." PMI, 7th Edition.
- Kerzner, H. (2017). "Project Management: A Systems Approach to Planning, Scheduling, and Controlling." Wiley, 12th Edition.

### 9.7 Recursos en Línea y Documentación

**Herramientas y Librerías:**
- SheetJS Documentation. "SheetJS Community Edition." https://docs.sheetjs.com/
- jsPDF Documentation. "jsPDF." https://rawgit.com/MrRio/jsPDF/master/
- html2canvas Documentation. "html2canvas." https://html2canvas.hertzen.com/

**Comunidades y Foros:**
- Stack Overflow. "JavaScript and Web Development Questions." https://stackoverflow.com/
- GitHub. "Open Source Projects and Documentation." https://github.com/
- MDN Web Docs. "Web Technology Documentation." https://developer.mozilla.org/

### 9.8 Estudios de Caso y Proyectos Relacionados

**Proyectos Open Source:**
- OpenEnergyMonitor Project. "Energy Monitoring and Visualization." https://openenergymonitor.org/
- PVWatts Calculator. NREL. https://pvwatts.nrel.gov/
- Energy-Plus Building Simulation. U.S. Department of Energy. https://energyplus.net/

**Artículos de Investigación:**
- Zhou, Y., et al. (2021). "A review of electric power consumption forecasting tools." Energy and AI, 4, 100058.
- Wang, F., et al. (2020). "Residential energy consumption patterns: A review." Renewable and Sustainable Energy Reviews, 132, 110089.

---

**Total de páginas estimadas:** 12-15 páginas

**Formato:** Documento profesional con estructura clara para presentación académica y evaluación de proyecto culminante.
