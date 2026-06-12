const API_URL = 'http://localhost:5144/api';
const THEME_KEY = 'excel_theme';
let viagens = [];
let tarefas = [];
let usingLocalFallback = false;

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

async function carregarDados() {
    // 1. Carregar dados locais imediatamente para evitar lag visual
    let viagensLocal = localStorage.getItem('viagens_db');
    let tarefasLocal = localStorage.getItem('tarefas_db');
    
    const profileStrLocal = localStorage.getItem('flyeasy_profile');
    const profileLocal = profileStrLocal ? JSON.parse(profileStrLocal) : { id: 1 };
    
    if (!viagensLocal) {
        const dadosDemoViagens = [
            { id: 1, perfilId: profileLocal.id, nome: "Cintia Souza", destino: "Paris, França", dataIda: "2026-09-15", dataVolta: "2026-09-25", hotel: "Hôtel Le Bristol", status: "Pago", valor: 12500.00 },
            { id: 2, perfilId: profileLocal.id, nome: "Cintia Souza", destino: "Orlando, EUA", dataIda: "2026-12-05", dataVolta: "2026-12-20", hotel: "Cabana Bay Resort", status: "Pendente", valor: 8900.00 },
            { id: 3, perfilId: profileLocal.id, nome: "Lucas Souza", destino: "Gramado, Brasil", dataIda: "2026-07-10", dataVolta: "2026-07-15", hotel: "Hotel Alpestre", status: "Pago", valor: 3200.00 }
        ];
        localStorage.setItem('viagens_db', JSON.stringify(dadosDemoViagens));
        viagensLocal = JSON.stringify(dadosDemoViagens);
    }
    
    if (!tarefasLocal) {
        const dadosDemoTarefas = [
            { id: 1, perfilId: profileLocal.id, texto: "Renovar passaporte", concluida: true },
            { id: 2, perfilId: profileLocal.id, texto: "Comprar moedas estrangeiras", concluida: false },
            { id: 3, perfilId: profileLocal.id, texto: "Fazer seguro viagem", concluida: false }
        ];
        localStorage.setItem('tarefas_db', JSON.stringify(dadosDemoTarefas));
        tarefasLocal = JSON.stringify(dadosDemoTarefas);
    }
    
    // Filtrar dados locais pelo usuário atual
    const todasViagens = JSON.parse(viagensLocal);
    const todasTarefas = JSON.parse(tarefasLocal);
    viagens = todasViagens.filter(v => v.perfilId === profileLocal.id);
    tarefas = todasTarefas.filter(t => t.perfilId === profileLocal.id);
    
    usingLocalFallback = true; // Default como offline-first
    
    // Renderiza instantaneamente (0ms de lag)
    atualizarTabela();
    carregarTarefas();

    // 2. Tenta atualizar dados em segundo plano (background)
    try {
        const [viagensRes, tarefasRes] = await Promise.all([
            fetchWithTimeout(`${API_URL}/viagens?perfilId=${profileLocal.id}`, { timeout: 150 }),
            fetchWithTimeout(`${API_URL}/tarefas?perfilId=${profileLocal.id}`, { timeout: 150 })
        ]);
        
        if (viagensRes.ok && tarefasRes.ok) {
            viagens = await viagensRes.json();
            tarefas = await tarefasRes.json();
            usingLocalFallback = false;
            localStorage.setItem('viagens_db', JSON.stringify(viagens));
            localStorage.setItem('tarefas_db', JSON.stringify(tarefas));
            console.log('Conectado à API backend SQLite. Dados sincronizados.');
            
            // Sincroniza e re-renderiza se houver novos dados do servidor
            atualizarTabela();
            carregarTarefas();
        }
    } catch (error) {
        console.warn('Mantendo modo offline (localStorage). API indisponível:', error.message || error);
    }
}

const form = document.getElementById('viagemForm');
const tabelaBody = document.querySelector('#tabelaViagens tbody');

