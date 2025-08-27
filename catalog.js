// catalog.js - Handles treatment catalog management and default treatments

class TreatmentCatalog {
    constructor() {
        this.defaultTreatments = [
            {
                nombre: "Sculptra 1ra Sesión",
                costo_regular: 8500,
                promocion: 6500,
                descripcion: "Primera sesión de Sculptra para estimulación de colágeno"
            },
            {
                nombre: "Sculptra 2da Sesión",
                costo_regular: 7500,
                promocion: 5500,
                descripcion: "Segunda sesión de Sculptra con descuento"
            },
            {
                nombre: "Botox Full",
                costo_regular: 6500,
                promocion: 2999,
                descripcion: "Aplicación completa de Botox en rostro"
            },
            {
                nombre: "Botox Parcial",
                costo_regular: 4500,
                promocion: 2200,
                descripcion: "Aplicación parcial de Botox en zonas específicas"
            },
            {
                nombre: "Labios",
                costo_regular: 4000,
                promocion: 2800,
                descripcion: "Aumento y definición de labios con ácido hialurónico"
            },
            {
                nombre: "Facial Rejuveness",
                costo_regular: 3500,
                promocion: 1500,
                descripcion: "Tratamiento facial rejuvenecedor completo"
            },
            {
                nombre: "Hilos Tensores",
                costo_regular: 12000,
                promocion: 8500,
                descripcion: "Lifting facial con hilos tensores PDO"
            },
            {
                nombre: "Peeling Químico",
                costo_regular: 2500,
                promocion: 1800,
                descripcion: "Exfoliación química para renovación celular"
            },
            {
                nombre: "Mesoterapia Facial",
                costo_regular: 3000,
                promocion: 2200,
                descripcion: "Hidratación profunda con vitaminas y minerales"
            },
            {
                nombre: "Radiofrecuencia",
                costo_regular: 2800,
                promocion: 2000,
                descripcion: "Tratamiento de radiofrecuencia para firmeza"
            },
            {
                nombre: "Limpieza Facial Profunda",
                costo_regular: 1800,
                promocion: 1200,
                descripcion: "Limpieza facial completa con extracción"
            },
            {
                nombre: "Masaje Relajante",
                costo_regular: 1500,
                promocion: 1000,
                descripcion: "Masaje corporal relajante de 60 minutos"
            }
        ];
        
        this.initializeCatalog();
    }

    initializeCatalog() {
        // Wait for storage to be available
        if (typeof storage === 'undefined') {
            setTimeout(() => this.initializeCatalog(), 100);
            return;
        }
        
        // Load existing custom treatments from storage
        const customTreatments = storage.getTreatmentCatalog();
        
        // If no custom treatments exist, we'll work with defaults only
        // Custom treatments are stored separately and merged when needed
    }

    getAllTreatments() {
        try {
            // Check if storage is available
            if (typeof storage === 'undefined') {
                return this.defaultTreatments;
            }
            
            // Combine default treatments with custom treatments
            const customTreatments = storage.getTreatmentCatalog();
            const allTreatments = [...this.defaultTreatments];
            
            // Add custom treatments with (Personalizado) label
            customTreatments.forEach(treatment => {
                allTreatments.push({
                    ...treatment,
                    nombre: `${treatment.nombre} (Personalizado)`,
                    custom: true
                });
            });
            
            return allTreatments;
        } catch (error) {
            console.error('Error getting all treatments:', error);
            return this.defaultTreatments;
        }
    }

    getTreatmentByName(name) {
        try {
            const allTreatments = this.getAllTreatments();
            return allTreatments.find(treatment => treatment.nombre === name);
        } catch (error) {
            console.error('Error finding treatment:', error);
            return null;
        }
    }

