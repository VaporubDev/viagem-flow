const API_URL = 'http://localhost:5144/api';
const THEME_KEY = 'excel_theme';

// Helper para evitar lentidão esperando o timeout do navegador quando a API está offline
const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 300 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

const elTotalInvestido = document.getElementById('valTotalInvestido');
const elPendentes = document.getElementById('valPendentes');
const elDestinoMaisVisitado = document.getElementById('valDestinoMaisVisitado');
const btnTema = document.getElementById('btnTema');

let dadosViagens = [];
let chartStatusInstance = null;
let chartGastosInstance = null;

const isDarkMode = () => document.body.classList.contains('dark-mode');

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const atualizarBotaoTema = () => {
    const temaEscuro = isDarkMode();
    if (btnTema) {
        btnTema.textContent = temaEscuro ? '☀️' : '🌙';
        btnTema.setAttribute('aria-label', temaEscuro ? 'Ativar modo claro' : 'Ativar modo escuro');
        btnTema.setAttribute('title', temaEscuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    }
};

const alternarTema = () => {
    document.body.classList.toggle('dark-mode');
    const novoTema = isDarkMode() ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, novoTema);
    atualizarBotaoTema();
    
    if (dadosViagens.length > 0) {
        renderizarGraficos(dadosViagens);
    }
};

async function carregarDashboard() {
    if (btnTema) {
        btnTema.addEventListener('click', alternarTema);
        atualizarBotaoTema();
    }

    // 1. Carregar local imediatamente para renderização instantânea (0ms delay)
    const profileStrLocal = localStorage.getItem('flyeasy_profile');
    const profileLocal = profileStrLocal ? JSON.parse(profileStrLocal) : { id: 1 };

    const viagensLocal = localStorage.getItem('viagens_db');
    if (viagensLocal) {
        const todasViagens = JSON.parse(viagensLocal);
        dadosViagens = todasViagens.filter(v => v.perfilId === profileLocal.id);
    } else {
        dadosViagens = [];
    }

    if (dadosViagens.length > 0) {
        renderizarMetricas(dadosViagens);
        renderizarGraficos(dadosViagens);
    } else {
        exibirDadosVazios();
    }

    // 2. Buscar da API em segundo plano para sincronizar
    try {
        const response = await fetchWithTimeout(`${API_URL}/viagens?perfilId=${profileLocal.id}`, { timeout: 150 });
        if (response.ok) {
            dadosViagens = await response.json();
            localStorage.setItem('viagens_db', JSON.stringify(dadosViagens));
            
            // Re-renderiza com os dados atualizados do servidor
            renderizarMetricas(dadosViagens);
            renderizarGraficos(dadosViagens);
        }
    } catch (error) {
        console.warn('Backend offline no dashboard. Mantendo dados locais do localStorage.', error.message || error);
    }
}

function renderizarMetricas(viagens) {
    const total = viagens.reduce((sum, v) => sum + (v.valor || 0), 0);
    elTotalInvestido.textContent = formatarMoeda(total);

    const pendentesCount = viagens.filter(v => v.status === 'Pendente').length;
    elPendentes.textContent = `${pendentesCount} ${pendentesCount === 1 ? 'viagem' : 'viagens'}`;

    const contagemDestinos = {};
    viagens.forEach(v => {
        const dest = v.destino ? v.destino.trim() : '';
        if (dest) {
            contagemDestinos[dest] = (contagemDestinos[dest] || 0) + 1;
        }
    });

    let destinoMaisVisitado = '-';
    let maxVisitas = 0;
    for (const [destino, visitas] of Object.entries(contagemDestinos)) {
        if (visitas > maxVisitas) {
            maxVisitas = visitas;
            destinoMaisVisitado = destino;
        }
    }
    
    if (destinoMaisVisitado !== '-') {
        elDestinoMaisVisitado.textContent = `${destinoMaisVisitado} (${maxVisitas}x)`;
    } else {
        elDestinoMaisVisitado.textContent = '-';
    }
}

function exibirDadosVazios() {
    elTotalInvestido.textContent = formatarMoeda(0);
    elPendentes.textContent = '0 viagens';
    elDestinoMaisVisitado.textContent = '-';

    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    const ctxGastos = document.getElementById('chartGastosDestino').getContext('2d');

    ctxStatus.clearRect(0, 0, 300, 300);
    ctxStatus.font = '16px Outfit, sans-serif';
    ctxStatus.fillStyle = isDarkMode() ? '#948fb5' : '#6e6b8c';
    ctxStatus.textAlign = 'center';
    ctxStatus.fillText('Nenhuma viagem cadastrada', 150, 150);

    ctxGastos.clearRect(0, 0, 300, 300);
    ctxGastos.font = '16px Outfit, sans-serif';
    ctxGastos.fillStyle = isDarkMode() ? '#948fb5' : '#6e6b8c';
    ctxGastos.textAlign = 'center';
    ctxGastos.fillText('Nenhuma viagem cadastrada', 150, 100);
}

