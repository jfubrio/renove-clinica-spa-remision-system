// storage.js - Handles localStorage operations for patient records and treatment catalog

class StorageManager {
    constructor() {
        this.PATIENTS_KEY = 'renove_patients';
        this.TREATMENTS_KEY = 'renove_treatments';
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize empty arrays if no data exists
        if (!localStorage.getItem(this.PATIENTS_KEY)) {
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.TREATMENTS_KEY)) {
            localStorage.setItem(this.TREATMENTS_KEY, JSON.stringify([]));
        }
    }

    // Patient Records Management
    getPatientRecords() {
        try {
            const data = localStorage.getItem(this.PATIENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading patient records:', error);
            return [];
        }
    }

    getTodayPatientRecords() {
        try {
            const allRecords = this.getPatientRecords();
            const today = new Date().toLocaleDateString('es-MX');
            return allRecords.filter(record => record.fecha === today);
        } catch (error) {
            console.error('Error filtering today\'s records:', error);
            return [];
        }
    }

    addPatientRecord(record) {
        try {
            const records = this.getPatientRecords();
            
            // Generate unique ID based on timestamp
            record.id = Date.now();
            record.fecha = new Date().toLocaleDateString('es-MX');
            
            records.push(record);
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(records));
            
            return { success: true, record };
        } catch (error) {
            console.error('Error adding patient record:', error);
            return { success: false, error: error.message };
        }
    }

    removePatientRecord(id) {
        try {
            const records = this.getPatientRecords();
            const filteredRecords = records.filter(record => record.id !== id);
            
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(filteredRecords));
            
            return { success: true };
        } catch (error) {
            console.error('Error removing patient record:', error);
            return { success: false, error: error.message };
        }
    }

    clearAllPatientRecords() {
        try {
            localStorage.setItem(this.PATIENTS_KEY, JSON.stringify([]));
            return { success: true };
        } catch (error) {
            console.error('Error clearing patient records:', error);
            return { success: false, error: error.message };
        }
    }

    // Treatment Catalog Management
    getTreatmentCatalog() {
        try {
            const data = localStorage.getItem(this.TREATMENTS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading treatment catalog:', error);
            return [];
        }
    }

    addCustomTreatment(treatment) {
        try {
            const treatments = this.getTreatmentCatalog();
            
            // Add custom flag and timestamp
            treatment.id = Date.now();
            treatment.custom = true;
            treatment.created = new Date().toISOString();
            
            treatments.push(treatment);
            localStorage.setItem(this.TREATMENTS_KEY, JSON.stringify(treatments));
            
            return { success: true, treatment };
        } catch (error) {
            console.error('Error adding custom treatment:', error);
            return { success: false, error: error.message };
        }
    }

    // Statistics and KPIs
    calculateDailyStats() {
        try {
            const todayRecords = this.getTodayPatientRecords();
            
            const stats = {
                totalPacientes: todayRecords.length,
                totalPromociones: 0,
                totalPagado: 0,
                totalRegular: 0,
                totalEfectivo: 0,
                totalTarjeta: 0,
                totalMixto: 0,
                desgloseMixto: {
                    efectivo: 0,
                    tarjeta: 0
                }
            };

            todayRecords.forEach(record => {
                // Sum regular prices
                stats.totalRegular += parseFloat(record.costo_regular || 0);
                
                // Sum promotional prices
                stats.totalPromociones += parseFloat(record.promocion || 0);
                
                // Sum total paid
                stats.totalPagado += parseFloat(record.pago.pago_realizado || 0);
                
                // Calculate payment method totals
                if (record.pago.metodo === 'efectivo') {
                    stats.totalEfectivo += parseFloat(record.pago.pago_realizado || 0);
                } else if (record.pago.metodo === 'tarjeta') {
                    stats.totalTarjeta += parseFloat(record.pago.pago_realizado || 0);
                } else if (record.pago.metodo === 'mixto') {
                    stats.totalMixto += parseFloat(record.pago.pago_realizado || 0);
                    stats.desgloseMixto.efectivo += parseFloat(record.pago.detalle.efectivo || 0);
                    stats.desgloseMixto.tarjeta += parseFloat(record.pago.detalle.tarjeta || 0);
                }
            });

            return stats;
        } catch (error) {
            console.error('Error calculating daily stats:', error);
            return {
                totalPacientes: 0,
                totalPromociones: 0,
                totalPagado: 0,
                totalRegular: 0,
                totalEfectivo: 0,
                totalTarjeta: 0,
                totalMixto: 0,
                desgloseMixto: { efectivo: 0, tarjeta: 0 }
            };
        }
    }

    // Data validation helpers
    validatePatientRecord(record) {
        const errors = [];

        // Required fields
        if (!record.sucursal) errors.push('Sucursal es requerida');
        if (!record.cliente) errors.push('Cliente es requerido');
        if (!record.telefono) errors.push('Teléfono es requerido');
        if (!record.tratamiento) errors.push('Tratamiento es requerido');

        // Numeric validations
        if (record.costo_regular && parseFloat(record.costo_regular) < 0) {
            errors.push('Costo regular no puede ser negativo');
        }
        if (record.promocion && parseFloat(record.promocion) < 0) {
            errors.push('Promoción no puede ser negativa');
        }
        if (record.pago && record.pago.pago_realizado && parseFloat(record.pago.pago_realizado) < 0) {
            errors.push('Pago realizado no puede ser negativo');
        }

        // Payment validation for mixto
        if (record.pago && record.pago.metodo === 'mixto') {
            const efectivo = parseFloat(record.pago.detalle.efectivo || 0);
            const tarjeta = parseFloat(record.pago.detalle.tarjeta || 0);
            const total = parseFloat(record.pago.pago_realizado || 0);
            
            if (Math.abs((efectivo + tarjeta) - total) > 0.01) {
                errors.push('La suma de efectivo y tarjeta debe ser igual al pago realizado');
            }
        }

        // Payment should not exceed promotional price (unless documented)
        if (record.promocion && record.pago && record.pago.pago_realizado) {
            const promocion = parseFloat(record.promocion);
            const pagado = parseFloat(record.pago.pago_realizado);
            
            if (pagado > promocion && !record.observaciones?.toLowerCase().includes('prepago')) {
                errors.push('El pago no puede ser mayor a la promoción (documentar prepago en observaciones)');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Export/Import functionality
    exportData() {
        try {
            const data = {
                patients: this.getPatientRecords(),
                treatments: this.getTreatmentCatalog(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.patients) {
                localStorage.setItem(this.PATIENTS_KEY, JSON.stringify(data.patients));
            }
            if (data.treatments) {
                localStorage.setItem(this.TREATMENTS_KEY, JSON.stringify(data.treatments));
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount || 0);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create global instance
const storage = new StorageManager();
