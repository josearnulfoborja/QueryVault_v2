// API Configuration - Detectar automáticamente el entorno
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;

// Application State
let queries = [];
let currentQuery = null;
let isEditing = false;

// DOM Elements
const searchInput = document.getElementById('search-input');
const newQueryBtn = document.getElementById('new-query-btn');
const queriesList = document.getElementById('queries-list');
const emptyState = document.getElementById('empty-state');
const loading = document.getElementById('loading');
const modal = document.getElementById('query-modal');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const queryForm = document.getElementById('query-form');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    bindEvents();
});

async function initializeApp() {
    try {
        showLoading(true);
        
        // Verificar conectividad del servidor primero
        console.log('🔌 Verificando conectividad con el servidor...', API_BASE_URL);
        await checkServerHealth();
        console.log('✅ Servidor conectado correctamente');
        
        await loadQueries();
        showLoading(false);
        console.log('🚀 Aplicación inicializada correctamente');
    } catch (error) {
        showLoading(false);
        showToast('Error al cargar la aplicación: ' + error.message, 'error');
        console.error('❌ Error initializing app:', error);
    }
}

// Función para verificar la salud del servidor
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
        if (!response.ok) {
            throw new Error(`Servidor respondió con estado ${response.status}`);
        }
        const data = await response.json();
        console.log('Server health check:', data);
        return data;
    } catch (error) {
        console.error('Health check failed:', error);
        throw new Error('No se puede conectar al servidor. Verifica que el servidor backend esté corriendo en http://localhost:3000');
    }
}

// Event Bindings
function bindEvents() {
    // Search functionality
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Modal events
    newQueryBtn.addEventListener('click', openNewQueryModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    
    // Form submission
    queryForm.addEventListener('submit', handleFormSubmit);
    
    // SQL Preview events
    const querySqlTextarea = document.getElementById('query-sql');
    const previewCopyBtn = document.getElementById('preview-copy-btn');
    
    if (querySqlTextarea) {
        querySqlTextarea.addEventListener('input', debounce(updateSQLPreview, 300));
    }
    
    if (previewCopyBtn) {
        previewCopyBtn.addEventListener('click', copyPreviewSQL);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };
    
    try {
        const response = await fetch(url, config);
        
        // Verificar si la respuesta es JSON válida
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // Si no es JSON, obtener como texto para mejor debugging
            const text = await response.text();
            throw new Error(`Servidor no disponible. Respuesta: ${text || 'Sin respuesta'}`);
        }
        
        if (!response.ok) {
            throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Mostrar error más descriptivo para problemas CORS
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const corsError = new Error('No se puede conectar al servidor. Verifica que:\n1. El servidor backend esté corriendo en http://localhost:3000\n2. No hay problemas de CORS\n3. El servidor esté respondiendo correctamente');
            corsError.originalError = error;
            throw corsError;
        }
        
        throw error;
    }
}

async function loadQueries(filtro = '') {
    try {
        const params = filtro ? `?filtro=${encodeURIComponent(filtro)}` : '';
        const response = await apiRequest(`/consultas${params}`);
        queries = response.data || [];
        renderQueries();
    } catch (error) {
        showToast('Error al cargar las consultas', 'error');
        throw error;
    }
}

async function saveQuery(queryData) {
    try {
        // DEBUGGING: Primero probamos enviar los datos al endpoint de prueba
        console.log('🧪 DEBUGGING: Enviando datos a test-post:', queryData);
        try {
            const testResponse = await apiRequest('/test-post', {
                method: 'POST',
                body: JSON.stringify(queryData)
            });
            console.log('🧪 DEBUGGING: Respuesta de test-post:', testResponse);
        } catch (testError) {
            console.error('🧪 DEBUGGING: Error en test-post:', testError);
        }
        
        if (isEditing && currentQuery) {
            const response = await apiRequest(`/consultas/${currentQuery.id}`, {
                method: 'PUT',
                body: JSON.stringify(queryData)
            });
            showToast('Consulta actualizada exitosamente', 'success');
            return response.data;
        } else {
            const response = await apiRequest('/consultas', {
                method: 'POST',
                body: JSON.stringify(queryData)
            });
            showToast('Consulta creada exitosamente', 'success');
            return response.data;
        }
    } catch (error) {
        showToast('Error al guardar la consulta: ' + error.message, 'error');
        throw error;
    }
}

