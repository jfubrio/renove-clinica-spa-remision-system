
Built by https://www.blackbox.ai

---

# RENOVÉ CLÍNICA & SPA - Sistema de Notas de Remisión

## Proyecto Overview
RENOVÉ es un sistema de notas de remisión diseñado para clínicas y spas. Se enfoca en facilitar la gestión de pacientes, tratamientos y pagos, ofreciendo una interfaz amigable con opciones de impresión y generación de informes en PDF.

## Instalación
Para instalar el proyecto localmente, sigue estos pasos:

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu_usuario/renove_clinica_spa.git
   ```
   
2. **Navega al directorio del proyecto:**
   ```bash
   cd renove_clinica_spa
   ```

3. **Abre el archivo `index.html` en tu navegador:**
   No es necesario un entorno servidor, solo necesitas abrir el archivo HTML.

## Uso
1. Selecciona la sucursal e ingresa los detalles del paciente en el formulario.
2. Elige el tratamiento correspondiente de la lista desplegable.
3. Introduce los costos, pagos y observaciones si es necesario.
4. Haz clic en "**Guardar Paciente**" para registrar el paciente.
5. Usa los botones de "**Imprimir Todo (Cierre Diario)**" o "**Exportar PDF**" para generar reportes.

## Features
- Registro de pacientes con detalles de tratamiento y pago.
- Generación de informes de cierre diario.
- Soporte para exportar registros en formato PDF.
- Manejo de tratamientos personalizados.
- Visualización de estadísticas diarias.

## Dependencies
Este proyecto utiliza las siguientes bibliotecas:
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS para el estilo.
- [jsPDF](https://github.com/parallax/jsPDF) - Biblioteca para la creación de archivos PDF.
- [jsPDF AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) - Plugin para generar tablas en jsPDF.

## Project Structure
La estructura del proyecto es la siguiente:
```plaintext
renove_clinica_spa/
│
├── index.html         # Archivo HTML principal
├── storage.js         # Manejo de almacenamiento local
├── catalog.js         # Gestión de tratamiento y catálogo
├── pdf.js             # Generación de PDFs
└── main.js            # Lógica principal de la aplicación
```

Cada archivo JavaScript tiene un propósito específico:
- `storage.js`: Maneja las operaciones de almacenamiento y recuperación de registros de pacientes y tratamientos.
- `catalog.js`: Contiene la gestión del catálogo de tratamientos y sus características.
- `pdf.js`: Genera y maneja la creación de PDFs para los recibos individuales y reportes diarios.
- `main.js`: Contiene la lógica principal y la interacción del usuario con el sistema.

## Contribuciones
Las contribuciones son bienvenidas. Por favor, abre un issue o envía un pull request para discutir mejoras o errores.

## Licencia
Este proyecto es de código abierto y está licenciado bajo la [Licencia MIT](LICENSE).