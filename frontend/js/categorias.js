// Verificar autenticação
verificarAutenticacao();

// Variáveis globais
let modalCategoria = null;
let categoriaEditando = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    carregarNomeUsuario();
    modalCategoria = new bootstrap.Modal(document.getElementById('modalCategoria'));
    
    await carregarCategorias();
    
    // Event listeners
    document.getElementById('formCategoria').addEventListener('submit', salvarCategoria);
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
        
        const container = document.getElementById('listaCategorias');
        container.innerHTML = '';
        
        if (response.sucesso && response.dados.length > 0) {
            response.dados.forEach(categoria => {
                const col = document.createElement('div');
                col.className = 'col-md-4 col-lg-3 mb-3';
                
                const tipoBadge = categoria.tipo === 'receita' ? 'success' : 
                                 categoria.tipo === 'despesa' ? 'danger' : 'secondary';
                
                col.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div class="categoria-icon" style="background-color: ${categoria.cor};">
                                    <i class="fas ${categoria.icone}"></i>
                                </div>
                                <span class="badge bg-${tipoBadge}">${categoria.tipo}</span>
                            </div>
                            <h5 class="card-title">${categoria.nome}</h5>
                            <div class="action-buttons mt-3">
                                <button class="btn btn-sm btn-warning btn-action" onclick="editarCategoria(${categoria.id_categoria})">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-sm btn-danger btn-action" onclick="deletarCategoria(${categoria.id_categoria})">
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
                        <i class="fas fa-folder-open"></i>
                        <p>Nenhuma categoria encontrada</p>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        Messages.error('Erro ao carregar categorias');
    }
}

// Abrir modal para nova categoria
function abrirModalNova() {
    categoriaEditando = null;
    document.getElementById('modalCategoriaTitulo').textContent = 'Nova Categoria';
    document.getElementById('formCategoria').reset();
    document.getElementById('categoriaId').value = '';
    document.getElementById('categoriaCor').value = '#6c757d';
    document.getElementById('categoriaIcone').value = 'fa-folder';
}

// Editar categoria
async function editarCategoria(id) {
    try {
        const response = await apiClient.get(`/categorias/${id}`);
        
        if (response.sucesso) {
            categoriaEditando = response.dados;
            
            document.getElementById('modalCategoriaTitulo').textContent = 'Editar Categoria';
            document.getElementById('categoriaId').value = categoriaEditando.id_categoria;
            document.getElementById('categoriaNome').value = categoriaEditando.nome;
            document.getElementById('categoriaTipo').value = categoriaEditando.tipo;
            document.getElementById('categoriaCor').value = categoriaEditando.cor;
            document.getElementById('categoriaIcone').value = categoriaEditando.icone;
            
            modalCategoria.show();
        }
    } catch (error) {
        console.error('Erro ao carregar categoria:', error);
        Messages.error('Erro ao carregar categoria');
    }
}

// Salvar categoria
async function salvarCategoria(e) {
    e.preventDefault();
    
    const id = document.getElementById('categoriaId').value;
    const dados = {
        nome: document.getElementById('categoriaNome').value,
        tipo: document.getElementById('categoriaTipo').value,
        cor: document.getElementById('categoriaCor').value,
        icone: document.getElementById('categoriaIcone').value
    };
    
    try {
        let response;
        
        if (id) {
            // Atualizar
            response = await apiClient.put(`/categorias/${id}`, dados);
        } else {
            // Criar
            response = await apiClient.post('/categorias', dados);
        }
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            modalCategoria.hide();
            await carregarCategorias();
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao salvar categoria:', error);
        Messages.error(error.message || 'Erro ao salvar categoria');
    }
}

// Deletar categoria
async function deletarCategoria(id) {
    if (!Messages.confirm('Tem certeza que deseja deletar esta categoria?\n\nNão será possível deletar se houver transações ou orçamentos vinculados.')) {
        return;
    }
    
    try {
        const response = await apiClient.delete(`/categorias/${id}`);
        
        if (response.sucesso) {
            Messages.success(response.mensagem);
            await carregarCategorias();
        } else {
            Messages.error(response.mensagem);
        }
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        Messages.error(error.message || 'Erro ao deletar categoria');
    }
}
