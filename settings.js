const API_URL = 'http://localhost:5144/api';
const THEME_KEY = 'excel_theme';
const PROFILE_KEY = 'flyeasy_profile';

// Mock data initialization if profile doesn't exist
const DEFAULT_PROFILE = {
    fullName: 'Marcus Richardson',
    email: 'm.richardson@flyeasy.com',
    phone: '+1 (555) 890-2344',
    timezone: 'GMT-5',
    role: 'Senior Travel Executive',
    language: 'en'
};

// Load saved data or initialize
let profile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || DEFAULT_PROFILE;

// DOM Elements
const profileForm = document.getElementById('profileForm');
const profileFullName = document.getElementById('profileFullName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileTimezone = document.getElementById('profileTimezone');
const profileNameDisplay = document.getElementById('profileNameDisplay');

const headerAvatar = document.getElementById('headerAvatar');
const headerAvatarFallback = document.getElementById('headerAvatarFallback');

const btnTema = document.getElementById('btnTema');

// Check if API is available (ping endpoint)
const checkAPI = async () => {
    try {
        const res = await fetch(`${API_URL}/viagens`, { method: 'GET', signal: AbortSignal.timeout(300) });
        return true;
    } catch(e) {
        return false;
    }
};

// Load profile values into inputs and display
const renderProfile = () => {
    profileFullName.value = profile.fullName || '';
    profileEmail.value = profile.email || '';
    profilePhone.value = profile.phone || '';
    profileTimezone.value = profile.timezone || 'GMT-5';

    profileNameDisplay.textContent = profile.fullName || '';

    // Update Avatar initials
    if (profile.avatar) {
        if (document.getElementById('profileImage')) {
            document.getElementById('profileImage').src = profile.avatar;
            document.getElementById('profileImage').style.display = 'block';
        }
        if (document.getElementById('profileImageFallback')) {
            document.getElementById('profileImageFallback').style.display = 'none';
        }
    } else {
        if (document.getElementById('profileImage')) {
            document.getElementById('profileImage').style.display = 'none';
        }
        if (document.getElementById('profileImageFallback')) {
            document.getElementById('profileImageFallback').style.display = 'flex';
        }
        if (profile.fullName) {
            const parts = profile.fullName.trim().split(/\s+/);
            let initials = '';
            if (parts.length > 1) {
                initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (parts[0]) {
                initials = parts[0].substring(0, 2).toUpperCase();
            }
            if (headerAvatarFallback) {
                headerAvatarFallback.textContent = initials;
            }
            if (document.getElementById('profileImageFallback')) {
                document.getElementById('profileImageFallback').textContent = initials;
            }
        }
    }
};

// Sync profile with backend if online
const loadProfileFromDB = async () => {
    const isOnline = await checkAPI();
    if (isOnline && profile.email) {
        try {
            const res = await fetch(`${API_URL}/perfis?email=${encodeURIComponent(profile.email)}`);
            if (res.ok) {
                const dbProfile = await res.json();
                profile = dbProfile;
                localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
                renderProfile();
            }
        } catch(e) {
            console.error('Error fetching profile from DB:', e);
        }
    }
};

// Save Profile
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profile.fullName = profileFullName.value;
        profile.email = profileEmail.value;
        profile.phone = profilePhone.value;
        profile.timezone = profileTimezone.value;

        const isOnline = await checkAPI();
        if (isOnline) {
            try {
                const res = await fetch(`${API_URL}/perfis`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                });
                if (res.ok) {
                    const saved = await res.json();
                    profile = saved;
                }
            } catch(err) {
                console.error('Error saving profile to DB:', err);
            }
        }

        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        renderProfile();
        alert(profile.language === 'pt' ? '✅ Perfil atualizado com sucesso!' : profile.language === 'es' ? '✅ ¡Perfil actualizado con éxito!' : '✅ Profile updated successfully!');
    });
}

// Local Avatar Image Upload
const btnEditAvatar = document.getElementById('btnEditAvatar');
const fileAvatarInput = document.getElementById('fileAvatarInput');

if (btnEditAvatar && fileAvatarInput) {
    btnEditAvatar.addEventListener('click', () => {
        fileAvatarInput.click();
    });

    fileAvatarInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target.result;
            profile.avatar = base64Image;
            
            // Save to LocalStorage
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
            
            // Update UI
            renderProfile();
            
            // Save to DB
            const isOnline = await checkAPI();
            if (isOnline) {
                try {
                    await fetch(`${API_URL}/perfis`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(profile)
                    });
                } catch (err) {
                    console.error('Error saving avatar to DB:', err);
                }
            }
        };
        reader.readAsDataURL(file);
    });
}

// Dark Mode Theme Logic
const updateThemeUI = (isDark) => {
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (btnTema) btnTema.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-mode');
        if (btnTema) btnTema.textContent = '🌙';
    }
};

