// main.js - Main application logic and event handlers

class RenoveApp {
    constructor() {
        this.currentPatients = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }

    initializeApp() {
        try {
            console.log('Initializing Renové App...');
            
            // Wait for all dependencies to be available
            if (typeof storage === 'undefined' || typeof catalog === 'undefined') {
                setTimeout(() => this.initializeApp(), 100);
                return;
            }
            
            // Initialize treatment catalog
            catalog.populateTreatmentSelector();
            
            // Load today's patients
            this.loadTodayPatients();
            
            // Update dashboard
            this.updateDashboard();
            
            // Setup event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('Renové App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al inicializar la aplicación: ' + error.message);
        }
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('form-paciente');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Treatment selector change
        const treatmentSelect = document.getElementById('tratamiento');
        if (treatmentSelect) {
            treatmentSelect.addEventListener('change', (e) => this.handleTreatmentChange(e));
        }

        // Payment method change
        const paymentMethodSelect = document.getElementById('metodo-pago');
        if (paymentMethodSelect) {
            paymentMethodSelect.addEventListener('change', (e) => this.handlePaymentMethodChange(e));
        }

        // Mixed payment validation
        const efectivoInput = document.getElementById('efectivo-amount');
        const tarjetaInput = document.getElementById('tarjeta-amount');
        if (efectivoInput && tarjetaInput) {
            efectivoInput.addEventListener('input', () => this.validateMixedPayment());
            tarjetaInput.addEventListener('input', () => this.validateMixedPayment());
        }

        // Dashboard buttons
        const btnImprimirTodo = document.getElementById('btn-imprimir-todo');
        if (btnImprimirTodo) {
            btnImprimirTodo.addEventListener('click', () => this.printDailyReport());
        }

        const btnExportarPDF = document.getElementById('btn-exportar-pdf');
        if (btnExportarPDF) {
            btnExportarPDF.addEventListener('click', () => this.exportDailyPDF());
        }

        const btnLimpiarTodo = document.getElementById('btn-limpiar-todo');
        if (btnLimpiarTodo) {
            btnLimpiarTodo.addEventListener('click', () => this.clearAllData());
        }

        // Custom treatment modal
        const btnCancelarPersonalizado = document.getElementById('btn-cancelar-personalizado');
        if (btnCancelarPersonalizado) {
            btnCancelarPersonalizado.addEventListener('click', () => this.hideCustomTreatmentModal());
        }

        const formPersonalizado = document.getElementById('form-personalizado');
        if (formPersonalizado) {
            formPersonalizado.addEventListener('submit', (e) => this.handleCustomTreatmentSubmit(e));
        }

        // Auto-update payment amount when promotion changes
        const promocionInput = document.getElementById('promocion');
        if (promocionInput) {
            promocionInput.addEventListener('input', (e) => {
                const pagoRealizadoInput = document.getElementById('pago-realizado');
                if (pagoRealizadoInput && e.target.value) {
                    pagoRealizadoInput.value = e.target.value;
                }
            });
        }
    }

    handleFormSubmit(event) {
        event.preventDefault();
        
        try {
            // Clear previous errors
            this.hideErrors();
            
            // Get form data
            const formData = this.getFormData();
            
            // Validate form data
            const validation = this.validateFormData(formData);
            if (!validation.isValid) {
                this.showErrors(validation.errors);
                return;
            }

            // Create patient record
            const patientRecord = this.createPatientRecord(formData);
            
            // Validate with storage
            const storageValidation = storage.validatePatientRecord(patientRecord);
            if (!storageValidation.isValid) {
                this.showErrors(storageValidation.errors);
                return;
            }

            // Save to storage
            const result = storage.addPatientRecord(patientRecord);
            if (!result.success) {
                this.showError('Error al guardar el paciente: ' + result.error);
                return;
            }

            // Update UI
            this.loadTodayPatients();
            this.updateDashboard();
            this.resetForm();
            
            // Show success message
            this.showSuccess('Paciente agregado exitosamente');
            
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError('Error al procesar el formulario: ' + error.message);
        }
    }

