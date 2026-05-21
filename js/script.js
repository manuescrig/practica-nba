// ============================================================
// VARIABLES GLOBALES (Se llenan asíncronamente)
// ============================================================
let awards = [];
let players = [];
let currentFiltered = [];
let currentModalPlayerId = null;

// ============================================================
// REFERENCIAS AL DOM
// ============================================================
const playersContainer = document.getElementById('playersContainer');
const searchInput      = document.getElementById('searchInput');
const positionFilter   = document.getElementById('positionFilter');
const teamFilter       = document.getElementById('teamFilter');
const sortFilter       = document.getElementById('sortFilter');
const premioFilter     = document.getElementById('premioFilter');
const resultsCount     = document.getElementById('resultsCount');
const clearFiltersBtn  = document.getElementById('clearFiltersBtn');
const awardsGrid       = document.getElementById('awardsGrid');

// Modal
const playerModal     = document.getElementById('playerModal');
const modalOverlay    = document.getElementById('modalOverlay');
const modalClose      = document.getElementById('modalClose');
const modalImage      = document.getElementById('modalImage');
const modalPlayerName = document.getElementById('modalPlayerName');
const modalTeam       = document.getElementById('modalTeam');
const modalPosition   = document.getElementById('modalPosition');
const modalPPP        = document.getElementById('modalPPP');
const modalRank       = document.getElementById('modalRank');
const modalAwardBanner= document.getElementById('modalAwardBanner');
const modalEditBtn    = document.getElementById('modalEditBtn');

// Stats
const statTotal   = document.getElementById('statTotal');
const statAvgPPP  = document.getElementById('statAvgPPP');
const statMaxPPP  = document.getElementById('statMaxPPP');

