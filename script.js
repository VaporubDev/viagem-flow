const API_URL = 'http://localhost:5144/api';
const THEME_KEY = 'excel_theme';
let viagens = [];
let tarefas = [];

async function carregarDados() {
    try {
        const [viagensRes, tarefasRes] = await Promise.all([
            fetch(`${API_URL}/viagens`),
            fetch(`${API_URL}/tarefas`)
        ]);

        if (viagensRes.ok) viagens = await viagensRes.json();
        if (tarefasRes.ok) tarefas = await tarefasRes.json();

        atualizarTabela();
        carregarTarefas();
    } catch (error) {
        console.error('Erro ao carregar dados da API:', error);
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

const camposViagem = {
    nome: { label: 'Passageiro', tipo: 'text' },
    destino: { label: 'Destino', tipo: 'text' },
    dataIda: { label: 'Data de Ida', tipo: 'date' },
    dataVolta: { label: 'Data de Volta', tipo: 'date' },
    hotel: { label: 'Hotel', tipo: 'text' },
    status: { label: 'Status', tipo: 'status' },
    valor: { label: 'Valor', tipo: 'number' }
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

const posicionarMenuEdicao = (menu, x, y) => {
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    const rect = menu.getBoundingClientRect();
    const margem = 12;

    if (rect.right > window.innerWidth - margem) {
        menu.style.left = `${window.innerWidth - rect.width - margem}px`;
    }

    if (rect.bottom > window.innerHeight - margem) {
        menu.style.top = `${window.innerHeight - rect.height - margem}px`;
    }
};

const abrirMenuEdicao = (event, index, campo) => {
    event.preventDefault();
    fecharMenuEdicao();

    const config = camposViagem[campo];
    const viagem = viagens[index];
    const menu = document.createElement('div');
    menu.className = 'menu-edicao';

    const titulo = document.createElement('strong');
    titulo.textContent = `Editar ${config.label}`;
    menu.appendChild(titulo);

    if (config.tipo === 'status') {
        ['Pendente', 'Pago', 'Cancelado'].forEach(status => {
            const opcao = document.createElement('button');
            opcao.type = 'button';
            opcao.className = status === viagem.status ? 'status-opcao ativo' : 'status-opcao';
            opcao.textContent = status;
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
        salvar.textContent = 'Salvar';
        salvar.addEventListener('click', () => salvarCampoViagem(index, campo, input.value));

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') salvarCampoViagem(index, campo, input.value);
            if (e.key === 'Escape') fecharMenuEdicao();
        });

        menu.appendChild(input);
        menu.appendChild(salvar);
    }

    document.body.appendChild(menu);
    menuEdicao = menu;
    posicionarMenuEdicao(menu, event.clientX, event.clientY);

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
        <td class="celula-editavel" data-campo="status"><span class="status-badge ${getStatusClass(viagem.status)}">${viagem.status}</span></td>
        <td class="celula-editavel" data-campo="valor">${formatarMoeda(viagem.valor)}</td>
        <td><button type="button" class="btn-excluir-viagem" title="Excluir viagem" aria-label="Excluir viagem"></button></td>
    `;

    const btnExcluir = tr.querySelector('.btn-excluir-viagem');
    btnExcluir.addEventListener('click', async () => {
        const confirmar = confirm(`Deseja excluir a viagem de ${viagem.nome} para ${viagem.destino}?`);
        if (!confirmar) return;

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

const atualizarTabela = () => {
    tabelaBody.innerHTML = '';
    viagens.forEach(viagem => {
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

    const novaViagem = {
        nome: document.getElementById('nome').value,
        destino: document.getElementById('destino').value,
        dataIda: document.getElementById('dataIda').value,
        dataVolta: document.getElementById('dataVolta').value,
        hotel: document.getElementById('hotel').value,
        status: document.getElementById('status').value,
        valor: parseFloat(document.getElementById('valor').value)
    };

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

    const novaTarefa = { texto: texto, concluida: false };

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

const exportarParaExcel = () => {
    if (viagens.length === 0) {
        alert('Não há viagens cadastradas para exportar.');
        return;
    }

    let csvContent = "Passageiro;Destino;Data de Ida;Data de Volta;Hotel;Status;Valor\n";

    viagens.forEach(v => {
        const linha = [
            v.nome,
            v.destino,
            formatarData(v.dataIda),
            formatarData(v.dataVolta),
            v.hotel,
            v.status,
            v.valor.toString().replace('.', ',')
        ].join(";");
        
        csvContent += linha + "\n";
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_viagens_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
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
