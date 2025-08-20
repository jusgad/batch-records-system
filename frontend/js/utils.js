// Utility functions

// Loading overlay functions
function showLoading(message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const text = overlay.querySelector('p');
        if (text) text.textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Message functions
function showMessage(message, type = 'info', duration = 5000) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.toast-message');
    existingMessages.forEach(msg => msg.remove());

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `toast-message toast-${type}`;
    messageElement.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getMessageIcon(type)}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add to document
    document.body.appendChild(messageElement);

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (messageElement.parentElement) {
                messageElement.remove();
            }
        }, duration);
    }

    // Add animation
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);

    return messageElement;
}

function getMessageIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function showSuccessMessage(message, duration = 3000) {
    return showMessage(message, 'success', duration);
}

function showErrorMessage(message, duration = 5000) {
    return showMessage(message, 'error', duration);
}

function showWarningMessage(message, duration = 4000) {
    return showMessage(message, 'warning', duration);
}

function showInfoMessage(message, duration = 3000) {
    return showMessage(message, 'info', duration);
}

function hideMessage() {
    const messages = document.querySelectorAll('.toast-message');
    messages.forEach(msg => {
        msg.classList.remove('show');
        setTimeout(() => msg.remove(), 300);
    });
}

// Date and time utilities
function formatDate(dateString, format = 'dd/mm/yyyy') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    switch (format) {
        case 'dd/mm/yyyy':
            return `${day}/${month}/${year}`;
        case 'yyyy-mm-dd':
            return `${year}-${month}-${day}`;
        case 'dd/mm/yyyy hh:mm':
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        case 'relative':
            return getRelativeTime(date);
        default:
            return date.toLocaleDateString();
    }
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return formatDate(date);
}

// Form utilities
function validateForm(form) {
    const errors = [];
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        const value = field.value.trim();
        const fieldName = field.getAttribute('data-label') || field.name || field.id;
        
        if (!value) {
            errors.push(`${fieldName} es requerido`);
            field.classList.add('error');
        } else {
            field.classList.remove('error');
        }
    });

    // Email validation
    const emailFields = form.querySelectorAll('input[type="email"]');
    emailFields.forEach(field => {
        const value = field.value.trim();
        if (value && !isValidEmail(value)) {
            errors.push('El formato del email no es válido');
            field.classList.add('error');
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (checkboxes, multiple selects)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            } else {
                data[key] = [data[key], value];
            }
        } else {
            data[key] = value;
        }
    }
    
    return data;
}

function setFormData(form, data) {
    Object.keys(data).forEach(key => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = Boolean(data[key]);
            } else {
                field.value = data[key] || '';
            }
        }
    });
}

function resetForm(form) {
    form.reset();
    form.querySelectorAll('.error').forEach(field => {
        field.classList.remove('error');
    });
}

// String utilities
function sanitizeString(str) {
    return str.replace(/[<>]/g, '');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function truncateText(text, maxLength, ellipsis = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

// Number utilities
function formatNumber(num, decimals = 0) {
    return Number(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function parseNumber(str) {
    return parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
}

// Storage utilities
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// DOM utilities
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.keys(attributes).forEach(key => {
        if (key === 'className') {
            element.className = attributes[key];
        } else if (key === 'dataset') {
            Object.keys(attributes[key]).forEach(dataKey => {
                element.dataset[dataKey] = attributes[key][dataKey];
            });
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    if (content) {
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else {
            element.appendChild(content);
        }
    }
    
    return element;
}

function showElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.style.display = '';
        element.classList.remove('d-none');
    }
}

function hideElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.style.display = 'none';
        element.classList.add('d-none');
    }
}

function toggleElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        if (element.style.display === 'none' || element.classList.contains('d-none')) {
            showElement(element);
        } else {
            hideElement(element);
        }
    }
}

// File utilities
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsText(file);
    });
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsDataURL(file);
    });
}

// Validation utilities
function validateBatchNumber(batchNumber) {
    // Batch number should be alphanumeric and between 3-20 characters
    const regex = /^[A-Za-z0-9]{3,20}$/;
    return regex.test(batchNumber);
}

function validateQuantity(quantity) {
    // Quantity should be a positive number with optional unit
    const regex = /^\d+(\.\d+)?\s*(kg|g|ml|l|units?|unidades?)?$/i;
    return regex.test(quantity.trim());
}

// Debounce function for search inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccessMessage('Copiado al portapapeles');
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccessMessage('Copiado al portapapeles');
            return true;
        } catch (err) {
            document.body.removeChild(textArea);
            showErrorMessage('No se pudo copiar al portapapeles');
            return false;
        }
    }
}

// Print utilities
function printElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        showErrorMessage('Elemento no encontrado para imprimir');
        return;
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir</title>
            <link rel="stylesheet" href="styles/main.css">
            <link rel="stylesheet" href="styles/form.css">
            <style>
                body { margin: 0; padding: 20px; }
                @media print {
                    body { margin: 0; padding: 0; }
                }
            </style>
        </head>
        <body>
            ${element.innerHTML}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
}

// Initialize toast message styles
function initializeToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .toast-message {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            z-index: 9999;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        }
        
        .toast-message.show {
            opacity: 1;
            transform: translateX(0);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: white;
            border-left: 4px solid;
        }
        
        .toast-success .toast-content { border-left-color: #28a745; color: #155724; }
        .toast-error .toast-content { border-left-color: #dc3545; color: #721c24; }
        .toast-warning .toast-content { border-left-color: #ffc107; color: #856404; }
        .toast-info .toast-content { border-left-color: #17a2b8; color: #0c5460; }
        
        .toast-close {
            background: none;
            border: none;
            cursor: pointer;
            color: inherit;
            opacity: 0.7;
            margin-left: auto;
        }
        
        .toast-close:hover { opacity: 1; }
        
        @media (max-width: 480px) {
            .toast-message {
                left: 10px;
                right: 10px;
                min-width: auto;
                transform: translateY(-100%);
            }
            .toast-message.show {
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeToastStyles);
} else {
    initializeToastStyles();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading, hideLoading, showMessage, showSuccessMessage, showErrorMessage,
        showWarningMessage, showInfoMessage, hideMessage, formatDate, getRelativeTime,
        validateForm, isValidEmail, getFormData, setFormData, resetForm, sanitizeString,
        capitalizeFirst, truncateText, formatNumber, parseNumber, saveToLocalStorage,
        getFromLocalStorage, removeFromLocalStorage, createElement, showElement,
        hideElement, toggleElement, downloadFile, readFileAsText, readFileAsDataURL,
        validateBatchNumber, validateQuantity, debounce, throttle, copyToClipboard,
        printElement
    };
}