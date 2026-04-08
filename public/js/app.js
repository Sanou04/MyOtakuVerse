/**
 * OtakuVerse - Professional Manga Ranking Website
 * JavaScript Application Module
 * 
 * Features:
 * - Dynamic manga loading from JSON
 * - Search functionality
 * - Genre filtering
 * - Sorting options
 * - Favorites system with localStorage
 * - Dark/Light theme toggle
 * - Responsive navigation
 * - Smooth animations
 * - Modal detail view
 * - Pagination/Load more
 */

// =============================================
// Configuration & State
// =============================================
const CONFIG = {
    MANGAS_PER_PAGE: 8,
    ANIMATION_DELAY: 100,
    SCROLL_THRESHOLD: 100,
    DATA_URL: 'data/mangas.json'
};

const state = {
    allMangas: [],
    filteredMangas: [],
    displayedCount: 0,
    favorites: [],
    currentFilters: {
        search: '',
        genre: 'all',
        status: 'all',
        sort: 'popularity'
    },
    isLoading: true
};

// =============================================
// DOM Elements
// =============================================
const elements = {
    // Loader
    loader: document.getElementById('loader'),
    
    // Header & Navigation
    header: document.getElementById('header'),
    nav: document.getElementById('nav'),
    burgerMenu: document.getElementById('burgerMenu'),
    navLinks: document.querySelectorAll('.nav-link'),
    themeToggle: document.getElementById('themeToggle'),
    
    // Search
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    
    // Filters
    genreFilter: document.getElementById('genreFilter'),
    sortFilter: document.getElementById('sortFilter'),
    statusFilter: document.getElementById('statusFilter'),
    resetFilters: document.getElementById('resetFilters'),
    
    // Grids
    topMangaGrid: document.getElementById('topMangaGrid'),
    trendingSlider: document.getElementById('trendingSlider'),
    favoritesGrid: document.getElementById('favoritesGrid'),
    
    // Load More & Empty States
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    emptyState: document.getElementById('emptyState'),
    emptyFavorites: document.getElementById('emptyFavorites'),
    
    // Modal
    modal: document.getElementById('mangaModal'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalClose: document.getElementById('modalClose'),
    modalBody: document.getElementById('modalBody'),
    
    // Stats
    totalMangas: document.getElementById('totalMangas'),
    totalGenres: document.getElementById('totalGenres'),
    totalFavorites: document.getElementById('totalFavorites'),
    
    // Back to Top
    backToTop: document.getElementById('backToTop')
};

// =============================================
// Utility Functions
// =============================================

/**
 * Debounce function to limit function calls
 */
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

/**
 * Generate star rating HTML
 */
function generateStarRating(rating, size = 14) {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 1;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>`;
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="half"><defs><linearGradient id="half-star-gradient"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="url(#half-star-gradient)" stroke="currentColor" stroke-width="1"/></svg>`;
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += `<svg width="${size}" height="${size}" viewBox="0 0 24 24" class="empty"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
    }
    
    return starsHTML;
}

/**
 * Get status class
 */
function getStatusClass(status) {
    const statusMap = {
        'En cours': 'ongoing',
        'Terminé': 'completed',
        'En pause': 'hiatus'
    };
    return statusMap[status] || '';
}

/**
 * Check if manga is in favorites
 */
function isFavorite(mangaId) {
    return state.favorites.includes(mangaId);
}

/**
 * Animate counter
 */
function animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// =============================================
// Data Management
// =============================================

/**
 * Fetch mangas from JSON file
 */
async function fetchMangas() {
    try {
        const response = await fetch(CONFIG.DATA_URL);
        if (!response.ok) throw new Error('Failed to fetch mangas');
        const data = await response.json();
        return data.mangas;
    } catch (error) {
        console.error('Error fetching mangas:', error);
        return [];
    }
}

/**
 * Load favorites from localStorage
 */
function loadFavorites() {
    const saved = localStorage.getItem('otakuverse_favorites');
    state.favorites = saved ? JSON.parse(saved) : [];
}

/**
 * Save favorites to localStorage
 */
function saveFavorites() {
    localStorage.setItem('otakuverse_favorites', JSON.stringify(state.favorites));
}

/**
 * Toggle favorite status
 */
function toggleFavorite(mangaId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    const index = state.favorites.indexOf(mangaId);
    if (index === -1) {
        state.favorites.push(mangaId);
    } else {
        state.favorites.splice(index, 1);
    }
    
    saveFavorites();
    updateFavoriteButtons(mangaId);
    renderFavorites();
    updateStats();
}

/**
 * Update all favorite buttons for a manga
 */
function updateFavoriteButtons(mangaId) {
    const buttons = document.querySelectorAll(`[data-favorite-id="${mangaId}"]`);
    buttons.forEach(btn => {
        if (isFavorite(mangaId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update modal button if open
    const modalBtn = document.querySelector('.modal-favorite-btn');
    if (modalBtn && modalBtn.dataset.mangaId == mangaId) {
        if (isFavorite(mangaId)) {
            modalBtn.classList.add('active');
            modalBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor"/></svg>
                Retirer des favoris
            `;
        } else {
            modalBtn.classList.remove('active');
            modalBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/></svg>
                Ajouter aux favoris
            `;
        }
    }
}

// =============================================
// Filtering & Sorting
// =============================================

/**
 * Apply all filters to manga list
 */
function applyFilters() {
    let filtered = [...state.allMangas];
    
    // Search filter
    if (state.currentFilters.search) {
        const searchTerm = state.currentFilters.search.toLowerCase();
        filtered = filtered.filter(manga => 
            manga.title.toLowerCase().includes(searchTerm) ||
            manga.titleJapanese.toLowerCase().includes(searchTerm) ||
            manga.author.toLowerCase().includes(searchTerm) ||
            manga.genres.some(g => g.toLowerCase().includes(searchTerm))
        );
    }
    
    // Genre filter
    if (state.currentFilters.genre !== 'all') {
        filtered = filtered.filter(manga => 
            manga.genres.includes(state.currentFilters.genre)
        );
    }
    
    // Status filter
    if (state.currentFilters.status !== 'all') {
        filtered = filtered.filter(manga => 
            manga.status === state.currentFilters.status
        );
    }
    
    // Sorting
    switch (state.currentFilters.sort) {
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'title':
            filtered.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'year':
            filtered.sort((a, b) => b.year - a.year);
            break;
        case 'chapters':
            filtered.sort((a, b) => b.chapters - a.chapters);
            break;
        case 'popularity':
        default:
            filtered.sort((a, b) => a.popularity - b.popularity);
            break;
    }
    
    state.filteredMangas = filtered;
    state.displayedCount = 0;
    
    renderMangaGrid();
}

/**
 * Reset all filters
 */
function resetFilters() {
    state.currentFilters = {
        search: '',
        genre: 'all',
        status: 'all',
        sort: 'popularity'
    };
    
    elements.searchInput.value = '';
    elements.genreFilter.value = 'all';
    elements.statusFilter.value = 'all';
    elements.sortFilter.value = 'popularity';
    elements.searchClear.classList.remove('visible');
    
    applyFilters();
}

// =============================================
// Rendering Functions
// =============================================

/**
 * Create manga card HTML
 */
function createMangaCard(manga, rank = null) {
    const isFav = isFavorite(manga.id);
    const statusClass = getStatusClass(manga.status);
    const delay = (rank || 0) * CONFIG.ANIMATION_DELAY;
    
    return `
        <article class="manga-card" data-manga-id="${manga.id}" style="animation-delay: ${delay}ms">
            <div class="manga-card-image">
                <img src="${manga.cover}" alt="${manga.title}" loading="lazy">
                <div class="manga-card-overlay"></div>
                ${rank ? `<span class="manga-rank">#${rank}</span>` : ''}
                <button class="manga-favorite ${isFav ? 'active' : ''}" data-favorite-id="${manga.id}" aria-label="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <span class="manga-status ${statusClass}">${manga.status}</span>
            </div>
            <div class="manga-card-content">
                <h3 class="manga-card-title">${manga.title}</h3>
                <div class="manga-card-meta">
                    <div class="manga-rating">
                        <div class="manga-rating-stars">
                            ${generateStarRating(manga.rating)}
                        </div>
                        <span class="manga-rating-value">${manga.rating.toFixed(1)}</span>
                    </div>
                </div>
                <div class="manga-genres">
                    ${manga.genres.slice(0, 2).map(g => `<span class="manga-genre">${g}</span>`).join('')}
                </div>
            </div>
        </article>
    `;
}

/**
 * Render manga grid with pagination
 */
function renderMangaGrid() {
    const mangasToShow = state.filteredMangas.slice(0, state.displayedCount + CONFIG.MANGAS_PER_PAGE);
    
    if (mangasToShow.length === 0) {
        elements.topMangaGrid.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        elements.loadMoreBtn.style.display = 'none';
    } else {
        elements.emptyState.classList.add('hidden');
        
        elements.topMangaGrid.innerHTML = mangasToShow.map((manga, index) => 
            createMangaCard(manga, index + 1)
        ).join('');
        
        state.displayedCount = mangasToShow.length;
        
        // Show/hide load more button
        if (state.displayedCount >= state.filteredMangas.length) {
            elements.loadMoreBtn.style.display = 'none';
        } else {
            elements.loadMoreBtn.style.display = 'inline-flex';
        }
        
        // Add click events to cards
        addCardEventListeners(elements.topMangaGrid);
    }
}

/**
 * Load more mangas
 */
function loadMoreMangas() {
    const startIndex = state.displayedCount;
    const endIndex = Math.min(startIndex + CONFIG.MANGAS_PER_PAGE, state.filteredMangas.length);
    const newMangas = state.filteredMangas.slice(startIndex, endIndex);
    
    newMangas.forEach((manga, index) => {
        const card = document.createElement('div');
        card.innerHTML = createMangaCard(manga, startIndex + index + 1);
        elements.topMangaGrid.appendChild(card.firstElementChild);
    });
    
    state.displayedCount = endIndex;
    
    // Hide load more if all displayed
    if (state.displayedCount >= state.filteredMangas.length) {
        elements.loadMoreBtn.style.display = 'none';
    }
    
    // Add events to new cards
    addCardEventListeners(elements.topMangaGrid);
}

/**
 * Render trending section
 */
function renderTrending() {
    const trendingMangas = state.allMangas.filter(m => m.trending);
    
    elements.trendingSlider.innerHTML = trendingMangas.map(manga => 
        createMangaCard(manga)
    ).join('');
    
    addCardEventListeners(elements.trendingSlider);
}

/**
 * Render favorites section
 */
function renderFavorites() {
    const favoriteMangas = state.allMangas.filter(m => state.favorites.includes(m.id));
    
    if (favoriteMangas.length === 0) {
        elements.favoritesGrid.innerHTML = '';
        elements.emptyFavorites.style.display = 'block';
    } else {
        elements.emptyFavorites.style.display = 'none';
        elements.favoritesGrid.innerHTML = favoriteMangas.map(manga => 
            createMangaCard(manga)
        ).join('');
        
        addCardEventListeners(elements.favoritesGrid);
    }
}

/**
 * Populate genre filter options
 */
function populateGenreFilter() {
    const allGenres = new Set();
    state.allMangas.forEach(manga => {
        manga.genres.forEach(genre => allGenres.add(genre));
    });
    
    const sortedGenres = Array.from(allGenres).sort();
    
    sortedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        elements.genreFilter.appendChild(option);
    });
    
    return sortedGenres.length;
}

/**
 * Update stats display
 */
function updateStats() {
    animateCounter(elements.totalMangas, state.allMangas.length);
    animateCounter(elements.totalFavorites, state.favorites.length);
}

// =============================================
// Modal Functions
// =============================================

/**
 * Open manga detail modal
 */
function openMangaModal(mangaId) {
    const manga = state.allMangas.find(m => m.id === mangaId);
    if (!manga) return;
    
    const isFav = isFavorite(manga.id);
    
    elements.modalBody.innerHTML = `
        <div class="modal-manga">
            <div class="modal-manga-image">
                <img src="${manga.cover}" alt="${manga.title}">
            </div>
            <div class="modal-manga-info">
                <div class="modal-manga-header">
                    <h2 class="modal-manga-title">${manga.title}</h2>
                    <p class="modal-manga-japanese">${manga.titleJapanese}</p>
                    <div class="modal-manga-rating">
                        <span class="modal-rating-value">${manga.rating.toFixed(1)}</span>
                        <div class="modal-rating-stars">
                            ${generateStarRating(manga.rating, 20)}
                        </div>
                    </div>
                </div>
                
                <div class="modal-manga-details">
                    <div class="detail-item">
                        <span class="detail-label">Auteur</span>
                        <span class="detail-value">${manga.author}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Statut</span>
                        <span class="detail-value">${manga.status}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Année</span>
                        <span class="detail-value">${manga.year}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Chapitres</span>
                        <span class="detail-value">${manga.chapters}+</span>
                    </div>
                </div>
                
                <div class="modal-manga-genres">
                    ${manga.genres.map(g => `<span class="modal-genre">${g}</span>`).join('')}
                </div>
                
                <div class="modal-manga-synopsis">
                    <h3>Synopsis</h3>
                    <p>${manga.synopsis}</p>
                </div>
                
                <button class="modal-favorite-btn ${isFav ? 'active' : ''}" data-manga-id="${manga.id}">
                    <svg viewBox="0 0 24 24" fill="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" ${isFav ? 'fill="currentColor"' : 'stroke="currentColor" stroke-width="2"'}/>
                    </svg>
                    ${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
            </div>
        </div>
    `;
    
    // Add event to modal favorite button
    const modalFavBtn = elements.modalBody.querySelector('.modal-favorite-btn');
    modalFavBtn.addEventListener('click', () => toggleFavorite(manga.id));
    
    elements.modal.classList.add('active');
    document.body.classList.add('no-scroll');
}

/**
 * Close modal
 */
function closeModal() {
    elements.modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// =============================================
// Event Listeners
// =============================================

/**
 * Add click events to manga cards
 */
function addCardEventListeners(container) {
    const cards = container.querySelectorAll('.manga-card');
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.manga-favorite')) {
                const mangaId = parseInt(card.dataset.mangaId);
                openMangaModal(mangaId);
            }
        });
    });
    
    const favoriteButtons = container.querySelectorAll('.manga-favorite');
    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const mangaId = parseInt(btn.dataset.favoriteId);
            toggleFavorite(mangaId, e);
        });
    });
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Burger menu toggle
    elements.burgerMenu.addEventListener('click', () => {
        elements.burgerMenu.classList.toggle('active');
        elements.nav.classList.toggle('active');
    });
    
    // Navigation links
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            elements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu
            elements.burgerMenu.classList.remove('active');
            elements.nav.classList.remove('active');
        });
    });
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('otakuverse_theme', newTheme);
    });
    
    // Search input
    elements.searchInput.addEventListener('input', debounce((e) => {
        state.currentFilters.search = e.target.value;
        
        if (e.target.value) {
            elements.searchClear.classList.add('visible');
        } else {
            elements.searchClear.classList.remove('visible');
        }
        
        applyFilters();
    }, 300));
    
    // Search clear
    elements.searchClear.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.currentFilters.search = '';
        elements.searchClear.classList.remove('visible');
        applyFilters();
    });
    
    // Genre filter
    elements.genreFilter.addEventListener('change', (e) => {
        state.currentFilters.genre = e.target.value;
        applyFilters();
    });
    
    // Sort filter
    elements.sortFilter.addEventListener('change', (e) => {
        state.currentFilters.sort = e.target.value;
        applyFilters();
    });
    
    // Status filter
    elements.statusFilter.addEventListener('change', (e) => {
        state.currentFilters.status = e.target.value;
        applyFilters();
    });
    
    // Reset filters
    elements.resetFilters.addEventListener('click', resetFilters);
    
    // Load more button
    elements.loadMoreBtn.addEventListener('click', loadMoreMangas);
    
    // Modal close
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', closeModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Scroll events
    window.addEventListener('scroll', debounce(() => {
        // Header shadow
        if (window.scrollY > CONFIG.SCROLL_THRESHOLD) {
            elements.header.classList.add('scrolled');
        } else {
            elements.header.classList.remove('scrolled');
        }
        
        // Back to top button
        if (window.scrollY > 500) {
            elements.backToTop.classList.add('visible');
        } else {
            elements.backToTop.classList.remove('visible');
        }
        
        // Update active nav link based on scroll position
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 100 && rect.bottom >= 100) {
                const id = section.getAttribute('id');
                elements.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('data-section') === id) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, 50));
    
    // Back to top button
    elements.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Footer genre links
    const genreLinks = document.querySelectorAll('[data-genre]');
    genreLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const genre = link.dataset.genre;
            elements.genreFilter.value = genre;
            state.currentFilters.genre = genre;
            applyFilters();
            document.getElementById('top-mangas').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// =============================================
// Theme Management
// =============================================

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('otakuverse_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Check for system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

// =============================================
// Initialization
// =============================================

/**
 * Initialize the application
 */
async function init() {
    // Initialize theme
    initTheme();
    
    // Load favorites from localStorage
    loadFavorites();
    
    // Fetch manga data
    state.allMangas = await fetchMangas();
    state.filteredMangas = [...state.allMangas];
    
    // Populate filters
    const genreCount = populateGenreFilter();
    
    // Update stats
    animateCounter(elements.totalMangas, state.allMangas.length);
    animateCounter(elements.totalGenres, genreCount);
    animateCounter(elements.totalFavorites, state.favorites.length);
    
    // Initialize event listeners
    initEventListeners();
    
    // Render initial content
    renderMangaGrid();
    renderTrending();
    renderFavorites();
    
    // Hide loader
    setTimeout(() => {
        elements.loader.classList.add('hidden');
        state.isLoading = false;
    }, 500);
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