async function deleteQuery(id) {
    try {
        await apiRequest(`/consultas/${id}`, {
            method: 'DELETE'
        });
        showToast('Consulta eliminada exitosamente', 'success');
        await loadQueries(searchInput.value);
    } catch (error) {
        showToast('Error al eliminar la consulta: ' + error.message, 'error');
    }
}

// UI Functions
function renderQueries() {
    const searchTerm = searchInput.value.trim();
    
    if (queries.length === 0) {
        queriesList.classList.add('hidden');
        emptyState.classList.remove('hidden');
        
        if (searchTerm) {
            // Customize empty state for search results
            const emptyIcon = emptyState.querySelector('.empty-icon');
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            const emptyButton = emptyState.querySelector('button');
            
            emptyIcon.textContent = '🔍';
            emptyTitle.textContent = 'No se encontraron consultas';
            emptyText.textContent = `No hay consultas que coincidan con "${searchTerm}". Intenta con otros términos de búsqueda.`;
            emptyButton.style.display = 'none';
        } else {
            // Reset to original empty state
            const emptyIcon = emptyState.querySelector('.empty-icon');
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            const emptyButton = emptyState.querySelector('button');
            
            emptyIcon.textContent = '📝';
            emptyTitle.textContent = 'No hay consultas aún';
            emptyText.textContent = 'Comienza creando tu primera consulta SQL';
            emptyButton.style.display = 'inline-block';
        }
        return;
    }
    
    queriesList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    const searchTermLower = searchTerm.toLowerCase();
    
    // Add search info if there's a search term
    let searchInfoHtml = '';
    if (searchTerm) {
        searchInfoHtml = `
            <div class="search-info">
                📊 Mostrando ${queries.length} resultado${queries.length !== 1 ? 's' : ''} para "${searchTerm}"
            </div>
        `;
    }
    
    queriesList.innerHTML = searchInfoHtml + queries.map(query => `
        <div class="query-item" data-id="${query.id}">
            <div class="query-header">
                <h3 class="query-title">
                    ${highlightSearchTerm(escapeHtml(query.titulo), searchTermLower)}
                    ${query.favorito ? '<span class="favorite-star">⭐</span>' : ''}
                </h3>
                <div class="query-actions">
                    <button class="secondary-btn" onclick="editQuery(${query.id})">✏️</button>
                    <button class="secondary-btn" onclick="confirmDelete(${query.id})">🗑️</button>
                </div>
            </div>
            
            <div class="query-meta">
                <span>📅 ${formatDate(query.fecha_creacion)}</span>
                ${query.autor ? `<span>👤 ${highlightSearchTerm(escapeHtml(query.autor), searchTermLower)}</span>` : ''}
            </div>
            
            ${query.descripcion ? `
                <div class="query-description">
                    ${highlightSearchTerm(escapeHtml(query.descripcion), searchTermLower)}
                </div>
            ` : ''}
            
            <div class="query-sql">
                <div class="sql-header">
                    <button class="copy-btn" onclick="copyQueryCode(${query.id}, this)" title="Copiar código SQL">
                        📋 Copiar SQL
                    </button>
                </div>
                <pre><code class="language-sql">${highlightSearchTerm(escapeHtml(query.sql_codigo), searchTermLower)}</code></pre>
            </div>
            
            ${query.etiquetas ? `
                <div class="query-tags">
                    ${query.etiquetas.split(',').map(tag => 
                        `<span class="tag">${highlightSearchTerm(escapeHtml(tag.trim()), searchTermLower)}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Apply syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    } else {
        // Fallback custom SQL syntax highlighting
        applySQLHighlighting();
    }
}

// Custom SQL syntax highlighting fallback
function applySQLHighlighting() {
    const sqlBlocks = document.querySelectorAll('.language-sql');
    sqlBlocks.forEach(block => {
        highlightSQL(block);
    });
}

function highlightSQL(element) {
    let content = element.textContent;
    
    // SQL Keywords
    const keywords = [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE',
        'DATABASE', 'INDEX', 'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'JOIN', 'INNER', 'LEFT', 
        'RIGHT', 'FULL', 'OUTER', 'ON', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'BETWEEN',
        'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
        'TOP', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
        'IF', 'DECLARE', 'SET', 'BEGIN', 'END', 'WHILE', 'FOR', 'CURSOR', 'OPEN', 'FETCH', 'CLOSE',
        'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'AUTO_INCREMENT'
    ];
    
    // Data types
    const dataTypes = [
        'INT', 'INTEGER', 'VARCHAR', 'CHAR', 'TEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 
        'DECIMAL', 'FLOAT', 'DOUBLE', 'BOOLEAN', 'BOOL', 'BLOB', 'CLOB', 'BINARY', 'VARBINARY'
    ];
    
    // Functions
    const functions = [
        'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'ROUND', 'UPPER', 'LOWER', 'SUBSTRING', 'LENGTH',
        'TRIM', 'LTRIM', 'RTRIM', 'REPLACE', 'CONCAT', 'NOW', 'CURRENT_DATE', 'CURRENT_TIME',
        'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'DATEDIFF', 'DATEADD'
    ];
    
    // Replace keywords
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        content = content.replace(regex, `<span class="sql-keyword">${keyword.toUpperCase()}</span>`);
    });
    
    // Replace data types
    dataTypes.forEach(type => {
        const regex = new RegExp(`\\b${type}\\b`, 'gi');
        content = content.replace(regex, `<span class="sql-data-type">${type.toUpperCase()}</span>`);
    });
    
    // Replace functions
    functions.forEach(func => {
        const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
        content = content.replace(regex, `<span class="sql-function">${func.toUpperCase()}</span>(`);
    });
    
    // Replace strings (single and double quotes)
    content = content.replace(/'([^']*)'/g, '<span class="sql-string">\'$1\'</span>');
    content = content.replace(/"([^"]*)"/g, '<span class="sql-string">"$1"</span>');
    
    // Replace numbers
    content = content.replace(/\b\d+(\.\d+)?\b/g, '<span class="sql-number">$&</span>');
    
    // Replace single-line comments
    content = content.replace(/--.*$/gm, '<span class="sql-comment">$&</span>');
    
    // Replace multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '<span class="sql-comment">$&</span>');
    
    // Replace operators
    const operators = ['=', '!=', '<>', '<', '>', '<=', '>=', '+', '-', '*', '/', '%'];
    operators.forEach(op => {
        const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOp, 'g');
        content = content.replace(regex, `<span class="sql-operator">${op}</span>`);
    });
    
    element.innerHTML = content;
}

// SQL Preview functions
function updateSQLPreview() {
    const textarea = document.getElementById('query-sql');
    const previewCode = document.getElementById('sql-preview-code');
    
    if (textarea && previewCode) {
        const sqlContent = textarea.value.trim();
        if (sqlContent) {
            previewCode.textContent = sqlContent;
            
            // Apply syntax highlighting
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(previewCode);
            } else {
                highlightSQL(previewCode);
            }
        } else {
            previewCode.textContent = '-- Tu código SQL aparecerá aquí...';
        }
    }
}

function copyPreviewSQL() {
    const textarea = document.getElementById('query-sql');
    const button = document.getElementById('preview-copy-btn');
    
    if (textarea && textarea.value.trim()) {
        copyToClipboard(textarea.value, button);
    } else {
        showToast('No hay código SQL para copiar', 'warning');
    }
}

function openNewQueryModal() {
    isEditing = false;
    currentQuery = null;
    modalTitle.textContent = 'Nueva Consulta SQL';
    saveBtn.innerHTML = '💾 Guardar';
    resetForm();
    updateSQLPreview(); // Update preview when opening modal
    showModal();
}

function openEditQueryModal(query) {
    isEditing = true;
    currentQuery = query;
    modalTitle.textContent = 'Editar Consulta SQL';
    saveBtn.innerHTML = '💾 Actualizar';
    fillForm(query);
    updateSQLPreview(); // Update preview when opening modal for edit
    showModal();
}

function showModal() {
    modal.classList.remove('hidden');
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    
    // Focus first input
    const firstInput = modal.querySelector('input, textarea');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

function closeModal() {
    modal.classList.add('hidden');
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
    resetForm();
    currentQuery = null;
    isEditing = false;
}

function resetForm() {
    queryForm.reset();
}

function fillForm(query) {
    document.getElementById('query-title').value = query.titulo || '';
    document.getElementById('query-description').value = query.descripcion || '';
    document.getElementById('query-author').value = query.autor || '';
    document.getElementById('query-sql').value = query.sql_codigo || '';
    document.getElementById('query-tags').value = query.etiquetas || '';
    document.getElementById('query-favorite').checked = query.favorito || false;
}

function getFormData() {
    const formData = new FormData(queryForm);
    const data = {
        titulo: formData.get('titulo').trim(),
        descripcion: formData.get('descripcion').trim(),
        autor: formData.get('autor').trim(),
        sql_codigo: formData.get('sql_codigo').trim(),
        favorito: formData.has('favorito')
    };
    
    // Process tags
    const etiquetas = formData.get('etiquetas').trim();
    if (etiquetas) {
        data.etiquetas = etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else {
        data.etiquetas = [];
    }
    
    return data;
}

function showLoading(show) {
    if (show) {
        loading.classList.remove('hidden');
        queriesList.classList.add('hidden');
        emptyState.classList.add('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Event Handlers
async function handleSearch(event) {
    const filtro = event.target.value.trim();
    showLoading(true);
    try {
        await loadQueries(filtro);
        showLoading(false);
    } catch (error) {
        showLoading(false);
        console.warn('Error en búsqueda del servidor, aplicando filtro local:', error.message);
        // Fallback: Filtrar localmente si el servidor no responde
        filterQueriesLocally(filtro);
    }
}

// Función para filtrar consultas localmente
function filterQueriesLocally(filtro) {
    if (!filtro) {
        renderQueries();
        return;
    }
    
    const filtroLower = filtro.toLowerCase();
    const filteredQueries = queries.filter(query => {
        const titulo = (query.titulo || '').toLowerCase();
        const descripcion = (query.descripcion || '').toLowerCase();
        const sqlCodigo = (query.sql_codigo || '').toLowerCase();
        const autor = (query.autor || '').toLowerCase();
        const etiquetas = (query.etiquetas || '').toLowerCase();
        
        return titulo.includes(filtroLower) ||
               descripcion.includes(filtroLower) ||
               sqlCodigo.includes(filtroLower) ||
               autor.includes(filtroLower) ||
               etiquetas.includes(filtroLower);
    });
    
    // Temporalmente reemplazar el array de consultas para renderizar
    const originalQueries = [...queries];
    queries = filteredQueries;
    renderQueries();
    queries = originalQueries;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = getFormData();
    
    // Basic validation
    if (!formData.titulo || !formData.sql_codigo) {
        showToast('Título y código SQL son requeridos', 'warning');
        return;
    }
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '⏳ Guardando...';
        
        await saveQuery(formData);
        closeModal();
        await loadQueries(searchInput.value);
        
    } catch (error) {
        console.error('Error saving query:', error);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = isEditing ? '💾 Actualizar' : '💾 Guardar';
    }
}

function handleKeyboard(event) {
    // ESC key closes modal
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
    }
    
    // Ctrl/Cmd + N opens new query modal
    if ((event.ctrlKey || event.metaKey) && event.key === 'n' && modal.classList.contains('hidden')) {
        event.preventDefault();
        openNewQueryModal();
    }
}

// Global functions for onclick handlers
window.editQuery = async function(id) {
    try {
        const response = await apiRequest(`/consultas/${id}`);
        openEditQueryModal(response.data);
    } catch (error) {
        showToast('Error al cargar la consulta', 'error');
    }
};

window.confirmDelete = function(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta consulta?')) {
        deleteQuery(id);
    }
};

window.openNewQueryModal = openNewQueryModal;

// Utility Functions
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

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Copy to clipboard functionality
async function copyQueryCode(queryId, button) {
    const query = queries.find(q => q.id === queryId);
    if (!query) {
        showToast('Error: No se encontró la consulta', 'error');
        return;
    }
    
    try {
        await navigator.clipboard.writeText(query.sql_codigo);
        showCopySuccess(button);
        showToast('Código SQL copiado al portapapeles', 'success');
    } catch (err) {
        console.warn('Clipboard API not available, using fallback method:', err.message);
        // Fallback for older browsers
        fallbackCopyToClipboard(query.sql_codigo);
        showCopySuccess(button);
        showToast('Código SQL copiado al portapapeles', 'success');
    }
}

async function copyToClipboard(text, button) {
    try {
        await navigator.clipboard.writeText(text);
        showCopySuccess(button);
        showToast('Código SQL copiado al portapapeles', 'success');
    } catch (err) {
        console.warn('Clipboard API not available, using fallback method:', err.message);
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
        showCopySuccess(button);
        showToast('Código SQL copiado al portapapeles', 'success');
    }
}

function showCopySuccess(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '✅ Copiado!';
    button.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
    }, 2000);
}

function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
}

// Search highlighting function
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}