const initTheme = () => {
    const isDark = localStorage.getItem(THEME_KEY) === 'dark';
    updateThemeUI(isDark);

    if (btnTema) {
        btnTema.addEventListener('click', () => {
            const currentDark = document.body.classList.contains('dark-mode');
            const nextDark = !currentDark;
            localStorage.setItem(THEME_KEY, nextDark ? 'dark' : 'light');
            updateThemeUI(nextDark);
        });
    }
};

// Language Selection
const langButtons = document.querySelectorAll('.lang-btn');
langButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
        langButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const selectedLang = btn.dataset.lang;
        profile.language = selectedLang;
        
        const isOnline = await checkAPI();
        if (isOnline) {
            try {
                await fetch(`${API_URL}/perfis`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profile)
                });
            } catch(e) {
                console.error(e);
            }
        }
        
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        
        // Execute global applyLanguage from translate.js
        if (typeof applyLanguage === 'function') {
            applyLanguage(selectedLang);
        }
    });
});

// Notifications Dropdown Menu
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
    menu.className = 'menu-edicao';
    menu.style.padding = '1.25rem 1.5rem';
    menu.style.textAlign = 'center';
    menu.style.width = '260px';
    
    const titulo = document.createElement('strong');
    titulo.textContent = profile.language === 'pt' ? 'Notificações' : profile.language === 'es' ? 'Notificaciones' : 'Notifications';
    titulo.style.display = 'block';
    titulo.style.marginBottom = '0.75rem';
    menu.appendChild(titulo);

    const mensagem = document.createElement('p');
    mensagem.textContent = profile.language === 'pt' ? '🔔 Nenhuma notificação por enquanto.' : profile.language === 'es' ? '🔔 Ninguna notificación por el momento.' : '🔔 No notifications for now.';
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

// Excel Download Implementation
const formatarData = (dataStr) => {
    if (!dataStr) return '-';
    const parts = dataStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dataStr;
};