function renderizarGraficos(viagens) {
    const dark = isDarkMode();
    
    if (chartStatusInstance) chartStatusInstance.destroy();
    if (chartGastosInstance) chartGastosInstance.destroy();

    const textColor = dark ? '#f5f3ff' : '#1e1b4b';
    const gridColor = dark ? 'rgba(46, 38, 71, 0.5)' : 'rgba(232, 230, 242, 0.8)';
    const fontFamily = "'Outfit', sans-serif";

    const statusCounts = { 'Pago': 0, 'Pendente': 0, 'Cancelado': 0 };
    viagens.forEach(v => {
        if (statusCounts[v.status] !== undefined) {
            statusCounts[v.status]++;
        }
    });

    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    chartStatusInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['Pago', 'Pendente', 'Cancelado'],
            datasets: [{
                data: [statusCounts['Pago'], statusCounts['Pendente'], statusCounts['Cancelado']],
                backgroundColor: [
                    dark ? 'rgba(52, 211, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                    dark ? 'rgba(251, 191, 36, 0.85)' : 'rgba(245, 158, 11, 0.85)',
                    dark ? 'rgba(252, 165, 165, 0.85)' : 'rgba(239, 68, 68, 0.85)'
                ],
                borderColor: dark ? '#17122a' : '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor,
                        font: { family: fontFamily, size: 13, weight: '500' },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const val = context.raw || 0;
                            const totalVal = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((val / totalVal) * 100);
                            return ` ${label}: ${val} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });

    const gastosDestino = {};
    viagens.forEach(v => {
        const dest = v.destino ? v.destino.trim() : 'Sem Destino';
        gastosDestino[dest] = (gastosDestino[dest] || 0) + (v.valor || 0);
    });

    const destinosOrdenados = Object.entries(gastosDestino)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);

    const labelsDestino = destinosOrdenados.map(d => d[0]);
    const valoresDestino = destinosOrdenados.map(d => d[1]);

    const ctxGastos = document.getElementById('chartGastosDestino').getContext('2d');
    chartGastosInstance = new Chart(ctxGastos, {
        type: 'bar',
        data: {
            labels: labelsDestino,
            datasets: [{
                label: 'Total Gasto (R$)',
                data: valoresDestino,
                backgroundColor: 'rgba(124, 58, 237, 0.8)',
                hoverBackgroundColor: 'rgba(109, 40, 217, 0.95)',
                borderRadius: 6,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Total: ${formatarMoeda(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: textColor,
                        font: { family: fontFamily, size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: gridColor
                    },
                    ticks: {
                        color: textColor,
                        font: { family: fontFamily, size: 11 },
                        callback: function(value) {
                            if (value >= 1000) return 'R$ ' + (value / 1000) + 'k';
                            return 'R$ ' + value;
                        }
                    }
                }
            }
        }
    });
}
document.addEventListener('DOMContentLoaded', carregarDashboard);

// Notificações flutuantes no Dashboard
let menuNotificacoes = null;

const fecharMenuNotificacoes = () => {
    if (menuNotificacoes) {
        menuNotificacoes.remove();
        menuNotificacoes = null;
    }
};

const abrirMenuNotificacoes = (event) => {
    event.stopPropagation();
    fecharMenuNotificacoes();

    const menu = document.createElement('div');
    menu.className = 'menu-edicao'; // Reutiliza estilo do menu
    menu.style.padding = '1.25rem 1.5rem';
    menu.style.textAlign = 'center';
    menu.style.width = '260px';
    
    const titulo = document.createElement('strong');
    titulo.textContent = 'Notificações';
    titulo.style.display = 'block';
    titulo.style.marginBottom = '0.75rem';
    menu.appendChild(titulo);

    const mensagem = document.createElement('p');
    mensagem.textContent = '🔔 Nenhuma notificação por enquanto.';
    mensagem.style.fontSize = '0.9rem';
    mensagem.style.color = 'var(--text-muted)';
    mensagem.style.fontWeight = '600';
    menu.appendChild(mensagem);

    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        appHeader.appendChild(menu);
    } else {
        document.body.appendChild(menu);
    }
    menuNotificacoes = menu;

    const rectBtn = event.currentTarget.getBoundingClientRect();
    const headerRect = appHeader ? appHeader.getBoundingClientRect() : { top: 0, left: 0, right: window.innerWidth };
    
    menu.style.position = 'absolute';
    menu.style.top = `${rectBtn.bottom - headerRect.top}px`;
    menu.style.left = `${rectBtn.left - headerRect.left}px`;

    const rectMenu = menu.getBoundingClientRect();
    const limitRight = headerRect.right - headerRect.left;
    const currentLeft = rectBtn.left - headerRect.left;
    if (currentLeft + rectMenu.width > limitRight) {
        menu.style.left = `${limitRight - rectMenu.width - 16}px`;
    }
};

const btnNotificacoes = document.getElementById('btnNotificacoes');
if (btnNotificacoes) {
    btnNotificacoes.addEventListener('click', abrirMenuNotificacoes);
}

document.addEventListener('click', (event) => {
    if (menuNotificacoes && !menuNotificacoes.contains(event.target)) {
        fecharMenuNotificacoes();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        fecharMenuNotificacoes();
    }
});

// Update header avatar from saved profile
const updateHeaderAvatar = () => {
    const saved = localStorage.getItem('flyeasy_profile');
    if (saved) {
        try {
            const prof = JSON.parse(saved);
            if (prof.fullName) {
                const parts = prof.fullName.trim().split(/\s+/);
                let initials = '';
                if (parts.length > 1) {
                    initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                } else if (parts[0]) {
                    initials = parts[0].substring(0, 2).toUpperCase();
                }
                const fallback = document.getElementById('headerAvatarFallback');
                if (fallback) fallback.textContent = initials;
                
                const container = document.getElementById('headerAvatar');
                if (container) container.title = prof.fullName;
            }
        } catch(e) {
            console.error(e);
        }
    }
};
document.addEventListener('DOMContentLoaded', updateHeaderAvatar);
updateHeaderAvatar();

