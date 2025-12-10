// Verificar autenticação
verificarAutenticacao();

// Variáveis globais
let categorias = [];
let modalOrcamento = null;
let orcamentoEditando = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    carregarNomeUsuario();
    modalOrcamento = new bootstrap.Modal(document.getElementById('modalOrcamento'));
    
    inicializarFiltros();
    await carregarCategorias();
    await carregarOrcamentos();
    
    // Event listeners
    document.getElementById('formOrcamento').addEventListener('submit', salvarOrcamento);
});

// Carregar nome do usuário
function carregarNomeUsuario() {
    const usuario = UserManager.get();
    if (usuario) {
        document.getElementById('nomeUsuario').textContent = usuario.nome;
    }
}

// Inicializar filtros de mês e ano
function inicializarFiltros() {
    const dataAtual = new Date();
    const mesAtual = dataAtual.getMonth() + 1;
    const anoAtual = dataAtual.getFullYear();
    
    // Definir mês atual
    document.getElementById('filtroMes').value = mesAtual;
    document.getElementById('orcamentoMes').value = mesAtual;
    
    // Preencher anos (últimos 5 anos + próximo ano)
    const selectFiltroAno = document.getElementById('filtroAno');
    const selectOrcamentoAno = document.getElementById('orcamentoAno');
    
    for (let i = anoAtual - 5; i <= anoAtual + 1; i++) {
        const option1 = document.createElement('option');
        option1.value = i;
        option1.textContent = i;
        if (i === anoAtual) option1.selected = true;
        selectFiltroAno.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = i;
        option2.textContent = i;
        if (i === anoAtual) option2.selected = true;
        selectOrcamentoAno.appendChild(option2);
    }
}

