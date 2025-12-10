// Verificar autenticação
verificarAutenticacao();

// Variáveis globais
let categorias = [];
let paginaAtual = 1;
let modalTransacao = null;
let transacaoEditando = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    carregarNomeUsuario();
    modalTransacao = new bootstrap.Modal(document.getElementById('modalTransacao'));
    
    await carregarCategorias();
    await carregarTransacoes();
    
    // Event listeners
    document.getElementById('transacaoTipo').addEventListener('change', filtrarCategoriasPorTipo);
    document.getElementById('formTransacao').addEventListener('submit', salvarTransacao);
});

// Carregar nome do usuário
function carregarNomeUsuario() {
    const usuario = UserManager.get();
    if (usuario) {
        document.getElementById('nomeUsuario').textContent = usuario.nome;
    }
}

// Carregar categorias
async function carregarCategorias() {
    try {
        const response = await apiClient.get('/categorias');
        
        if (response.sucesso) {
            categorias = response.dados;
            preencherSelectCategorias();
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Preencher selects de categorias
function preencherSelectCategorias() {
    // Select de filtro
    const selectFiltro = document.getElementById('filtroCategoria');
    selectFiltro.innerHTML = '<option value="">Todas</option>';
    
    categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id_categoria;
        option.textContent = cat.nome;
        selectFiltro.appendChild(option);
    });
    
    // Select do modal
    filtrarCategoriasPorTipo();
}

// Filtrar categorias por tipo no modal
function filtrarCategoriasPorTipo() {
    const tipo = document.getElementById('transacaoTipo').value;
    const select = document.getElementById('transacaoCategoria');
    
    select.innerHTML = '<option value="">Selecione...</option>';
    
    const categoriasFiltradas = categorias.filter(cat => {
        return cat.tipo === tipo || cat.tipo === 'ambos';
    });
    
    categoriasFiltradas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id_categoria;
        option.textContent = cat.nome;
        select.appendChild(option);
    });
}

