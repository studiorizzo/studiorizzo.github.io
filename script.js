// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const overlay = document.getElementById('overlay');
const clientiToggle = document.getElementById('clienti-toggle');
const clientiSearch = document.getElementById('clienti-search');
const clientiIcon = document.getElementById('clienti-icon');
const searchInput = document.getElementById('client-search');
const searchResults = document.getElementById('search-results');

let clientiExpanded = false;

// Clients data
const clients = [];

// Sidebar Functions
function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

function toggleClientiSearch() {
    clientiExpanded = !clientiExpanded;
    clientiSearch.classList.toggle('visible');
    clientiIcon.innerHTML = clientiExpanded ?
        '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>' :
        '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215Z"></path></svg>';
}

// Search Functions
function getInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

function searchClients(query) {
    if (!query.trim()) {
        searchResults.innerHTML = '';
        return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(normalizedQuery) ||
        client.code.toLowerCase().includes(normalizedQuery)
    );

    if (filtered.length === 0) {
        searchResults.innerHTML = '<div class="no-results">Nessun cliente trovato</div>';
        return;
    }

    searchResults.innerHTML = filtered.map(client => `
        <div class="search-result-item" data-id="${client.id}">
            <div class="result-avatar">${getInitials(client.name)}</div>
            <div class="result-info">
                <div class="result-name">${client.name}</div>
                <div class="result-detail">${client.code} · ${client.type}</div>
            </div>
        </div>
    `).join('');
}

// Event Listeners
if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);
if (clientiToggle) clientiToggle.addEventListener('click', toggleClientiSearch);

if (searchInput) {
    searchInput.addEventListener('input', (e) => searchClients(e.target.value));
}

if (searchResults) {
    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            const client = clients.find(c => c.id === parseInt(item.dataset.id));
            if (client) {
                console.log('Selected client:', client);
                if (window.innerWidth < 768) closeSidebar();
            }
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSidebar();
    }
});