const inputTarefa = document.getElementById('novaTarefa');
const btnAdicionarTarefa = document.getElementById('btnAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');

const btnExportarFooter = document.getElementById('btnExportarFooter');
const btnReiniciar = document.getElementById('btnReiniciar');
const btnTema = document.getElementById('btnTema');

const atualizarBotaoTema = () => {
    const temaEscuro = document.body.classList.contains('dark-mode');
    btnTema.textContent = temaEscuro ? '☀️' : '🌙';
    btnTema.setAttribute('aria-label', temaEscuro ? 'Ativar modo claro' : 'Ativar modo escuro');
    btnTema.setAttribute('title', temaEscuro ? 'Ativar modo claro' : 'Ativar modo escuro');
};

const aplicarTemaSalvo = () => {
    const temaSalvo = localStorage.getItem(THEME_KEY);
    if (temaSalvo === 'dark') {
        document.body.classList.add('dark-mode');
    }
    atualizarBotaoTema();
};

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
};

const getStatusClass = (status) => {
    if (status === 'Pago') return 'status-pago';
    if (status === 'Pendente') return 'status-pendente';
    return 'status-cancelado';
};

const getStatusTranslation = (status) => {
    const lang = localStorage.getItem('flyeasy_lang') || 'en';
    if (lang === 'pt') return status;
    if (status === 'Pago') return lang === 'es' ? 'Pagado' : 'Paid';
    if (status === 'Pendente') return lang === 'es' ? 'Pendiente' : 'Pending';
    return lang === 'es' ? 'Cancelado' : 'Canceled';
};

