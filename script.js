// Configuration
const navbarConfig = {
    'tributario': [
        { name: 'Agenda', icon: 'calendar', active: true },
        { name: 'Tools', icon: 'tools' },
        { name: 'Sidebar-1' }, { name: 'Sidebar-2' }, { name: 'Sidebar-3' },
        { name: 'Sidebar-4' }, { name: 'Sidebar-5' },
        { name: 'Impostazioni', icon: 'settings' }
    ],
};

const sampleEvents = [
    { date: 6, title: 'Riunione team', type: 'info' },
    { date: 14, title: 'Pagamento effettuato', type: 'success' },
    { date: 16, title: 'Scadenza IVA', type: 'danger' },
    { date: 24, title: 'Meeting cliente', type: 'info' },
    { date: 24, title: 'Revisione documenti', type: 'attention' },
    { date: 25, title: 'Scadenza F24', type: 'attention' },
    { date: 31, title: 'Dichiarazioni annuali', type: 'danger' }
];

// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebar-close');
const overlay = document.getElementById('overlay');
const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
const clientiToggle = document.getElementById('clienti-toggle');
const clientiSearch = document.getElementById('clienti-search');
const clientiIcon = document.getElementById('clienti-icon');
const navTabs = document.getElementById('nav-tabs');
const navTabsContent = document.getElementById('nav-tabs-content');
const viewDropdownBtn = document.getElementById('view-dropdown-btn');
const viewDropdownMenu = document.getElementById('view-dropdown-menu');
const viewDropdownItems = document.querySelectorAll('.view-dropdown-item');
const currentViewLabel = document.getElementById('current-view-label');
const addEventBtn = document.getElementById('add-event-btn');
const eventModalOverlay = document.getElementById('event-modal-overlay');
const modalClose = document.getElementById('modal-close');
const cancelEvent = document.getElementById('cancel-event');
const saveEvent = document.getElementById('save-event');
const eventForm = document.getElementById('event-form');

let clientiExpanded = false;
let currentView = 'month';

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

// Navbar Functions
function showNavbar(section) {
    if (navbarConfig[section]) {
        navTabsContent.innerHTML = '';
        navbarConfig[section].forEach(tab => {
            const el = document.createElement('a');
            el.href = '#';
            el.className = 'nav-tab' + (tab.active ? ' active' : '');
            el.textContent = tab.name;
            navTabsContent.appendChild(el);
        });
        navTabs.classList.add('visible');
    } else {
        navTabs.classList.remove('visible');
    }
}

