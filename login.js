const API_URL = 'http://localhost:5144/api';
const THEME_KEY = 'excel_theme';
const PROFILE_KEY = 'flyeasy_profile';

// Toggle Form sections
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const sectionLogin = document.getElementById('sectionLogin');
const sectionRegister = document.getElementById('sectionRegister');

const switchTab = (tab) => {
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        sectionLogin.classList.add('active');
        sectionRegister.classList.remove('active');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        sectionLogin.classList.remove('active');
        sectionRegister.classList.add('active');
    }
};

tabLogin.addEventListener('click', () => switchTab('login'));
tabRegister.addEventListener('click', () => switchTab('register'));

// DOM Forms
const formLogin = document.getElementById('formLogin');
const formRegister = document.getElementById('formRegister');

// Offline accounts helper
const getOfflineAccounts = () => JSON.parse(localStorage.getItem('local_accounts')) || [];
const saveOfflineAccount = (acc) => {
    const accounts = getOfflineAccounts();
    accounts.push(acc);
    localStorage.setItem('local_accounts', JSON.stringify(accounts));
};

// Check if API is available (ping endpoint)
const checkAPI = async () => {
    try {
        const res = await fetch(`${API_URL}/viagens`, { method: 'GET', signal: AbortSignal.timeout(300) });
        return true;
    } catch(e) {
        return false;
    }
};

// Register Handler
formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const profileData = {
        fullName: name,
        email: email,
        password: password,
        phone: '',
        timezone: 'GMT-5',
        language: localStorage.getItem('flyeasy_lang') || 'en',
        role: 'Senior Travel Executive'
    };

    const isOnline = await checkAPI();

    if (isOnline) {
        try {
            const res = await fetch(`${API_URL}/perfis/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });

            if (res.ok) {
                const saved = await res.json();
                localStorage.setItem(PROFILE_KEY, JSON.stringify(saved));
                alert(profileData.language === 'pt' ? '✅ Conta registrada com sucesso!' : '✅ Account registered successfully!');
                window.location.href = 'index.html';
            } else {
                const text = await res.text();
                alert(`Error: ${text}`);
            }
        } catch(error) {
            console.error('API Error during register, falling back:', error);
            // fallback
            saveOfflineAccount(profileData);
            localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
            alert('✅ Registered offline fallback mode active!');
            window.location.href = 'index.html';
        }
    } else {
        // Fallback local registration
        saveOfflineAccount(profileData);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
        alert('✅ Registered offline fallback mode active!');
        window.location.href = 'index.html';
    }
});

// Login Handler
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const lang = localStorage.getItem('flyeasy_lang') || 'en';

    const isOnline = await checkAPI();

    if (isOnline) {
        try {
            const res = await fetch(`${API_URL}/perfis/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const profile = await res.json();
                localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
                if (profile.language) {
                    localStorage.setItem('flyeasy_lang', profile.language);
                }
                alert(lang === 'pt' ? '✅ Login bem-sucedido!' : '✅ Login successful!');
                window.location.href = 'index.html';
            } else {
                const text = await res.text();
                alert(lang === 'pt' ? `Erro: E-mail ou senha incorretos.` : `Error: Incorrect email or password.`);
            }
        } catch(error) {
            console.error('API Error during login, falling back:', error);
            // Local check
            performOfflineLogin(email, password, lang);
        }
    } else {
        performOfflineLogin(email, password, lang);
    }
});

const performOfflineLogin = (email, password, lang) => {
    const accounts = getOfflineAccounts();
    const match = accounts.find(a => a.email.toLowerCase() === email.toLowerCase() && a.password === password);
    if (match) {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(match));
        if (match.language) {
            localStorage.setItem('flyeasy_lang', match.language);
        }
        alert(lang === 'pt' ? '✅ Login offline bem-sucedido!' : '✅ Offline login successful!');
        window.location.href = 'index.html';
    } else {
        alert(lang === 'pt' ? '❌ E-mail ou senha incorretos (Offline)' : '❌ Incorrect email or password (Offline)');
    }
};

// Theme Sync logic
const btnTema = document.getElementById('btnTema');

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

// Update header avatar from saved profile
const updateHeaderAvatar = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
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

// Init
initTheme();
updateHeaderAvatar();
window.switchTab = switchTab;
