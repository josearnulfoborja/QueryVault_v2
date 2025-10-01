// API Configuration - Detectar automáticamente el entorno
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    console.log('🌐 Detectando entorno:', { hostname, port, protocol });
    
    // Desarrollo local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const apiUrl = `${protocol}//${hostname}:3000/api`;
        console.log('🔧 Modo desarrollo:', apiUrl);
        return apiUrl;
    }
    
    // Producción (Railway, Vercel, etc.)
    const apiUrl = `${window.location.origin}/api`;
    console.log('🚀 Modo producción:', apiUrl);
    return apiUrl;
}

const API_BASE_URL = getApiBaseUrl();

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
        
        // Verificar conectividad del servidor con reintentos (no bloquear si falla)
        console.log('🔌 Verificando conectividad con el servidor...', API_BASE_URL);
        try {
            await checkServerHealthWithRetry();
            console.log('✅ Servidor conectado correctamente');
        } catch (healthError) {
            console.warn('⚠️ Health check falló, pero continuando con la carga de datos:', healthError.message);
        }
        
        await loadQueries();
        showLoading(false);
        console.log('🚀 Aplicación inicializada correctamente');
    } catch (error) {
        showLoading(false);
        console.error('❌ Error initializing app:', error);
        
        // Mostrar mensaje de error más específico
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const instruction = isLocal 
            ? 'Inicia el servidor con: cd backend && npm run dev'
            : 'Verifica que la aplicación esté desplegada correctamente';
            
        showToast(`Error al cargar la aplicación: ${error.message}. ${instruction}`, 'error');
    }
}

// Función para verificar la salud del servidor con reintentos
async function checkServerHealthWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Intento ${attempt}/${maxRetries} de conexión al servidor`);
            return await checkServerHealth();
        } catch (error) {
            console.warn(`⚠️ Intento ${attempt} falló:`, error.message);
            
            if (attempt === maxRetries) {
                throw error; // Re-lanzar el error en el último intento
            }
            
            // Esperar antes del siguiente intento (backoff exponencial)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Función para verificar la salud del servidor
async function checkServerHealth() {
    console.log('🔌 Verificando servidor en:', API_BASE_URL);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            // Obtener el cuerpo de la respuesta para más información del error
            let errorBody = '';
            try {
                const text = await response.text();
                errorBody = text ? `: ${text.substring(0, 200)}` : '';
            } catch (e) {
                // Si no se puede leer el cuerpo, continuar sin él
            }
            
            let errorMsg = `Servidor respondió con estado ${response.status}: ${response.statusText}${errorBody}`;
            
            // Mensajes específicos para errores comunes
            if (response.status === 404) {
                errorMsg += '\n\n🔧 Posibles soluciones:\n1. Verifica que NODE_ENV=production esté configurado en Railway\n2. Asegúrate de que el servicio MySQL esté agregado\n3. Revisa los logs de Railway para más detalles';
            } else if (response.status === 500) {
                errorMsg += '\n\n🔧 Error interno del servidor. Revisa los logs de Railway para más información.';
            }
            
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('✅ Health check exitoso:', data);
        return data;
    } catch (error) {
        console.error('❌ Health check falló:', error);
        
        let errorMessage;
        if (error.name === 'AbortError') {
            errorMessage = 'Timeout: El servidor tardó demasiado en responder';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Error de conexión: No se puede alcanzar el servidor';
        } else {
            errorMessage = error.message;
        }
        
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000' 
            : window.location.origin;
            
        throw new Error(`${errorMessage}. Verifica que el servidor esté funcionando en ${serverUrl}`);
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
        console.log('📥 Consultas recibidas del servidor:', response);
        queries = Array.isArray(response) ? response : (response.data || []);
        console.log('📋 Consultas cargadas en frontend:', queries.length);
        renderQueries();
    } catch (error) {
        showToast('Error al cargar las consultas', 'error');
        throw error;
    }
}

async function saveQuery(queryData) {
    console.log('💾 saveQuery() - Datos recibidos:', queryData);
    console.log('💾 Favorito:', queryData.favorito, 'Type:', typeof queryData.favorito);
    console.log('💾 Etiquetas:', queryData.etiquetas, 'Type:', typeof queryData.etiquetas, 'Array:', Array.isArray(queryData.etiquetas));
    
    try {
        if (isEditing && currentQuery) {
            console.log('✏️ Actualizando consulta existente ID:', currentQuery.id);
            const response = await apiRequest(`/consultas/${currentQuery.id}`, {
                method: 'PUT',
                body: JSON.stringify(queryData)
            });
            showToast('Consulta actualizada exitosamente', 'success');
            return response;
        } else {
            console.log('🆕 Creando nueva consulta');
            console.log('📤 Enviando datos a /consultas:', JSON.stringify(queryData, null, 2));
            const response = await apiRequest('/consultas', {
                method: 'POST',
                body: JSON.stringify(queryData)
            });
            console.log('✅ Respuesta del servidor:', response);
            showToast('Consulta creada exitosamente', 'success');
            return response;
        }
    } catch (error) {
        console.error('❌ Error en saveQuery:', error);
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
    console.log('🎨 renderQueries() llamada');
    console.log('📋 queries.length:', queries.length);
    console.log('📋 queries:', queries);
    
    const searchTerm = searchInput.value.trim();
    
    if (queries.length === 0) {
        console.log('🚫 No hay consultas, mostrando estado vacío');
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
    
    console.log('✅ Hay consultas, procediendo a renderizar');
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
    
    console.log('🎨 Generando HTML para', queries.length, 'consultas');
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
            
            ${query.etiquetas && query.etiquetas.length > 0 ? `
                <div class="query-tags">
                    ${(Array.isArray(query.etiquetas) ? query.etiquetas : []).map(tag => 
                        `<span class="tag">${highlightSearchTerm(escapeHtml(String(tag).trim()), searchTermLower)}</span>`
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
    console.log('📝 Llenando formulario con:', query);
    document.getElementById('query-title').value = query.titulo || '';
    document.getElementById('query-description').value = query.descripcion || '';
    document.getElementById('query-author').value = query.autor || '';
    document.getElementById('query-sql').value = query.sql_codigo || '';
    
    // Manejar etiquetas como array
    const etiquetas = Array.isArray(query.etiquetas) 
        ? query.etiquetas.join(', ') 
        : (query.etiquetas || '');
    document.getElementById('query-tags').value = etiquetas;
    
    document.getElementById('query-favorite').checked = query.favorito || false;
}

function getFormData() {
    const formData = new FormData(queryForm);
    const data = {
        titulo: formData.get('titulo').trim(),
        descripcion: formData.get('descripcion').trim(),
        autor: formData.get('autor').trim(),
        sql_codigo: formData.get('sql_codigo').trim(),
        favorito: document.getElementById('query-favorite').checked
    };
    
    // Process tags
    const etiquetas = formData.get('etiquetas').trim();
    if (etiquetas) {
        data.etiquetas = etiquetas.split(',').map(tag => tag.trim()).filter(tag => tag);
    } else {
        data.etiquetas = [];
    }
    
    console.log('📝 getFormData() - Datos extraídos del formulario:', data);
    console.log('📝 Favorito value:', data.favorito, 'Type:', typeof data.favorito);
    console.log('📝 Etiquetas:', data.etiquetas, 'Type:', typeof data.etiquetas, 'Array:', Array.isArray(data.etiquetas));
    
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
        console.log('🔍 Consulta para editar:', response);
        openEditQueryModal(response);
    } catch (error) {
        console.error('❌ Error cargando consulta para editar:', error);
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