// ============================================================
// RENDERIZADO DEL BANNER DE PREMIOS
// ============================================================
function renderAwards() {
    awardsGrid.innerHTML = '';

    awards.forEach(award => {
        const card = document.createElement('div');
        card.classList.add('award-card');
        card.dataset.premio = award.tipo;

        card.innerHTML = `
            <img
                src="${award.foto}"
                alt="${award.nombre}"
                class="award-photo"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(award.nombre)}&background=4a3000&color=FFB800&bold=true&size=128'"
            >
            <div class="award-text">
                <span class="award-type">${award.emoji} ${award.tipo}</span>
                <span class="award-name">${award.nombre}</span>
                <span class="award-team">${award.equipo}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            premioFilter.value = award.tipo;
            filterAndSortPlayers();
            document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
        });

        awardsGrid.appendChild(card);
    });
}

// ============================================================
// RENDERIZADO DE TARJETAS DE JUGADORES
// ============================================================
function renderPlayers(playersToRender) {
    playersContainer.innerHTML = '';

    if (playersToRender.length === 0) {
        playersContainer.innerHTML = `
            <div class="no-results">
                <span class="no-results-icon">🔍</span>
                <h3>No se encontraron jugadores</h3>
                <p>Prueba a cambiar los filtros de búsqueda.</p>
            </div>
        `;
        return;
    }

    playersToRender.forEach((player, index) => {
        const card = document.createElement('div');
        card.classList.add('player-card');

        if (player.premios && player.premios.length > 0) {
            card.classList.add('has-award');
        }

        card.style.animationDelay = `${index * 0.035}s`;
        card.dataset.playerId = player.id;

        const awardBadgeHTML = (player.premios && player.premios.length > 0)
            ? `<span class="card-award-badge">🏆 ${player.premios[0]}</span>`
            : '';

        card.innerHTML = `
            ${awardBadgeHTML}
            <span class="card-pos-badge">${player.posicion}</span>
            <img
                src="${player.url_imagen}"
                alt="Foto oficial de ${player.nombre}"
                class="player-image"
                loading="lazy"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(player.nombre)}&background=0f2a5c&color=a8c4f8&bold=true&size=256'"
            >
            <div class="player-info">
                <h2>${player.nombre}</h2>
                <p class="player-team">🏀 ${player.equipo}</p>
                <div class="stat">
                    <span class="stat-value">${player.puntos_por_partido}</span>
                    <span class="stat-unit">PPP</span>
                </div>
            </div>
        `;

        playersContainer.appendChild(card);
    });

    resultsCount.textContent =
        `Mostrando ${playersToRender.length} jugador${playersToRender.length !== 1 ? 'es' : ''}`;
}

// ============================================================
// ESTADÍSTICAS
// ============================================================
function updateStats(filteredPlayers) {
    statTotal.textContent = filteredPlayers.length;

    if (filteredPlayers.length === 0) {
        statAvgPPP.textContent = '--';
        statMaxPPP.textContent = '--';
        return;
    }

    const allPoints = filteredPlayers.map(p => p.puntos_por_partido);
    const totalPoints = allPoints.reduce((acumulador, ppp) => acumulador + ppp, 0);
    statAvgPPP.textContent = (totalPoints / filteredPlayers.length).toFixed(1);
    statMaxPPP.textContent  = Math.max(...allPoints);
}

// ============================================================
// FILTRADO Y ORDENACIÓN
// ============================================================
function filterAndSortPlayers() {
    const searchTerm    = searchInput.value.toLowerCase().trim();
    const selectedPos   = positionFilter.value;
    const selectedTeam  = teamFilter.value;
    const selectedSort  = sortFilter.value;
    const selectedPremio= premioFilter.value;

    let result = players.filter(player => {
        const matchesName  = player.nombre.toLowerCase().includes(searchTerm);
        const matchesPos   = selectedPos  === '' || player.posicion === selectedPos;
        const matchesTeam  = selectedTeam === '' || player.equipo   === selectedTeam;
        const matchesPremio = selectedPremio === ''
            || (player.premios && player.premios.includes(selectedPremio));

        return matchesName && matchesPos && matchesTeam && matchesPremio;
    });

    result = result.sort((a, b) => {
        switch (selectedSort) {
            case 'nombre_asc':  return a.nombre.localeCompare(b.nombre, 'es');
            case 'nombre_desc': return b.nombre.localeCompare(a.nombre, 'es');
            case 'ppp_desc':    return b.puntos_por_partido - a.puntos_por_partido;
            case 'ppp_asc':     return a.puntos_por_partido - b.puntos_por_partido;
            default:            return 0;
        }
    });

    currentFiltered = result;
    renderPlayers(result);
    updateStats(result);
}

// ============================================================
// MODAL DE DETALLE
// ============================================================
function openModal(playerId) {
    currentModalPlayerId = playerId;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const rankList = [...players].sort((a, b) => b.puntos_por_partido - a.puntos_por_partido);
    const rank     = rankList.findIndex(p => p.id === playerId) + 1;

    modalImage.src                = player.url_imagen;
    modalImage.alt                = `Foto oficial NBA de ${player.nombre}`;
    modalPlayerName.textContent   = player.nombre;
    modalTeam.textContent         = `🏀 ${player.equipo}`;
    modalPosition.textContent     = player.posicion;
    modalPPP.textContent          = player.puntos_por_partido;
    modalRank.textContent         = `#${rank} / ${players.length}`;

    modalImage.onerror = () => {
        modalImage.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nombre)}&background=0f2a5c&color=a8c4f8&bold=true&size=512`;
    };

    if (player.premios && player.premios.length > 0) {
        const textos = {
            MVP:     "🏆 MVP Temporada 2024-25",
            CAMPEÓN: "🥇 Campeón NBA 2024-25",
            DPOY:    "🛡️ Mejor Defensor (DPOY) 2024-25",
            ROY:     "⭐ Rookie del Año (ROY) 2024-25",
            MIP:     "📈 Jugador Más Mejorado (MIP) 2024-25",
            SMOY:    "💪 Mejor Sexto Hombre (SMOY) 2024-25"
        };
        modalAwardBanner.textContent = player.premios.map(p => textos[p] || p).join("  ·  ");
        modalAwardBanner.style.display = 'block';
    } else {
        modalAwardBanner.style.display = 'none';
    }

    playerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    playerModal.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
// EVENT LISTENERS
// ============================================================
searchInput.addEventListener('input',   filterAndSortPlayers);
positionFilter.addEventListener('change', filterAndSortPlayers);
teamFilter.addEventListener('change',     filterAndSortPlayers);
sortFilter.addEventListener('change',     filterAndSortPlayers);
premioFilter.addEventListener('change',   filterAndSortPlayers);

clearFiltersBtn.addEventListener('click', () => {
    searchInput.value    = '';
    positionFilter.value = '';
    teamFilter.value     = '';
    sortFilter.value     = 'nombre_asc';
    premioFilter.value   = '';
    filterAndSortPlayers();
});

playersContainer.addEventListener('click', event => {
    const card = event.target.closest('.player-card');
    if (card) openModal(parseInt(card.dataset.playerId, 10));
});

modalClose.addEventListener('click',   closeModal);
modalOverlay.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

modalEditBtn.addEventListener('click', () => {
    if (currentModalPlayerId === null) return;
    const playerIndex = players.findIndex(p => p.id === currentModalPlayerId);
    if (playerIndex === -1) return;

    const newPPP = prompt(`Introduce los nuevos puntos por partido para ${players[playerIndex].nombre}:`, players[playerIndex].puntos_por_partido);
    if (newPPP !== null && !isNaN(newPPP) && newPPP.trim() !== '') {
        players[playerIndex].puntos_por_partido = parseFloat(newPPP);
        filterAndSortPlayers(); // to update main grid and stats
        openModal(currentModalPlayerId); // refresh modal data
    }
});

// ============================================================
// INICIALIZACIÓN ASÍNCRONA
// ============================================================
async function initApp() {
    try {
        const [awardsRes, playersRes] = await Promise.all([
            fetch('data/awards.json'),
            fetch('data/players.json')
        ]);

        if (!awardsRes.ok || !playersRes.ok) {
            throw new Error('Error al cargar los datos desde los archivos JSON.');
        }

        awards = await awardsRes.json();
        players = await playersRes.json();
        
        currentFiltered = [...players];

        renderAwards();
        filterAndSortPlayers();
    } catch (error) {
        console.error("Error inicializando la app:", error);
        playersContainer.innerHTML = `
            <div class="no-results">
                <h3>Error cargando datos ⚠️</h3>
                <p>Recuerda que debido a CORS, debes abrir este archivo mediante un servidor local (Live Server), no con doble clic.</p>
            </div>
        `;
    }
}

// Iniciar aplicación
initApp();