    updateTreatmentCost(treatmentName) {
        try {
            const treatment = this.getTreatmentByName(treatmentName);
            
            if (treatment) {
                return {
                    success: true,
                    costoRegular: treatment.costo_regular,
                    promocion: treatment.promocion,
                    pagoRealizado: treatment.promocion // Default to promotional price
                };
            }
            
            return {
                success: false,
                error: 'Tratamiento no encontrado'
            };
        } catch (error) {
            console.error('Error updating treatment cost:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    addCustomTreatment(treatmentData) {
        try {
            // Validate required fields
            const validation = this.validateCustomTreatment(treatmentData);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Check if treatment name already exists
            const existingTreatment = this.getTreatmentByName(treatmentData.nombre);
            if (existingTreatment) {
                return {
                    success: false,
                    errors: ['Ya existe un tratamiento con este nombre']
                };
            }

            // Add to storage
            const result = storage.addCustomTreatment({
                nombre: treatmentData.nombre,
                costo_regular: parseFloat(treatmentData.costo_regular),
                promocion: parseFloat(treatmentData.promocion),
                descripcion: treatmentData.descripcion || 'Tratamiento personalizado'
            });

            if (result.success) {
                // Refresh treatment selector in UI
                this.populateTreatmentSelector();
                
                return {
                    success: true,
                    treatment: result.treatment
                };
            }

            return result;
        } catch (error) {
            console.error('Error adding custom treatment:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }

    validateCustomTreatment(treatmentData) {
        const errors = [];

        // Required fields
        if (!treatmentData.nombre || treatmentData.nombre.trim() === '') {
            errors.push('Nombre del tratamiento es requerido');
        }

        if (!treatmentData.costo_regular || isNaN(parseFloat(treatmentData.costo_regular))) {
            errors.push('Costo regular debe ser un número válido');
        } else if (parseFloat(treatmentData.costo_regular) < 0) {
            errors.push('Costo regular no puede ser negativo');
        }

        if (!treatmentData.promocion || isNaN(parseFloat(treatmentData.promocion))) {
            errors.push('Promoción debe ser un número válido');
        } else if (parseFloat(treatmentData.promocion) < 0) {
            errors.push('Promoción no puede ser negativa');
        }

        // Business logic validation
        if (treatmentData.costo_regular && treatmentData.promocion) {
            const regular = parseFloat(treatmentData.costo_regular);
            const promo = parseFloat(treatmentData.promocion);
            
            if (promo > regular) {
                errors.push('La promoción no puede ser mayor al costo regular');
            }
        }

        // Name length validation
        if (treatmentData.nombre && treatmentData.nombre.length > 100) {
            errors.push('El nombre del tratamiento no puede exceder 100 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    populateTreatmentSelector() {
        try {
            const selector = document.getElementById('tratamiento');
            if (!selector) return;

            // Clear existing options except the first one
            while (selector.children.length > 1) {
                selector.removeChild(selector.lastChild);
            }

            // Add all treatments
            const allTreatments = this.getAllTreatments();
            
            allTreatments.forEach(treatment => {
                const option = document.createElement('option');
                option.value = treatment.nombre;
                option.textContent = treatment.nombre;
                option.dataset.costoRegular = treatment.costo_regular;
                option.dataset.promocion = treatment.promocion;
                selector.appendChild(option);
            });

            // Add "Personalizado" option at the end
            const personalizadoOption = document.createElement('option');
            personalizadoOption.value = 'personalizado';
            personalizadoOption.textContent = 'Personalizado...';
            selector.appendChild(personalizadoOption);

        } catch (error) {
            console.error('Error populating treatment selector:', error);
        }
    }

    searchTreatments(query) {
        try {
            const allTreatments = this.getAllTreatments();
            const lowercaseQuery = query.toLowerCase();
            
            return allTreatments.filter(treatment => 
                treatment.nombre.toLowerCase().includes(lowercaseQuery) ||
                (treatment.descripcion && treatment.descripcion.toLowerCase().includes(lowercaseQuery))
            );
        } catch (error) {
            console.error('Error searching treatments:', error);
            return [];
        }
    }

    getTreatmentStats() {
        try {
            const allTreatments = this.getAllTreatments();
            const customTreatments = storage.getTreatmentCatalog();
            
            return {
                total: allTreatments.length,
                default: this.defaultTreatments.length,
                custom: customTreatments.length,
                averageRegularPrice: this.calculateAveragePrice(allTreatments, 'costo_regular'),
                averagePromoPrice: this.calculateAveragePrice(allTreatments, 'promocion')
            };
        } catch (error) {
            console.error('Error getting treatment stats:', error);
            return {
                total: 0,
                default: 0,
                custom: 0,
                averageRegularPrice: 0,
                averagePromoPrice: 0
            };
        }
    }

    calculateAveragePrice(treatments, priceField) {
        if (treatments.length === 0) return 0;
        
        const total = treatments.reduce((sum, treatment) => {
            return sum + (parseFloat(treatment[priceField]) || 0);
        }, 0);
        
        return total / treatments.length;
    }

    exportCatalog() {
        try {
            const allTreatments = this.getAllTreatments();
            return {
                success: true,
                data: {
                    treatments: allTreatments,
                    exportDate: new Date().toISOString(),
                    stats: this.getTreatmentStats()
                }
            };
        } catch (error) {
            console.error('Error exporting catalog:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Utility method to format treatment for display
    formatTreatmentForDisplay(treatment) {
        return {
            nombre: treatment.nombre,
            costoRegular: storage.formatCurrency(treatment.costo_regular),
            promocion: storage.formatCurrency(treatment.promocion),
            descuento: this.calculateDiscount(treatment.costo_regular, treatment.promocion),
            descripcion: treatment.descripcion || ''
        };
    }

    calculateDiscount(regular, promo) {
        if (!regular || !promo || regular <= 0) return '0%';
        
        const discount = ((regular - promo) / regular) * 100;
        return `${Math.round(discount)}%`;
    }
}

// Create global instance
const catalog = new TreatmentCatalog();
