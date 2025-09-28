// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

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
        await loadQueries();
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showToast('Error al cargar la aplicación: ' + error.message, 'error');
        console.error('Error initializing app:', error);
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
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error en la solicitud');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
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
    if (queries.length === 0) {
        queriesList.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }
    
    queriesList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    
    queriesList.innerHTML = queries.map(query => `
        <div class="query-item" data-id="${query.id}">
            <div class="query-header">
                <h3 class="query-title">
                    ${escapeHtml(query.titulo)}
                    ${query.favorito ? '<span class="favorite-star">⭐</span>' : ''}
                </h3>
                <div class="query-actions">
                    <button class="secondary-btn" onclick="editQuery(${query.id})">✏️</button>
                    <button class="secondary-btn" onclick="confirmDelete(${query.id})">🗑️</button>
                </div>
            </div>
            
            <div class="query-meta">
                <span>📅 ${formatDate(query.fecha_creacion)}</span>
                ${query.autor ? `<span>👤 ${escapeHtml(query.autor)}</span>` : ''}
            </div>
            
            ${query.descripcion ? `
                <div class="query-description">
                    ${escapeHtml(query.descripcion)}
                </div>
            ` : ''}
            
            <div class="query-sql">
                <pre><code class="language-sql">${escapeHtml(query.sql_codigo)}</code></pre>
            </div>
            
            ${query.etiquetas ? `
                <div class="query-tags">
                    ${query.etiquetas.split(',').map(tag => 
                        `<span class="tag">${escapeHtml(tag.trim())}</span>`
                    ).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Apply syntax highlighting
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
}

function openNewQueryModal() {
    isEditing = false;
    currentQuery = null;
    modalTitle.textContent = 'Nueva Consulta SQL';
    saveBtn.innerHTML = '💾 Guardar';
    resetForm();
    showModal();
}

function openEditQueryModal(query) {
    isEditing = true;
    currentQuery = query;
    modalTitle.textContent = 'Editar Consulta SQL';
    saveBtn.innerHTML = '💾 Actualizar';
    fillForm(query);
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
    }
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