// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const menuToggle = document.getElementById('menu-toggle');
const overlay = document.getElementById('overlay');
const searchInput = document.getElementById('client-search');
const searchResults = document.getElementById('search-results');

// Sample clients data (replace with actual data source)
const clients = [
    { id: 1, name: 'Mario Rossi', code: 'MR001', type: 'Azienda' },
    { id: 2, name: 'Giuseppe Verdi', code: 'GV002', type: 'Privato' },
    { id: 3, name: 'Anna Bianchi', code: 'AB003', type: 'Azienda' },
    { id: 4, name: 'Luca Ferrari', code: 'LF004', type: 'Privato' },
    { id: 5, name: 'Sara Conti', code: 'SC005', type: 'Azienda' },
    { id: 6, name: 'Marco Rizzo', code: 'MR006', type: 'Privato' },
    { id: 7, name: 'Elena Marino', code: 'EM007', type: 'Azienda' },
    { id: 8, name: 'Paolo Romano', code: 'PR008', type: 'Privato' },
];

// Sidebar functions
function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Search functions
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
                <div class="result-detail">${client.code} • ${client.type}</div>
            </div>
        </div>
    `).join('');
}

function handleClientClick(clientId) {
    const client = clients.find(c => c.id === parseInt(clientId));
    if (client) {
        console.log('Selected client:', client);
        // Close sidebar on mobile after selection
        if (window.innerWidth < 768) {
            closeSidebar();
        }
    }
}

// Event Listeners
if (menuToggle) {
    menuToggle.addEventListener('click', openSidebar);
}

if (sidebarClose) {
    sidebarClose.addEventListener('click', closeSidebar);
}

if (overlay) {
    overlay.addEventListener('click', closeSidebar);
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchClients(e.target.value);
    });

    // Focus search on Cmd/Ctrl + K
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (window.innerWidth < 768) {
                openSidebar();
            }
            searchInput.focus();
        }
    });
}

if (searchResults) {
    searchResults.addEventListener('click', (e) => {
        const item = e.target.closest('.search-result-item');
        if (item) {
            handleClientClick(item.dataset.id);
        }
    });
}

// Close sidebar on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        closeSidebar();
    }
});

// Handle window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth >= 768) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }, 100);
});
