// Array para armazenar as viagens em memória
let viagens = [];

// Elementos do DOM
const form = document.getElementById('viagemForm');
const tabelaBody = document.querySelector('#tabelaViagens tbody');
const btnExportar = document.getElementById('btnExportar');

// Elementos do Checklist
const inputTarefa = document.getElementById('novaTarefa');
const btnAdicionarTarefa = document.getElementById('btnAdicionarTarefa');
const listaTarefas = document.getElementById('listaTarefas');

// Formatador de Moeda (Real)
const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

// Formatador de Data (DD/MM/AAAA)
const formatarData = (dataStr) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
};

// Retorna a classe CSS baseada no status
const getStatusClass = (status) => {
    if (status === 'Pago') return 'status-pago';
    if (status === 'Pendente') return 'status-pendente';
    return 'status-cancelado';
};

// Renderiza a tabela de viagens
const atualizarTabela = () => {
    tabelaBody.innerHTML = '';
    
    viagens.forEach(viagem => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${viagem.nome}</td>
            <td>${viagem.destino}</td>
            <td>${formatarData(viagem.dataIda)}</td>
            <td>${formatarData(viagem.dataVolta)}</td>
            <td>${viagem.hotel}</td>
            <td><span class="status-badge ${getStatusClass(viagem.status)}">${viagem.status}</span></td>
            <td>${formatarMoeda(viagem.valor)}</td>
        `;
        tabelaBody.appendChild(tr);
    });
};

// Evento de Cadastro de Viagem
form.addEventListener('submit', (e) => {
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

    viagens.push(novaViagem);
    atualizarTabela();
    form.reset();
});

// Eventos do Checklist
const adicionarTarefa = () => {
    const texto = inputTarefa.value.trim();
    if (texto === '') return;

    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox">
        <span>${texto}</span>
        <button class="trash">✖</button>
    `;
    
    li.querySelector('.trash').addEventListener('click', (e) => {
        e.stopPropagation();
        li.remove();
    });
    
    listaTarefas.appendChild(li);
    inputTarefa.value = '';
};

btnAdicionarTarefa.addEventListener('click', adicionarTarefa);
inputTarefa.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adicionarTarefa();
});

// Exportar para Excel (CSV)
btnExportar.addEventListener('click', () => {
    if (viagens.length === 0) {
        alert('Não há viagens cadastradas para exportar.');
        return;
    }

    // Cabeçalhos do CSV
    let csvContent = "Passageiro;Destino;Data de Ida;Data de Volta;Hotel;Status;Valor\n";

    // Adicionando as linhas
    viagens.forEach(v => {
        const linha = [
            v.nome,
            v.destino,
            formatarData(v.dataIda),
            formatarData(v.dataVolta),
            v.hotel,
            v.status,
            v.valor.toString().replace('.', ',') // Padronização PT-BR para decimal no Excel
        ].join(";");
        
        csvContent += linha + "\n";
    });

    // Criando o Blob com encoding BOM para aceitar acentuação no Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Criando link de download invisível
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_viagens.csv");
    document.body.appendChild(link);
    
    // Disparando o download
    link.click();
    document.body.removeChild(link);
});