// Calendar Generation Functions
function generateMonthView() {
    const container = document.getElementById('calendar-days-month');
    if (!container) return;
    
    container.innerHTML = '';
    const daysInMonth = 31;
    const firstDayOfWeek = 2;
    
    // Previous month days
    for (let i = 0; i < firstDayOfWeek; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<div class="calendar-day-number">${29 + i}</div>`;
        container.appendChild(day);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        if (i === 24) day.classList.add('today');
        
        const eventsForDay = sampleEvents.filter(e => e.date === i);
        let eventsHTML = '';
        if (eventsForDay.length > 0) {
            eventsHTML = '<div class="calendar-events">';
            eventsForDay.forEach(event => {
                eventsHTML += `<div class="calendar-event ${event.type}">${event.title}</div>`;
            });
            eventsHTML += '</div>';
        }
        
        day.innerHTML = `<div class="calendar-day-number">${i}</div>${eventsHTML}`;
        container.appendChild(day);
    }
    
    // Next month days
    const totalCells = Math.ceil((daysInMonth + firstDayOfWeek) / 7) * 7;
    const remainingCells = totalCells - (daysInMonth + firstDayOfWeek);
    for (let i = 1; i <= remainingCells; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        container.appendChild(day);
    }
}

function generateWeekView() {
    const grid = document.getElementById('week-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const hours = Array.from({length: 24}, (_, i) => i);
    
    hours.forEach(hour => {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'week-time-slot';
        timeSlot.textContent = `${hour.toString().padStart(2, '0')}:00`;
        grid.appendChild(timeSlot);
        
        for (let day = 0; day < 7; day++) {
            const daySlot = document.createElement('div');
            daySlot.className = 'week-day-slot';
            grid.appendChild(daySlot);
        }
    });
}

function generateDayView() {
    const timeline = document.getElementById('day-timeline');
    if (!timeline) return;
    
    timeline.innerHTML = '';
    const hours = Array.from({length: 24}, (_, i) => i);
    
    hours.forEach(hour => {
        const slot = document.createElement('div');
        slot.className = 'day-time-slot';
        
        const label = document.createElement('div');
        label.className = 'day-time-label';
        label.textContent = `${hour.toString().padStart(2, '0')}:00`;
        
        const content = document.createElement('div');
        content.className = 'day-time-content';
        
        slot.appendChild(label);
        slot.appendChild(content);
        timeline.appendChild(slot);
    });
}

// Calendar View Switching
function switchCalendarView(view) {
    currentView = view;
    
    // Update dropdown items
    viewDropdownItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
            const viewText = item.textContent;
            currentViewLabel.textContent = viewText === 'Mese' ? 'Vista mese' : 
                viewText === 'Settimana' ? 'Vista settimana' : 'Vista giorno';
        }
    });
    
    // Hide all views
    const monthView = document.querySelector('.month-view');
    const weekView = document.querySelector('.week-view');
    const dayView = document.querySelector('.day-view');
    
    if (monthView) monthView.classList.remove('active');
    if (weekView) weekView.classList.remove('active');
    if (dayView) dayView.classList.remove('active');
    
    // Show selected view
    const weekInfo = document.getElementById('calendar-week-info');
    if (view === 'month') {
        if (monthView) monthView.classList.add('active');
        if (weekInfo) weekInfo.textContent = 'Settimana 4';
    } else if (view === 'week') {
        if (weekView) weekView.classList.add('active');
        generateWeekView();
        if (weekInfo) weekInfo.textContent = 'Ott 20, 2025 – Ott 26, 2025';
    } else if (view === 'day') {
        if (dayView) dayView.classList.add('active');
        generateDayView();
        if (weekInfo) weekInfo.textContent = 'Venerdì 24 Ottobre 2025';
    }
    
    // Close dropdown
    if (viewDropdownMenu) viewDropdownMenu.classList.remove('active');
}

// Modal Functions
function openEventModal() {
    if (eventModalOverlay) {
        eventModalOverlay.classList.add('active');
        const dateInput = document.getElementById('event-date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }
}

function closeEventModal() {
    if (eventModalOverlay) {
        eventModalOverlay.classList.remove('active');
    }
    if (eventForm) {
        eventForm.reset();
    }
}

function saveNewEvent() {
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    const type = document.getElementById('event-type').value;
    const notes = document.getElementById('event-notes').value;
    
    if (!title || !date) {
        alert('Inserisci almeno titolo e data');
        return;
    }
    
    console.log('Nuovo evento:', { title, date, time, type, notes });
    alert(`Evento "${title}" salvato!`);
    closeEventModal();
}

// Section Switching
function switchSection(section) {
    document.querySelectorAll('[id^="view-"]').forEach(v => v.style.display = 'none');
    const targetView = document.getElementById('view-' + section);
    if (targetView) targetView.style.display = 'block';
    
    showNavbar(section);
    
    sidebarItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`[data-section="${section}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    if (section === 'tributario') {
        generateMonthView();
    }
    
    if (window.innerWidth < 768) closeSidebar();
}

// Event Listeners
if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
if (overlay) overlay.addEventListener('click', closeSidebar);
if (clientiToggle) clientiToggle.addEventListener('click', toggleClientiSearch);

sidebarItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        switchSection(section);
    });
});

if (viewDropdownBtn) {
    viewDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Dropdown clicked!');
        if (viewDropdownMenu) {
            viewDropdownMenu.classList.toggle('active');
            console.log('Dropdown active:', viewDropdownMenu.classList.contains('active'));
        }
    });
}

document.addEventListener('click', (e) => {
    if (viewDropdownBtn && viewDropdownMenu && 
        !viewDropdownBtn.contains(e.target) && 
        !viewDropdownMenu.contains(e.target)) {
        viewDropdownMenu.classList.remove('active');
    }
});

viewDropdownItems.forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchCalendarView(view);
    });
});

if (addEventBtn) addEventBtn.addEventListener('click', openEventModal);
if (modalClose) modalClose.addEventListener('click', closeEventModal);
if (cancelEvent) cancelEvent.addEventListener('click', closeEventModal);
if (saveEvent) saveEvent.addEventListener('click', saveNewEvent);

if (eventModalOverlay) {
    eventModalOverlay.addEventListener('click', (e) => {
        if (e.target === eventModalOverlay) closeEventModal();
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (eventModalOverlay && eventModalOverlay.classList.contains('active')) {
            closeEventModal();
        } else if (sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        } else if (viewDropdownMenu && viewDropdownMenu.classList.contains('active')) {
            viewDropdownMenu.classList.remove('active');
        }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSidebar();
    }
});

// Initialize
generateMonthView();
