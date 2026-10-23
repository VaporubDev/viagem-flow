(async function() {
    const API_URL = 'http://localhost:5144/api';
    const PROFILE_KEY = 'flyeasy_profile';

    // Verifica status da API
    const checkAPI = async () => {
        try {
            const res = await fetch(`${API_URL}/viagens`, { method: 'GET', signal: AbortSignal.timeout(300) });
            return true;
        } catch(e) {
            return false;
        }
    };

    const isOnline = await checkAPI();
    const isLoggedIn = !!localStorage.getItem(PROFILE_KEY);
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Redireciona para login se não autenticado
    if (isOnline && !isLoggedIn && currentPage !== 'login.html') {
        window.location.href = 'login.html';
        return;
    }

    // Atualiza interface de autenticação
    const updateAuthUI = () => {
        const navLinksContainer = document.querySelector('.nav-links');
        const headerActions = document.querySelector('.header-actions');
        const btnNovaViagem = document.getElementById('btnHeaderNovaViagem') || document.querySelector('.btn-nova-viagem-header');
        const userAvatar = document.getElementById('headerAvatar');

        if (isOnline && !isLoggedIn) {
            if (navLinksContainer) {
                const items = navLinksContainer.querySelectorAll('.nav-item');
                items.forEach(item => {
                    const i18n = item.getAttribute('data-i18n');
                    if (i18n !== 'nav_login') {
                        item.style.display = 'none';
                    } else {
                        item.style.display = 'inline-block';
                        item.classList.add('active');
                    }
                });
            }

            if (btnNovaViagem) btnNovaViagem.style.display = 'none';
            if (userAvatar) userAvatar.style.display = 'none';

            let btnLoginHeader = document.getElementById('btnLoginHeader');
            if (!btnLoginHeader && headerActions) {
                btnLoginHeader = document.createElement('button');
                btnLoginHeader.id = 'btnLoginHeader';
                btnLoginHeader.type = 'button';
                btnLoginHeader.className = 'btn-nova-viagem-header';
                btnLoginHeader.style.backgroundColor = 'var(--primary-color)';
                btnLoginHeader.style.boxShadow = '0 4px 12px rgba(88, 48, 224, 0.25)';
                btnLoginHeader.textContent = 'Login';
                btnLoginHeader.addEventListener('click', () => {
                    window.location.href = 'login.html';
                });
                headerActions.insertBefore(btnLoginHeader, headerActions.firstChild);
            }
        } else if (isOnline && isLoggedIn) {
            if (btnNovaViagem) btnNovaViagem.style.display = 'inline-block';
            if (userAvatar) userAvatar.style.display = 'flex';

            const btnLoginHeader = document.getElementById('btnLoginHeader');
            if (btnLoginHeader) btnLoginHeader.remove();

            if (navLinksContainer) {
                const loginItem = Array.from(navLinksContainer.querySelectorAll('.nav-item')).find(item => item.getAttribute('data-i18n') === 'nav_login');
                if (loginItem) {
                    loginItem.textContent = 'Logout';
                    loginItem.removeAttribute('data-i18n');
                    loginItem.href = '#';
                    loginItem.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem(PROFILE_KEY);
                        window.location.href = 'login.html';
                    });
                }
            }
        } else {
            if (btnNovaViagem) btnNovaViagem.style.display = 'inline-block';
            if (userAvatar) userAvatar.style.display = 'flex';

            const btnLoginHeader = document.getElementById('btnLoginHeader');
            if (btnLoginHeader) btnLoginHeader.remove();

            if (navLinksContainer) {
                const loginItem = Array.from(navLinksContainer.querySelectorAll('.nav-item')).find(item => item.getAttribute('data-i18n') === 'nav_login');
                if (loginItem) loginItem.style.display = 'none';
            }
        }

        // Atualiza avatar do cabeçalho
        const profileStr = localStorage.getItem(PROFILE_KEY);
        const prof = profileStr ? JSON.parse(profileStr) : null;
        if (prof && userAvatar) {
            userAvatar.title = prof.fullName || '';
            const fallbackSpan = userAvatar.querySelector('.avatar-fallback');
            if (prof.avatar) {
                userAvatar.style.background = `url(${prof.avatar}) center/cover no-repeat`;
                if (fallbackSpan) fallbackSpan.style.display = 'none';
            } else {
                userAvatar.style.background = 'linear-gradient(135deg, #fbcfe8, #c084fc, #818cf8)';
                if (fallbackSpan) {
                    fallbackSpan.style.display = 'inline-block';
                    const parts = (prof.fullName || 'US').trim().split(/\s+/);
                    let initials = '';
                    if (parts.length > 1) {
                        initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                    } else if (parts[0]) {
                        initials = parts[0].substring(0, 2).toUpperCase();
                    }
                    fallbackSpan.textContent = initials;
                }
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            updateAuthUI();
            setupAvatarDropdown();
        });
    } else {
        updateAuthUI();
        setupAvatarDropdown();
    }
})();