const getLabelTranslation = (key) => {
    const lang = localStorage.getItem('flyeasy_lang') || 'en';
    if (typeof translations !== 'undefined' && translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    return key;
};

const camposViagem = {
    nome: { labelKey: 'th_passenger', tipo: 'text' },
    destino: { labelKey: 'th_destino', tipo: 'text' },
    dataIda: { labelKey: 'th_ida', tipo: 'date' },
    dataVolta: { labelKey: 'th_volta', tipo: 'date' },
    hotel: { labelKey: 'th_hotel', tipo: 'text' },
    status: { labelKey: 'th_status', tipo: 'status' },
    valor: { labelKey: 'th_valor', tipo: 'number' }
};

let menuEdicao = null;

const fecharMenuEdicao = () => {
    if (menuEdicao) {
        menuEdicao.remove();
        menuEdicao = null;
    }
};

const salvarCampoViagem = async (index, campo, valor) => {
    const viagem = { ...viagens[index] };

    if (campo === 'valor') {
        const valorNumerico = parseFloat(String(valor).replace(',', '.'));
        if (Number.isNaN(valorNumerico)) {
            alert('Digite um valor válido.');
            return;
        }
        viagem[campo] = valorNumerico;
    } else {
        const novoValor = String(valor).trim();
        if (novoValor === '') {
            alert('Este campo não pode ficar vazio.');
            return;
        }
        viagem[campo] = novoValor;
    }

    if (usingLocalFallback) {
        viagens[index] = viagem;
        localStorage.setItem('viagens_db', JSON.stringify(viagens));
        atualizarTabela();
        fecharMenuEdicao();
        return;
    }

    try {
        const res = await fetch(`${API_URL}/viagens/${viagem.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(viagem)
        });
        
        if (res.ok) {
            viagens[index] = viagem;
            atualizarTabela();
        }
    } catch (error) {
        console.error('Erro ao atualizar viagem:', error);
    }
    
    fecharMenuEdicao();
};

const posicionarMenuEdicao = (menu, x, y, container) => {
    const containerRect = container.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.left = `${x - containerRect.left}px`;
    menu.style.top = `${y - containerRect.top}px`;

    const rect = menu.getBoundingClientRect();
    const margem = 12;

    if (rect.right > window.innerWidth - margem) {
        menu.style.left = `${window.innerWidth - rect.width - margem - containerRect.left}px`;
    }

    if (rect.bottom > window.innerHeight - margem) {
        menu.style.top = `${window.innerHeight - rect.height - margem - containerRect.top}px`;
    }
};

const abrirMenuEdicao = (event, index, campo) => {
    event.stopPropagation();
    event.preventDefault();
    fecharMenuEdicao();

    const config = camposViagem[campo];
    const viagem = viagens[index];
    const menu = document.createElement('div');
    menu.className = 'menu-edicao';

    const titulo = document.createElement('strong');
    const editLabel = getLabelTranslation('btn_filtrar') === 'Filter' ? 'Edit' : getLabelTranslation('btn_filtrar') === 'Filtrar' ? 'Editar' : 'Editar';
    titulo.textContent = `${editLabel} ${getLabelTranslation(config.labelKey)}`;
    menu.appendChild(titulo);

    if (config.tipo === 'status') {
        ['Pendente', 'Pago', 'Cancelado'].forEach(status => {
            const opcao = document.createElement('button');
            opcao.type = 'button';
            opcao.className = status === viagem.status ? 'status-opcao ativo' : 'status-opcao';
            opcao.textContent = getStatusTranslation(status);
            opcao.addEventListener('click', () => salvarCampoViagem(index, campo, status));
            menu.appendChild(opcao);
        });
    } else {
        const input = document.createElement('input');
        input.type = config.tipo;
        input.value = viagem[campo];

        if (campo === 'valor') {
            input.step = '0.01';
            input.min = '0';
        }

        const salvar = document.createElement('button');
        salvar.type = 'button';
        salvar.className = 'btn-salvar-edicao';
        salvar.textContent = getLabelTranslation('btn_save_changes') === 'Save Profile Changes' ? 'Save' : getLabelTranslation('btn_save_changes') === 'Salvar Alterações de Perfil' ? 'Salvar' : 'Guardar';
        salvar.addEventListener('click', () => salvarCampoViagem(index, campo, input.value));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') salvarCampoViagem(index, campo, input.value);
            if (e.key === 'Escape') fecharMenuEdicao();
        });

        menu.appendChild(input);
        menu.appendChild(salvar);
    }

    const container = event.currentTarget.closest('.list-section') || document.body;
    container.appendChild(menu);
    menuEdicao = menu;
    posicionarMenuEdicao(menu, event.clientX, event.clientY, container);

    const input = menu.querySelector('input');
    if (input) input.focus();
};

const criarElementoViagem = (viagem) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="celula-editavel" data-campo="nome">${viagem.nome}</td>
        <td class="celula-editavel" data-campo="destino">${viagem.destino}</td>
        <td class="celula-editavel" data-campo="dataIda">${formatarData(viagem.dataIda)}</td>
        <td class="celula-editavel" data-campo="dataVolta">${formatarData(viagem.dataVolta)}</td>
        <td class="celula-editavel" data-campo="hotel">${viagem.hotel}</td>
        <td class="celula-editavel" data-campo="status"><span class="status-badge ${getStatusClass(viagem.status)}">${getStatusTranslation(viagem.status)}</span></td>
        <td class="celula-editavel" data-campo="valor">${formatarMoeda(viagem.valor)}</td>
        <td><button type="button" class="btn-excluir-viagem" title="Excluir viagem" aria-label="Excluir viagem"></button></td>
    `;

    const btnExcluir = tr.querySelector('.btn-excluir-viagem');
    btnExcluir.addEventListener('click', async () => {
        const confirmMsg = getLabelTranslation('btn_filtrar') === 'Filter' 
            ? `Do you want to delete the trip for ${viagem.nome} to ${viagem.destino}?` 
            : `Deseja excluir a viagem de ${viagem.nome} para ${viagem.destino}?`;
        const confirmar = confirm(confirmMsg);
        if (!confirmar) return;

        if (usingLocalFallback) {
            viagens = viagens.filter(v => v.id !== viagem.id);
            localStorage.setItem('viagens_db', JSON.stringify(viagens));
            tr.remove();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/viagens/${viagem.id}`, { method: 'DELETE' });
            if (res.ok) {
                viagens = viagens.filter(v => v.id !== viagem.id);
                tr.remove();
            }
        } catch (error) {
            console.error('Erro ao excluir viagem:', error);
        }
    });

    tr.querySelectorAll('.celula-editavel').forEach(celula => {
        celula.addEventListener('contextmenu', (event) => {
            const index = viagens.findIndex(v => v.id === viagem.id);
            abrirMenuEdicao(event, index, celula.dataset.campo);
        });
    });

    return tr;
};

const atualizarTabela = (dadosParaExibir = viagens) => {
    tabelaBody.innerHTML = '';
    dadosParaExibir.forEach(viagem => {
        tabelaBody.appendChild(criarElementoViagem(viagem));
    });
};

const criarElementoTarefa = (tarefa) => {
    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox" ${tarefa.concluida ? 'checked' : ''}>
        <span style="text-decoration: ${tarefa.concluida ? 'line-through' : 'none'}">${tarefa.texto}</span>
        <button type="button" class="trash">✖</button>
    `;
    
    const checkbox = li.querySelector('input[type="checkbox"]');
    const trashBtn = li.querySelector('.trash');
    
    checkbox.addEventListener('change', async (e) => {
        const span = li.querySelector('span');
        span.style.textDecoration = e.target.checked ? 'line-through' : 'none';
        
        tarefa.concluida = e.target.checked;
        if (usingLocalFallback) {
            const tIndex = tarefas.findIndex(t => t.id === tarefa.id);
            if (tIndex !== -1) {
                tarefas[tIndex] = tarefa;
                localStorage.setItem('tarefas_db', JSON.stringify(tarefas));
            }
            return;
        }

        try {
            await fetch(`${API_URL}/tarefas/${tarefa.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tarefa)
            });
        } catch(error) {
            console.error('Erro ao atualizar tarefa:', error);
        }
    });
    
    trashBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (usingLocalFallback) {
            tarefas = tarefas.filter(t => t.id !== tarefa.id);
            localStorage.setItem('tarefas_db', JSON.stringify(tarefas));
            li.remove();
            return;
        }

        try {
            const res = await fetch(`${API_URL}/tarefas/${tarefa.id}`, { method: 'DELETE' });
            if (res.ok) {
                tarefas = tarefas.filter(t => t.id !== tarefa.id);
                li.remove();
            }
        } catch (error) {
            console.error('Erro ao excluir tarefa:', error);
        }
    });
    
    return li;
};

const carregarTarefas = () => {
    listaTarefas.innerHTML = '';
    tarefas.forEach(tarefa => {
        listaTarefas.appendChild(criarElementoTarefa(tarefa));
    });
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const profileStr = localStorage.getItem('flyeasy_profile');
    if (!profileStr) return;
    const profile = JSON.parse(profileStr);

    const novaViagem = {
        perfilId: profile.id,
        nome: document.getElementById('nome').value,
        destino: document.getElementById('destino').value,
        dataIda: document.getElementById('dataIda').value,
        dataVolta: document.getElementById('dataVolta').value,
        hotel: document.getElementById('hotel').value,
        status: document.getElementById('status').value,
        valor: parseFloat(document.getElementById('valor').value)
    };

    if (usingLocalFallback) {
        novaViagem.id = Date.now();
        viagens.push(novaViagem);
        localStorage.setItem('viagens_db', JSON.stringify(viagens));
        form.reset();
        tabelaBody.appendChild(criarElementoViagem(novaViagem));
        return;
    }

    try {
        const res = await fetch(`${API_URL}/viagens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaViagem)
        });
        
        if (res.ok) {
            const viagemSalva = await res.json();
            viagens.push(viagemSalva);
            form.reset();
            tabelaBody.appendChild(criarElementoViagem(viagemSalva));
        }
    } catch (error) {
        console.error('Erro ao cadastrar viagem:', error);
    }
});

const adicionarTarefa = async () => {
    const texto = inputTarefa.value.trim();
    if (texto === '') return;

    if (tarefas.some(t => t.texto === texto)) {
        alert('Esta tarefa já existe!');
        return;
    }

    const profileStr = localStorage.getItem('flyeasy_profile');
    if (!profileStr) return;
    const profile = JSON.parse(profileStr);

    const novaTarefa = { perfilId: profile.id, texto: texto, concluida: false };

    if (usingLocalFallback) {
        novaTarefa.id = Date.now();
        tarefas.push(novaTarefa);
        localStorage.setItem('tarefas_db', JSON.stringify(tarefas));
        inputTarefa.value = '';
        listaTarefas.appendChild(criarElementoTarefa(novaTarefa));
        return;
    }

    try {
        const res = await fetch(`${API_URL}/tarefas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaTarefa)
        });
        
        if (res.ok) {
            const tarefaSalva = await res.json();
            tarefas.push(tarefaSalva);
            inputTarefa.value = '';
            listaTarefas.appendChild(criarElementoTarefa(tarefaSalva));
        }
    } catch (error) {
        console.error('Erro ao cadastrar tarefa:', error);
    }
};

btnAdicionarTarefa.addEventListener('click', adicionarTarefa);
inputTarefa.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        adicionarTarefa();
    }
});

const exportarParaExcel = async () => {
    if (viagens.length === 0) {
        alert('Não há viagens cadastradas para exportar.');
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
        const row = sheet.addRow({
            nome: v.nome,
            destino: v.destino,
            ida: formatarData(v.dataIda),
            volta: formatarData(v.dataVolta),
            hotel: v.hotel,
            status: v.status,
            valor: v.valor
        });
        
        row.getCell('valor').numFmt = '"R$" #,##0.00';
        row.getCell('ida').alignment = { horizontal: 'center' };
        row.getCell('volta').alignment = { horizontal: 'center' };
        row.getCell('status').alignment = { horizontal: 'center' };
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
    
    alert('Exportação realizada com sucesso!');
};

const reiniciarTudo = async () => {
    const confirmacao = confirm(
        '⚠️ ATENÇÃO! ⚠️\n\n' +
        'Isso irá apagar TODOS os dados do banco de dados:\n' +
        '• Todas as viagens cadastradas\n' +
        '• Todas as tarefas do checklist\n\n' +
        'Esta ação não pode ser desfeita!\n\n' +
        'Tem certeza que deseja continuar?'
    );
    
    if (!confirmacao) return;
    
    if (usingLocalFallback) {
        viagens = [];
        tarefas = [];
        localStorage.removeItem('viagens_db');
        localStorage.removeItem('tarefas_db');
        atualizarTabela();
        carregarTarefas();
        if (form) form.reset();
        alert('✅ Todos os dados locais foram reiniciados!');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/sistema/reiniciar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
            await carregarDados();
            if (form) form.reset();
            alert('✅ Todos os dados foram reiniciados!');
        } else {
            alert('Erro ao tentar reiniciar o sistema.');
        }
    } catch(error) {
        console.error('Erro ao reiniciar banco:', error);
    }
};

if (btnExportarFooter) {
    btnExportarFooter.addEventListener('click', exportarParaExcel);
}

if (btnReiniciar) {
    btnReiniciar.addEventListener('click', reiniciarTudo);
}

if (btnTema) {
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem(THEME_KEY, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
        atualizarBotaoTema();
    });
}

document.addEventListener('click', (event) => {
    if (menuEdicao && !menuEdicao.contains(event.target)) {
        fecharMenuEdicao();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        fecharMenuEdicao();
    }
});

aplicarTemaSalvo();
carregarDados();

const btnHeaderNovaViagem = document.getElementById('btnHeaderNovaViagem');
if (btnHeaderNovaViagem) {
    btnHeaderNovaViagem.addEventListener('click', () => {
        const formSec = document.querySelector('.form-section');
        if (formSec) {
            formSec.scrollIntoView({ behavior: 'smooth' });
            const inputNome = document.getElementById('nome');
            if (inputNome) inputNome.focus();
        }
    });
}

// Filtro e Ordenação
let menuFiltro = null;

const fecharMenuFiltro = () => {
    if (menuFiltro) {
        menuFiltro.remove();
        menuFiltro = null;
    }
};

const abrirMenuFiltro = (event) => {
    event.stopPropagation();
    fecharMenuFiltro();
    fecharMenuEdicao();
    fecharMenuNotificacoes();

    const menu = document.createElement('div');
    menu.className = 'menu-edicao'; // Reutiliza estilo do menu de edição
    
    const titulo = document.createElement('strong');
    titulo.textContent = 'Filtros e Ordenação';
    menu.appendChild(titulo);

    const opcoes = [
        {
            texto: 'Valor: Maior primeiro',
            acao: () => {
                const ordenado = [...viagens].sort((a, b) => b.valor - a.valor);
                atualizarTabela(ordenado);
            }
        },
        {
            texto: 'Valor: Menor primeiro',
            acao: () => {
                const ordenado = [...viagens].sort((a, b) => a.valor - b.valor);
                atualizarTabela(ordenado);
            }
        },
        {
            texto: 'Destino mais frequente',
            acao: () => {
                const contagem = {};
                viagens.forEach(v => {
                    const dest = v.destino || '';
                    contagem[dest] = (contagem[dest] || 0) + 1;
                });
                const ordenado = [...viagens].sort((a, b) => {
                    const freqA = contagem[a.destino || ''] || 0;
                    const freqB = contagem[b.destino || ''] || 0;
                    return freqB - freqA;
                });
                atualizarTabela(ordenado);
            }
        },
        {
            texto: 'Data de Ida: Mais próxima',
            acao: () => {
                const ordenado = [...viagens].sort((a, b) => new Date(a.dataIda) - new Date(b.dataIda));
                atualizarTabela(ordenado);
            }
        },
        {
            texto: 'Filtrar: Apenas Pago',
            acao: () => {
                const filtrado = viagens.filter(v => v.status === 'Pago');
                atualizarTabela(filtrado);
            }
        },
        {
            texto: 'Filtrar: Apenas Pendente',
            acao: () => {
                const filtrado = viagens.filter(v => v.status === 'Pendente');
                atualizarTabela(filtrado);
            }
        },
        {
            texto: 'Limpar filtros / Padrão',
            acao: () => {
                atualizarTabela(viagens);
            }
        }
    ];

    opcoes.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'status-opcao';
        btn.textContent = opt.texto;
        btn.addEventListener('click', () => {
            opt.acao();
            fecharMenuFiltro();
        });
        menu.appendChild(btn);
    });

    const listHeader = document.querySelector('.list-header');
    listHeader.appendChild(menu);
    menuFiltro = menu;

    const rectBtn = event.currentTarget.getBoundingClientRect();
    const headerRect = listHeader.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rectBtn.bottom - headerRect.top}px`;
    menu.style.left = `${rectBtn.left - headerRect.left}px`;

    const rectMenu = menu.getBoundingClientRect();
    if (rectMenu.right > headerRect.right) {
        menu.style.left = `${headerRect.right - rectMenu.width - 16 - headerRect.left}px`;
    }
};

const btnFiltrar = document.getElementById('btnFiltrar');
if (btnFiltrar) {
    btnFiltrar.addEventListener('click', abrirMenuFiltro);
}

document.addEventListener('click', (event) => {
    if (menuFiltro && !menuFiltro.contains(event.target)) {
        fecharMenuFiltro();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        fecharMenuFiltro();
    }
});

// Notificações flutuantes
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
    fecharMenuEdicao();
    fecharMenuFiltro();

    const menu = document.createElement('div');
    menu.className = 'menu-edicao'; // Reutiliza estilo do menu de edição
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

