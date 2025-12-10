// Verificar autenticação
verificarAutenticacao();

// Variáveis globais para os gráficos
let chartDespesasCategoria = null;
let chartReceitasDespesas = null;
let chartEvolucaoSaldo = null;

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
    carregarNomeUsuario();
    inicializarFiltros();
    await atualizarDashboard();
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
    
    // Preencher anos (últimos 5 anos + próximo ano)
    const selectAno = document.getElementById('filtroAno');
    for (let i = anoAtual - 5; i <= anoAtual + 1; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === anoAtual) option.selected = true;
        selectAno.appendChild(option);
    }
}

// Atualizar dashboard
async function atualizarDashboard() {
    const mes = document.getElementById('filtroMes').value;
    const ano = document.getElementById('filtroAno').value;
    
    try {
        await Promise.all([
            carregarResumo(mes, ano),
            carregarDespesasPorCategoria(mes, ano),
            carregarReceitasDespesasPorMes(ano),
            carregarEvolucaoSaldo(ano),
            carregarTransacoesRecentes()
        ]);
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
        Messages.error('Erro ao carregar dados do dashboard');
    }
}

// Carregar resumo financeiro
async function carregarResumo(mes, ano) {
    try {
        const response = await apiClient.get(`/dashboard/resumo?mes=${mes}&ano=${ano}`);
        
        if (response.sucesso) {
            const { total_receitas, total_despesas, saldo } = response.dados;
            
            document.getElementById('totalReceitas').textContent = Formatters.currency(total_receitas);
            document.getElementById('totalDespesas').textContent = Formatters.currency(total_despesas);
            document.getElementById('saldo').textContent = Formatters.currency(saldo);
            
            // Atualizar cor do saldo
            const saldoElement = document.getElementById('saldo');
            saldoElement.className = 'stats-value';
            if (saldo > 0) {
                saldoElement.classList.add('text-success');
            } else if (saldo < 0) {
                saldoElement.classList.add('text-danger');
            } else {
                saldoElement.classList.add('text-info');
            }
        }
    } catch (error) {
        console.error('Erro ao carregar resumo:', error);
    }
}

// Carregar despesas por categoria (gráfico de pizza)
async function carregarDespesasPorCategoria(mes, ano) {
    try {
        const response = await apiClient.get(`/dashboard/despesas-por-categoria?mes=${mes}&ano=${ano}`);
        
        if (response.sucesso) {
            const dados = response.dados;
            
            const labels = dados.map(d => d.categoria);
            const valores = dados.map(d => d.total);
            const cores = dados.map(d => d.cor);
            
            // Destruir gráfico anterior se existir
            if (chartDespesasCategoria) {
                chartDespesasCategoria.destroy();
            }
            
            const ctx = document.getElementById('chartDespesasCategoria').getContext('2d');
            chartDespesasCategoria = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: cores,
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return label + ': ' + Formatters.currency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar despesas por categoria:', error);
    }
}

// Carregar receitas vs despesas por mês (gráfico de barras)
async function carregarReceitasDespesasPorMes(ano) {
    try {
        const response = await apiClient.get(`/dashboard/receitas-despesas-mes?ano=${ano}`);
        
        if (response.sucesso) {
            const dados = response.dados;
            
            const labels = dados.map(d => MESES[d.mes - 1]);
            const receitas = dados.map(d => d.receitas);
            const despesas = dados.map(d => d.despesas);
            
            // Destruir gráfico anterior se existir
            if (chartReceitasDespesas) {
                chartReceitasDespesas.destroy();
            }
            
            const ctx = document.getElementById('chartReceitasDespesas').getContext('2d');
            chartReceitasDespesas = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Receitas',
                            data: receitas,
                            backgroundColor: 'rgba(25, 135, 84, 0.7)',
                            borderColor: 'rgba(25, 135, 84, 1)',
                            borderWidth: 2
                        },
                        {
                            label: 'Despesas',
                            data: despesas,
                            backgroundColor: 'rgba(220, 53, 69, 0.7)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y || 0;
                                    return label + ': ' + Formatters.currency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar receitas vs despesas:', error);
    }
}

// Carregar evolução do saldo (gráfico de linha)
async function carregarEvolucaoSaldo(ano) {
    try {
        const response = await apiClient.get(`/dashboard/evolucao-saldo?ano=${ano}`);
        
        if (response.sucesso) {
            const dados = response.dados;
            
            const labels = dados.map(d => MESES[d.mes - 1]);
            const saldos = dados.map(d => d.saldo);
            
            // Destruir gráfico anterior se existir
            if (chartEvolucaoSaldo) {
                chartEvolucaoSaldo.destroy();
            }
            
            const ctx = document.getElementById('chartEvolucaoSaldo').getContext('2d');
            chartEvolucaoSaldo = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Saldo Acumulado',
                        data: saldos,
                        backgroundColor: 'rgba(13, 202, 240, 0.2)',
                        borderColor: 'rgba(13, 202, 240, 1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return 'R$ ' + value.toLocaleString('pt-BR');
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed.y || 0;
                                    return 'Saldo: ' + Formatters.currency(value);
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Erro ao carregar evolução do saldo:', error);
    }
}

// Carregar transações recentes
async function carregarTransacoesRecentes() {
    try {
        const response = await apiClient.get('/dashboard/transacoes-recentes?limite=10');
        
        const tbody = document.getElementById('tabelaTransacoesRecentes');
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
                `;
                
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>Nenhuma transação encontrada</p>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar transações recentes:', error);
        const tbody = document.getElementById('tabelaTransacoesRecentes');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Erro ao carregar transações
                </td>
            </tr>
        `;
    }
}