function setupAvatarDropdown() {
    const avatar = document.getElementById('headerAvatar');
    if (!avatar) return;

    let menuPerfil = null;

    const fecharMenu = () => {
        if (menuPerfil) {
            menuPerfil.remove();
            menuPerfil = null;
        }
    };

    avatar.addEventListener('click', (event) => {
        event.stopPropagation();
        if (menuPerfil) {
            fecharMenu();
            return;
        }

        document.dispatchEvent(new Event('click'));

        const profileStr = localStorage.getItem('flyeasy_profile');
        const prof = profileStr ? JSON.parse(profileStr) : null;
        if (!prof) return;

        menuPerfil = document.createElement('div');
        menuPerfil.className = 'menu-edicao profile-dropdown';
        menuPerfil.style.padding = '1.5rem';
        menuPerfil.style.width = '280px';
        menuPerfil.style.textAlign = 'center';
        menuPerfil.style.alignItems = 'center';
        menuPerfil.style.position = 'absolute';
        menuPerfil.style.zIndex = '9999';

        const avatarCircle = document.createElement('div');
        avatarCircle.style.width = '64px';
        avatarCircle.style.height = '64px';
        avatarCircle.style.borderRadius = '50%';
        avatarCircle.style.background = 'linear-gradient(135deg, #fbcfe8, #c084fc, #818cf8)';
        avatarCircle.style.display = 'flex';
        avatarCircle.style.alignItems = 'center';
        avatarCircle.style.justifyContent = 'center';
        avatarCircle.style.color = 'white';
        avatarCircle.style.fontWeight = 'bold';
        avatarCircle.style.fontSize = '1.5rem';
        avatarCircle.style.marginBottom = '1rem';
        avatarCircle.style.border = '3px solid white';
        avatarCircle.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';

        if (prof.avatar) {
            avatarCircle.style.background = `url(${prof.avatar}) center/cover no-repeat`;
            avatarCircle.textContent = '';
        } else {
            const parts = (prof.fullName || 'US').trim().split(/\s+/);
            let initials = '';
            if (parts.length > 1) {
                initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            } else if (parts[0]) {
                initials = parts[0].substring(0, 2).toUpperCase();
            }
            avatarCircle.textContent = initials;
        }
        menuPerfil.appendChild(avatarCircle);

        const nameEl = document.createElement('h3');
        nameEl.textContent = prof.fullName;
        nameEl.style.marginBottom = '0.25rem';
        nameEl.style.color = 'var(--text-main)';
        nameEl.style.fontSize = '1.1rem';
        menuPerfil.appendChild(nameEl);

        const emailEl = document.createElement('p');
        emailEl.textContent = prof.email;
        emailEl.style.fontSize = '0.85rem';
        emailEl.style.color = 'var(--text-muted)';
        emailEl.style.marginBottom = '1rem';
        menuPerfil.appendChild(emailEl);



        const appHeader = document.querySelector('.app-header');
        if (appHeader) {
            appHeader.appendChild(menuPerfil);
        } else {
            document.body.appendChild(menuPerfil);
        }

        const rect = avatar.getBoundingClientRect();
        const headerRect = appHeader ? appHeader.getBoundingClientRect() : { top: 0, left: 0 };
        
        menuPerfil.style.top = `${rect.bottom - headerRect.top + 12}px`;
        menuPerfil.style.left = `${rect.right - headerRect.left - 280}px`; 

        const menuRect = menuPerfil.getBoundingClientRect();
        if (rect.right - 280 < 10) {
            menuPerfil.style.left = '10px';
        }
    });

    document.addEventListener('click', (event) => {
        if (menuPerfil && !menuPerfil.contains(event.target)) {
            fecharMenu();
        }
    });
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') fecharMenu();
    });
}