// Carregar categorias
async function carregarCategorias() {
    try {
        const response = await apiClient.get('/categorias?tipo=despesa');
        
        if (response.sucesso) {
            categorias = response.dados;
            
            const select = document.getElementById('orcamentoCategoria');
            select.innerHTML = '<option value="">Selecione...</option>';
            
            categorias.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id_categoria;
                option.textContent = cat.nome;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
    }
}

// Carregar orçamentos
async function carregarOrcamentos() {
    try {
        const mes = document.getElementById('filtroMes').value;
        const ano = document.getElementById('filtroAno').value;
        
        const response = await apiClient.get(`/orcamentos?mes=${mes}&ano=${ano}`);
        
        const container = document.getElementById('listaOrcamentos');
        container.innerHTML = '';
        
        if (response.sucesso && response.dados.length > 0) {
            response.dados.forEach(orcamento => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4 mb-3';
                
                const percentual = parseFloat(orcamento.percentual_usado);
                let progressClass = 'bg-success';
                let alertClass = 'success';
                
                if (orcamento.status_alerta === 'danger') {
                    progressClass = 'bg-danger';
                    alertClass = 'danger';
                } else if (orcamento.status_alerta === 'warning') {
                    progressClass = 'bg-warning';
                    alertClass = 'warning';
                } else if (orcamento.status_alerta === 'info') {
                    progressClass = 'bg-info';
                    alertClass = 'info';
                }
                
                let alertaTexto = '';
                if (percentual >= 100) {
                    alertaTexto = '<div class="alert alert-danger mt-2 mb-0"><i class="fas fa-exclamation-triangle me-1"></i>Orçamento excedido!</div>';
                } else if (percentual >= 90) {
                    alertaTexto = '<div class="alert alert-warning mt-2 mb-0"><i class="fas fa-exclamation-circle me-1"></i>Atenção: 90% do orçamento usado!</div>';
                } else if (percentual >= 80) {
                    alertaTexto = '<div class="alert alert-info mt-2 mb-0"><i class="fas fa-info-circle me-1"></i>80% do orçamento usado</div>';
                }
                
                col.innerHTML = `
                    <div class="card orcamento-card ${alertClass} h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="card-title mb-1">${orcamento.categoria}</h5>
                                    <small class="text-muted">${MESES[orcamento.mes - 1]} ${orcamento.ano}</small>
                                </div>
                                <div class="categoria-icon" style="background-color: ${orcamento.cor_categoria};">
                                    <i class="fas fa-bullseye"></i>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1">
                                    <span>Gasto</span>
                                    <span class="fw-bold">${Formatters.currency(orcamento.valor_gasto)}</span>
                                </div>
                                <div class="d-flex justify-content-between mb-2">
                                    <span>Limite</span>
                                    <span class="fw-bold">${Formatters.currency(orcamento.valor_limite)}</span>
                                </div>
                                <div class="progress" style="height: 25px;">
                                    <div class="progress-bar ${progressClass}" role="progressbar" 
                                         style="width: ${Math.min(percentual, 100)}%"
                                         aria-valuenow="${percentual}" aria-valuemin="0" aria-valuemax="100">
                                        ${percentual.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            
                            ${alertaTexto}
                            
                            <div class="action-buttons mt-3">
                                <button class="btn btn-sm btn-warning btn-action" onclick="editarOrcamento(${orcamento.id_orcamento})">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="deletarOrcamento(${orcamento.id_orcamento})">
                                    <i class="fas fa-trash me-1"></i>Deletar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                container.appendChild(col);
            });
        } else {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="fas fa-bullseye"></i>
                        <p>Nenhum orçamento encontrado para este período</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
        Messages.error('Erro ao carregar orçamentos');
    }
}

// Abrir modal para novo orçamento
function abrirModalNovo() {
    orcamentoEditando = null;
    document.getElementById('modalOrcamentoTitulo').textContent = 'Novo Orçamento';
    document.getElementById('formOrcamento').reset();
    document.getElementById('orcamentoId').value = '';
    
    const dataAtual = new Date();
    document.getElementById('orcamentoMes').value = dataAtual.getMonth() + 1;
    document.getElementById('orcamentoAno').value = dataAtual.getFullYear();
}

// Editar orçamento
async function editarOrcamento(id) {
    try {
        const response = await apiClient.get(`/orcamentos/${id}`);
        
        if (response.sucesso) {
            orcamentoEditando = response.dados;
            
            document.getElementById('modalOrcamentoTitulo').textContent = 'Editar Orçamento';
            document.getElementById('orcamentoId').value = orcamentoEditando.id_orcamento;
            document.getElementById('orcamentoCategoria').value = orcamentoEditando.id_categoria;
            document.getElementById('orcamentoMes').value = orcamentoEditando.mes;
            document.getElementById('orcamentoAno').value = orcamentoEditando.ano;
            document.getElementById('orcamentoValor').value = orcamentoEditando.valor_limite;
            
            modalOrcamento.show();
        }
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        Messages.error('Erro ao carregar orçamento');
    }
}

// Salvar orçamento
async function salvarOrcamento(e) {
    e.preventDefault();
    
    const id = document.getElementById('orcamentoId').value;
    const dados = {
        id_categoria: parseInt(document.getElementById('orcamentoCategoria').value),
        mes: parseInt(document.getElementById('orcamentoMes').value),
        ano: parseInt(document.getElementById('orcamentoAno').value),
        valor_limite: parseFloat(document.getElementById('orcamentoValor').value)
    };
    
    try {
        let response;
        
        if (id) {
            // Atualizar
            response = await apiClient.put(`/orcamentos/${id}`, dados);
        } else {
            // Criar
            response = await apiClient.post('/orcamentos', dados);
        }
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            modalOrcamento.hide();
            await carregarOrcamentos();
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar orçamento:', error);
        Messages.error(error.message || 'Erro ao salvar orçamento');
    }
}

// Deletar orçamento
async function deletarOrcamento(id) {
    if (!Messages.confirm('Tem certeza que deseja deletar este orçamento?')) {
        return;
    }
    
    try {
        const response = await apiClient.delete(`/orcamentos/${id}`);
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            await carregarOrcamentos();
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao deletar orçamento:', error);
        Messages.error('Erro ao deletar orçamento');
    }
}