const downloadSummary = async () => {
    const viagens = JSON.parse(localStorage.getItem('viagens_db')) || [];
    if (viagens.length === 0) {
        const errorMsg = profile.language === 'pt' ? 'Não há viagens cadastradas para exportar.' : profile.language === 'es' ? 'No hay viajes registrados para exportar.' : 'No registered trips to export.';
        alert(errorMsg);
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Relatório de Viagens');

    sheet.columns = [
        { header: 'Passageiro', key: 'nome', width: 25 },
        { header: 'Destino', key: 'destino', width: 25 },
        { header: 'Data de Ida', key: 'ida', width: 15 },
        { header: 'Data de Volta', key: 'volta', width: 15 },
        { header: 'Hotel', key: 'hotel', width: 30 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Valor (R$)', key: 'valor', width: 15 }
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    viagens.forEach(v => {
        sheet.addRow({
            nome: v.nome,
            destino: v.destino,
            ida: formatarData(v.dataIda),
            volta: formatarData(v.dataVolta),
            hotel: v.hotel,
            status: v.status,
            valor: parseFloat(v.valor) || 0
        });
    });

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
            row.getCell('valor').numFmt = '"R$" #,##0.00';
            row.getCell('ida').alignment = { horizontal: 'center' };
            row.getCell('volta').alignment = { horizontal: 'center' };
            row.getCell('status').alignment = { horizontal: 'center' };
        }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_viagens_${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const btnDownloadSummary = document.getElementById('btnDownloadSummary');
if (btnDownloadSummary) {
    btnDownloadSummary.addEventListener('click', downloadSummary);
}

// Annual PDF Download Implementation
const generatePDFReport = () => {
    try {
        const { jsPDF } = window.jspdf;
        
        const viagensLocal = localStorage.getItem('viagens_db');
        const todasViagens = viagensLocal ? JSON.parse(viagensLocal) : [];
        const viagens = todasViagens.filter(v => v.perfilId === profile.id || profile.id === undefined);
        
        if (viagens.length === 0) {
            alert(profile.language === 'pt' ? 'Não há viagens suficientes para gerar um relatório.' : 'Not enough trips to generate report.');
            return;
        }

        const totalViagens = viagens.length;
        const totalGasto = viagens.reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0);
        const pagas = viagens.filter(v => v.status === 'Pago').reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0);
        const pendentes = viagens.filter(v => v.status === 'Pendente').reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0);
        const canceladas = viagens.filter(v => v.status === 'Cancelado').reduce((sum, v) => sum + (parseFloat(v.valor) || 0), 0);

        // Hidden canvas for Chart
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.display = 'none';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Pago', 'Pendente', 'Cancelado'],
                datasets: [{
                    data: [pagas, pendentes, canceladas],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 1
                }]
            },
            options: {
                animation: false,
                responsive: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        const chartImage = canvas.toDataURL('image/png');
        chart.destroy();
        canvas.remove();

        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(75, 0, 130);
        doc.text(profile.language === 'pt' ? 'Relatório Anual de Viagens' : 'Annual Travel Report', 14, 20);
        
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.text(`Nome / Name: ${profile.fullName}`, 14, 30);
        doc.text(`Email: ${profile.email}`, 14, 37);
        doc.text(`Total de Viagens / Total Trips: ${totalViagens}`, 14, 44);
        
        const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGasto);
        doc.text(`Valor Total / Total Spent: ${formattedTotal}`, 14, 51);

        doc.addImage(chartImage, 'PNG', 14, 60, 90, 70);

        const tableData = viagens.map(v => [
            v.nome,
            v.destino,
            v.dataIda ? v.dataIda.split('-').reverse().join('/') : '-',
            v.status,
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(v.valor) || 0)
        ]);

        doc.autoTable({
            startY: 140,
            head: [['Passageiro', 'Destino', 'Data Ida', 'Status', 'Valor']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [75, 0, 130] }
        });

        doc.save(`Relatorio_Viagens_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch(err) {
        console.error('Erro ao gerar PDF:', err);
        alert('Ocorreu um erro ao gerar o PDF. Verifique o console.');
    }
};

const btnDownloadReport = document.getElementById('btnDownloadReport');
if (btnDownloadReport) {
    btnDownloadReport.addEventListener('click', generatePDFReport);
}

// Delete Account / Reset everything
const btnDeleteAccount = document.getElementById('btnDeleteAccount');
if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', async () => {
        const confirmMsg = profile.language === 'pt' 
            ? '⚠️ ATENÇÃO! ⚠️\n\nIsso irá apagar COMPLETAMENTE sua conta, viagens e tarefas locais e na nuvem.\n\nDeseja continuar?' 
            : profile.language === 'es' 
            ? '⚠️ ¡ATENCIÓN! ⚠️\n\nEsto borrará COMPLETAMENTE su cuenta, viajes y tareas locales y en la nube.\n\n¿Desea continuar?' 
            : '⚠️ WARNING! ⚠️\n\nThis will COMPLETELY delete your account, trips and tasks locally and in the cloud.\n\nDo you want to continue?';
            
        const redirectMsg = profile.language === 'pt' 
            ? '✅ Dados limpos. Redirecionando...' 
            : profile.language === 'es' 
            ? '✅ Datos limpios. Redireccionando...' 
            : '✅ Account and data cleared. Redirecting...';

        const confirmacao = confirm(confirmMsg);
        if (confirmacao) {
            const isOnline = await checkAPI();
            if (isOnline && profile && profile.id) {
                try {
                    await fetch(`${API_URL}/perfis/${profile.id}`, { method: 'DELETE' });
                } catch(e) {
                    console.error('Error deleting account from DB:', e);
                }
            }
            localStorage.clear();
            alert(redirectMsg);
            window.location.href = 'login.html';
        }
    });
}

// Logout logic
const btnLogoutSettings = document.getElementById('btnLogoutSettings');
if (btnLogoutSettings) {
    btnLogoutSettings.addEventListener('click', () => {
        localStorage.removeItem(PROFILE_KEY);
        window.location.href = 'login.html';
    });
}

// Extra Settings sub-card buttons mock behavior
const btnUpdatePassword = document.getElementById('btnUpdatePassword');
if (btnUpdatePassword) {
    btnUpdatePassword.addEventListener('click', () => {
        const alertMsg = profile.language === 'pt' ? '🔒 Gaveta de alteração de senha ativada (Simulação).' : profile.language === 'es' ? '🔒 Cajón de cambio de contraseña activado (Simulación).' : '🔒 Password modification drawer triggered (Simulation).';
        alert(alertMsg);
    });
}

const btnManageAlerts = document.getElementById('btnManageAlerts');
if (btnManageAlerts) {
    btnManageAlerts.addEventListener('click', () => {
        const alertMsg = profile.language === 'pt' ? '🔔 Painel de configuração de alertas ativado (Simulação).' : profile.language === 'es' ? '🔔 Panel de configuración de alertas activado (Simulación).' : '🔔 Alert configurations panel triggered (Simulation).';
        alert(alertMsg);
    });
}

// Initialize Page
renderProfile();
initTheme();
loadProfileFromDB();

// Set language button active based on profile language settings
if (profile.language) {
    const activeLangBtn = document.querySelector(`.lang-btn[data-lang="${profile.language}"]`);
    if (activeLangBtn) {
        langButtons.forEach(b => b.classList.remove('active'));
        activeLangBtn.classList.add('active');
        // Set initial language translations on load
        if (typeof applyLanguage === 'function') {
            applyLanguage(profile.language);
        }
    }
}