    getFormData() {
        return {
            sucursal: document.getElementById('sucursal').value,
            cliente: document.getElementById('cliente').value,
            telefono: document.getElementById('telefono').value,
            tratamiento: document.getElementById('tratamiento').value,
            costoRegular: document.getElementById('costo-regular').value,
            promocion: document.getElementById('promocion').value,
            pagoRealizado: document.getElementById('pago-realizado').value,
            metodoPago: document.getElementById('metodo-pago').value,
            efectivoAmount: document.getElementById('efectivo-amount').value,
            tarjetaAmount: document.getElementById('tarjeta-amount').value,
            observaciones: document.getElementById('observaciones').value
        };
    }

    validateFormData(formData) {
        const errors = [];

        // Required fields
        if (!formData.sucursal) errors.push('Sucursal es requerida');
        if (!formData.cliente.trim()) errors.push('Cliente es requerido');
        if (!formData.telefono.trim()) errors.push('Teléfono es requerido');
        if (!formData.tratamiento) errors.push('Tratamiento es requerido');

        // Check if personalizado was selected but not completed
        if (formData.tratamiento === 'personalizado') {
            errors.push('Debe completar el alta de tratamiento personalizado');
        }

        // Numeric validations
        if (formData.costoRegular && parseFloat(formData.costoRegular) < 0) {
            errors.push('Costo regular no puede ser negativo');
        }
        if (formData.promocion && parseFloat(formData.promocion) < 0) {
            errors.push('Promoción no puede ser negativa');
        }
        if (formData.pagoRealizado && parseFloat(formData.pagoRealizado) < 0) {
            errors.push('Pago realizado no puede ser negativo');
        }

        // Mixed payment validation
        if (formData.metodoPago === 'mixto') {
            const efectivo = parseFloat(formData.efectivoAmount || 0);
            const tarjeta = parseFloat(formData.tarjetaAmount || 0);
            const total = parseFloat(formData.pagoRealizado || 0);
            
            if (Math.abs((efectivo + tarjeta) - total) > 0.01) {
                errors.push('La suma de efectivo y tarjeta debe ser igual al pago realizado');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    createPatientRecord(formData) {
        const pagoData = {
            metodo: formData.metodoPago,
            pago_realizado: parseFloat(formData.pagoRealizado || 0),
            moneda: 'MXN'
        };

        if (formData.metodoPago === 'mixto') {
            pagoData.detalle = {
                efectivo: parseFloat(formData.efectivoAmount || 0),
                tarjeta: parseFloat(formData.tarjetaAmount || 0)
            };
        } else {
            pagoData.detalle = {
                [formData.metodoPago]: parseFloat(formData.pagoRealizado || 0)
            };
        }

        return {
            sucursal: formData.sucursal,
            cliente: formData.cliente.trim(),
            telefono: formData.telefono.trim(),
            tratamiento: formData.tratamiento,
            costo_regular: parseFloat(formData.costoRegular || 0),
            promocion: parseFloat(formData.promocion || 0),
            pago: pagoData,
            observaciones: formData.observaciones.trim()
        };
    }

    handleTreatmentChange(event) {
        const selectedTreatment = event.target.value;
        
        if (selectedTreatment === 'personalizado') {
            this.showCustomTreatmentModal();
            return;
        }

        if (selectedTreatment) {
            const result = catalog.updateTreatmentCost(selectedTreatment);
            if (result.success) {
                document.getElementById('costo-regular').value = result.costoRegular;
                document.getElementById('promocion').value = result.promocion;
                document.getElementById('pago-realizado').value = result.pagoRealizado;
            }
        } else {
            // Clear fields if no treatment selected
            document.getElementById('costo-regular').value = '';
            document.getElementById('promocion').value = '';
            document.getElementById('pago-realizado').value = '';
        }
    }

    handlePaymentMethodChange(event) {
        const metodoPago = event.target.value;
        const mixtoFields = document.getElementById('pago-mixto-fields');
        
        if (metodoPago === 'mixto') {
            mixtoFields.classList.remove('hidden');
            this.validateMixedPayment();
        } else {
            mixtoFields.classList.add('hidden');
            this.hideMixtoError();
        }
    }

    validateMixedPayment() {
        const efectivo = parseFloat(document.getElementById('efectivo-amount').value || 0);
        const tarjeta = parseFloat(document.getElementById('tarjeta-amount').value || 0);
        const pagoRealizado = parseFloat(document.getElementById('pago-realizado').value || 0);
        
        const mixtoError = document.getElementById('mixto-error');
        
        if (Math.abs((efectivo + tarjeta) - pagoRealizado) > 0.01) {
            mixtoError.classList.remove('hidden');
            return false;
        } else {
            mixtoError.classList.add('hidden');
            return true;
        }
    }

    showCustomTreatmentModal() {
        const modal = document.getElementById('modal-personalizado');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideCustomTreatmentModal() {
        const modal = document.getElementById('modal-personalizado');
        if (modal) {
            modal.classList.add('hidden');
            // Reset treatment selector
            document.getElementById('tratamiento').value = '';
        }
    }

    handleCustomTreatmentSubmit(event) {
        event.preventDefault();
        
        try {
            const customData = {
                nombre: document.getElementById('nombre-personalizado').value.trim(),
                costo_regular: document.getElementById('precio-regular-personalizado').value,
                promocion: document.getElementById('promocion-personalizado').value
            };

            const result = catalog.addCustomTreatment(customData);
            
            if (result.success) {
                // Update main form with custom treatment data
                document.getElementById('tratamiento').value = `${customData.nombre} (Personalizado)`;
                document.getElementById('costo-regular').value = customData.costo_regular;
                document.getElementById('promocion').value = customData.promocion;
                document.getElementById('pago-realizado').value = customData.promocion;
                
                // Reset and hide modal
                document.getElementById('form-personalizado').reset();
                this.hideCustomTreatmentModal();
                
                this.showSuccess('Tratamiento personalizado agregado exitosamente');
            } else {
                this.showError('Error al agregar tratamiento: ' + (result.errors ? result.errors.join(', ') : 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error adding custom treatment:', error);
            this.showError('Error al procesar el tratamiento personalizado: ' + error.message);
        }
    }

    loadTodayPatients() {
        try {
            this.currentPatients = storage.getTodayPatientRecords();
            this.renderPatientsList();
        } catch (error) {
            console.error('Error loading today\'s patients:', error);
            this.showError('Error al cargar los pacientes del día');
        }
    }

    renderPatientsList() {
        const container = document.getElementById('pacientes-list');
        if (!container) return;

        if (this.currentPatients.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p class="text-lg">No hay pacientes registrados para el día de hoy</p>
                    <p class="text-sm">Agregue el primer paciente usando el formulario de arriba</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.currentPatients.map(patient => this.createPatientCard(patient)).join('');
    }

    createPatientCard(patient) {
        const paymentMethodText = this.formatPaymentMethodForCard(patient.pago);
        
        return `
            <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-gray-900">${patient.cliente}</h3>
                        <p class="text-gray-600">${patient.telefono} • ${patient.sucursal}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="app.printIndividualReceipt(${patient.id})" 
                                class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors">
                            Imprimir
                        </button>
                        <button onclick="app.deletePatient(${patient.id})" 
                                class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors">
                            Eliminar
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span class="font-medium text-gray-700">Tratamiento:</span>
                        <p class="text-gray-900">${patient.tratamiento}</p>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Costo Regular:</span>
                        <p class="text-gray-900">${storage.formatCurrency(patient.costo_regular)}</p>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Promoción:</span>
                        <p class="text-gray-900">${storage.formatCurrency(patient.promocion)}</p>
                    </div>
                    <div>
                        <span class="font-medium text-gray-700">Pago Realizado:</span>
                        <p class="text-gray-900 font-semibold">${storage.formatCurrency(patient.pago.pago_realizado)}</p>
                    </div>
                </div>
                
                <div class="mt-3 text-sm">
                    <span class="font-medium text-gray-700">Método de Pago:</span>
                    <span class="text-gray-900">${paymentMethodText}</span>
                </div>
                
                ${patient.observaciones ? `
                    <div class="mt-3 text-sm">
                        <span class="font-medium text-gray-700">Observaciones:</span>
                        <p class="text-gray-900 mt-1">${patient.observaciones}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    formatPaymentMethodForCard(pagoData) {
        if (pagoData.metodo === 'mixto') {
            return `Mixto (${storage.formatCurrency(pagoData.detalle.efectivo)} efectivo + ${storage.formatCurrency(pagoData.detalle.tarjeta)} tarjeta)`;
        }
        
        const metodoCap = pagoData.metodo.charAt(0).toUpperCase() + pagoData.metodo.slice(1);
        return metodoCap;
    }

    updateDashboard() {
        try {
            const stats = storage.calculateDailyStats();
            
            document.getElementById('total-pacientes').textContent = stats.totalPacientes;
            document.getElementById('total-promociones').textContent = storage.formatCurrency(stats.totalPromociones);
            document.getElementById('total-pagado').textContent = storage.formatCurrency(stats.totalPagado);
            document.getElementById('total-regular').textContent = storage.formatCurrency(stats.totalRegular);
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    printIndividualReceipt(patientId) {
        try {
            const patient = this.currentPatients.find(p => p.id === patientId);
            if (!patient) {
                this.showError('Paciente no encontrado');
                return;
            }

            const result = pdfGenerator.printIndividualReceipt(patient);
            if (!result.success) {
                this.showError('Error al imprimir: ' + result.error);
            }
        } catch (error) {
            console.error('Error printing individual receipt:', error);
            this.showError('Error al imprimir el comprobante');
        }
    }

    printDailyReport() {
        try {
            const stats = storage.calculateDailyStats();
            const result = pdfGenerator.printDailyReport(this.currentPatients, stats);
            
            if (!result.success) {
                this.showError('Error al imprimir: ' + result.error);
            }
        } catch (error) {
            console.error('Error printing daily report:', error);
            this.showError('Error al imprimir el reporte diario');
        }
    }

    exportDailyPDF() {
        try {
            const stats = storage.calculateDailyStats();
            const result = pdfGenerator.generateGlobalPDF(this.currentPatients, stats);
            
            if (result.success) {
                this.showSuccess('PDF exportado exitosamente: ' + result.fileName);
            } else {
                this.showError('Error al exportar PDF: ' + result.error);
            }
        } catch (error) {
            console.error('Error exporting PDF:', error);
            this.showError('Error al exportar el PDF');
        }
    }

    deletePatient(patientId) {
        if (!confirm('¿Está seguro de que desea eliminar este paciente?')) {
            return;
        }

        try {
            const result = storage.removePatientRecord(patientId);
            if (result.success) {
                this.loadTodayPatients();
                this.updateDashboard();
                this.showSuccess('Paciente eliminado exitosamente');
            } else {
                this.showError('Error al eliminar paciente: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting patient:', error);
            this.showError('Error al eliminar el paciente');
        }
    }

    clearAllData() {
        const confirmation = prompt('Para confirmar, escriba "LIMPIAR TODO" (en mayúsculas):');
        if (confirmation !== 'LIMPIAR TODO') {
            return;
        }

        try {
            const result = storage.clearAllPatientRecords();
            if (result.success) {
                this.loadTodayPatients();
                this.updateDashboard();
                this.showSuccess('Todos los datos han sido eliminados');
            } else {
                this.showError('Error al limpiar datos: ' + result.error);
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showError('Error al limpiar los datos');
        }
    }

    resetForm() {
        const form = document.getElementById('form-paciente');
        if (form) {
            form.reset();
            
            // Hide mixed payment fields
            document.getElementById('pago-mixto-fields').classList.add('hidden');
            
            // Clear any error messages
            this.hideErrors();
        }
    }

    showErrors(errors) {
        const errorContainer = document.getElementById('form-errors');
        const errorList = document.getElementById('error-list');
        
        if (errorContainer && errorList) {
            errorList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
            errorContainer.classList.remove('hidden');
            
            // Scroll to errors
            errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    hideErrors() {
        const errorContainer = document.getElementById('form-errors');
        if (errorContainer) {
            errorContainer.classList.add('hidden');
        }
        this.hideMixtoError();
    }

    hideMixtoError() {
        const mixtoError = document.getElementById('mixto-error');
        if (mixtoError) {
            mixtoError.classList.add('hidden');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'success' ? 'bg-green-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    ×
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Utility methods
    formatCurrency(amount) {
        return storage.formatCurrency(amount);
    }

    getCurrentDate() {
        return new Date().toLocaleDateString('es-MX');
    }

    // Export data functionality
    exportAllData() {
        try {
            const data = storage.exportData();
            if (data) {
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `renove_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showSuccess('Datos exportados exitosamente');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showError('Error al exportar los datos');
        }
    }
}

// Initialize the application
const app = new RenoveApp();

// Make app globally available for onclick handlers
window.app = app;