// Carregar transações
async function carregarTransacoes(pagina = 1) {
    try {
        paginaAtual = pagina;
        
        // Construir query string
        const params = new URLSearchParams();
        params.append('pagina', pagina);
        params.append('limite', 50);
        
        const dataInicial = document.getElementById('filtroDataInicial').value;
        const dataFinal = document.getElementById('filtroDataFinal').value;
        const tipo = document.getElementById('filtroTipo').value;
        const categoria = document.getElementById('filtroCategoria').value;
        const busca = document.getElementById('filtroBusca').value;
        
        if (dataInicial) params.append('data_inicial', dataInicial);
        if (dataFinal) params.append('data_final', dataFinal);
        if (tipo) params.append('tipo', tipo);
        if (categoria) params.append('categoria', categoria);
        if (busca) params.append('busca', busca);
        
        const response = await apiClient.get(`/transacoes?${params.toString()}`);
        
        const tbody = document.getElementById('tabelaTransacoes');
        tbody.innerHTML = '';
        
        if (response.sucesso && response.dados.length > 0) {
            response.dados.forEach(transacao => {
                const tr = document.createElement('tr');
                
                const badgeClass = transacao.tipo === 'receita' ? 'badge-receita' : 'badge-despesa';
                const valorClass = transacao.tipo === 'receita' ? 'text-success' : 'text-danger';
                const valorPrefix = transacao.tipo === 'receita' ? '+' : '-';
                
                tr.innerHTML = `
                    <td>${Formatters.date(transacao.data_transacao)}</td>
                    <td><span class="badge ${badgeClass}">${transacao.tipo}</span></td>
                    <td>
                        <span class="categoria-badge" style="background-color: ${transacao.cor_categoria}20; color: ${transacao.cor_categoria};">
                            <i class="fas ${transacao.icone_categoria}"></i>
                            ${transacao.categoria}
                        </span>
                    </td>
                    <td>${transacao.descricao || '-'}</td>
                    <td class="text-end ${valorClass} fw-bold">${valorPrefix} ${Formatters.currency(transacao.valor)}</td>
                    <td class="text-center">
                        <div class="action-buttons justify-content-center">
                            <button class="btn btn-sm btn-warning btn-action" onclick="editarTransacao(${transacao.id_transacao})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger btn-action" onclick="deletarTransacao(${transacao.id_transacao})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(tr);
            });
            
            // Renderizar paginação
            renderizarPaginacao(response.paginacao);
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>Nenhuma transação encontrada</p>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('paginacao').innerHTML = '';
        }
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        Messages.error('Erro ao carregar transações');
    }
}

// Renderizar paginação
function renderizarPaginacao(paginacao) {
    const container = document.getElementById('paginacao');
    container.innerHTML = '';
    
    if (paginacao.total_paginas <= 1) return;
    
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination';
    
    // Botão anterior
    const liPrev = document.createElement('li');
    liPrev.className = `page-item ${paginacao.pagina_atual === 1 ? 'disabled' : ''}`;
    liPrev.innerHTML = `<a class="page-link" href="#" onclick="carregarTransacoes(${paginacao.pagina_atual - 1}); return false;">Anterior</a>`;
    ul.appendChild(liPrev);
    
    // Páginas
    for (let i = 1; i <= paginacao.total_paginas; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginacao.pagina_atual ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="carregarTransacoes(${i}); return false;">${i}</a>`;
        ul.appendChild(li);
    }
    
    // Botão próximo
    const liNext = document.createElement('li');
    liNext.className = `page-item ${paginacao.pagina_atual === paginacao.total_paginas ? 'disabled' : ''}`;
    liNext.innerHTML = `<a class="page-link" href="#" onclick="carregarTransacoes(${paginacao.pagina_atual + 1}); return false;">Próximo</a>`;
    ul.appendChild(liNext);
    
    nav.appendChild(ul);
    container.appendChild(nav);
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filtroDataInicial').value = '';
    document.getElementById('filtroDataFinal').value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('filtroBusca').value = '';
    carregarTransacoes();
}

// Abrir modal para nova transação
function abrirModalNova() {
    transacaoEditando = null;
    document.getElementById('modalTransacaoTitulo').textContent = 'Nova Transação';
    document.getElementById('formTransacao').reset();
    document.getElementById('transacaoId').value = '';
    document.getElementById('transacaoData').value = new Date().toISOString().split('T')[0];
}

// Editar transação
async function editarTransacao(id) {
    try {
        const response = await apiClient.get(`/transacoes/${id}`);
        
        if (response.sucesso) {
            transacaoEditando = response.dados;
            
            document.getElementById('modalTransacaoTitulo').textContent = 'Editar Transação';
            document.getElementById('transacaoId').value = transacaoEditando.id_transacao;
            document.getElementById('transacaoTipo').value = transacaoEditando.tipo;
            filtrarCategoriasPorTipo();
            document.getElementById('transacaoCategoria').value = transacaoEditando.id_categoria;
            document.getElementById('transacaoValor').value = transacaoEditando.valor;
            document.getElementById('transacaoData').value = Formatters.dateInput(transacaoEditando.data_transacao);
            document.getElementById('transacaoDescricao').value = transacaoEditando.descricao || '';
            
            modalTransacao.show();
        }
    } catch (error) {
        console.error('Erro ao carregar transação:', error);
        Messages.error('Erro ao carregar transação');
    }
}

// Salvar transação
async function salvarTransacao(e) {
    e.preventDefault();
    
    const id = document.getElementById('transacaoId').value;
    const dados = {
        tipo: document.getElementById('transacaoTipo').value,
        id_categoria: parseInt(document.getElementById('transacaoCategoria').value),
        valor: parseFloat(document.getElementById('transacaoValor').value),
        data_transacao: document.getElementById('transacaoData').value,
        descricao: document.getElementById('transacaoDescricao').value
    };
    
    try {
        let response;
        
        if (id) {
            // Atualizar
            response = await apiClient.put(`/transacoes/${id}`, dados);
        } else {
            // Criar
            response = await apiClient.post('/transacoes', dados);
        }
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            modalTransacao.hide();
            await carregarTransacoes(paginaAtual);
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar transação:', error);
        Messages.error(error.message || 'Erro ao salvar transação');
    }
}

// Deletar transação
async function deletarTransacao(id) {
    if (!Messages.confirm('Tem certeza que deseja deletar esta transação?')) {
        return;
    }
    
    try {
        const response = await apiClient.delete(`/transacoes/${id}`);
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            await carregarTransacoes(paginaAtual);
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao deletar transação:', error);
        Messages.error('Erro ao deletar transação');
    }
}

// Exportar PDF
function exportarPDF() {
    const params = new URLSearchParams();
    
    const dataInicial = document.getElementById('filtroDataInicial').value;
    const dataFinal = document.getElementById('filtroDataFinal').value;
    const tipo = document.getElementById('filtroTipo').value;
    const categoria = document.getElementById('filtroCategoria').value;
    
    if (dataInicial) params.append('data_inicial', dataInicial);
    if (dataFinal) params.append('data_final', dataFinal);
    if (tipo) params.append('tipo', tipo);
    if (categoria) params.append('categoria', categoria);
    
    const token = TokenManager.get();
    const url = `${API_CONFIG.baseURL}/export/pdf?${params.toString()}`;
    
    // Abrir em nova aba com token no header (usando fetch e blob)
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transacoes.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error('Erro ao exportar PDF:', error);
        Messages.error('Erro ao exportar PDF');
    });
}

// Exportar CSV
function exportarCSV() {
    const params = new URLSearchParams();
    
    const dataInicial = document.getElementById('filtroDataInicial').value;
    const dataFinal = document.getElementById('filtroDataFinal').value;
    const tipo = document.getElementById('filtroTipo').value;
    const categoria = document.getElementById('filtroCategoria').value;
    
    if (dataInicial) params.append('data_inicial', dataInicial);
    if (dataFinal) params.append('data_final', dataFinal);
    if (tipo) params.append('tipo', tipo);
    if (categoria) params.append('categoria', categoria);
    
    const token = TokenManager.get();
    const url = `${API_CONFIG.baseURL}/export/csv?${params.toString()}`;
    
    // Abrir em nova aba com token no header (usando fetch e blob)
    fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transacoes.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error('Erro ao exportar CSV:', error);
        Messages.error('Erro ao exportar CSV');
    });
}
