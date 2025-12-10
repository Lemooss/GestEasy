// Configurações da API
const API_CONFIG = {
    baseURL: 'http://localhost:3000/api',
    timeout: 30000
};

// Armazenamento de token
const TokenManager = {
    set: (token) => {
        localStorage.setItem('gesteasy_token', token);
    },
    
    get: () => {
        return localStorage.getItem('gesteasy_token');
    },
    
    remove: () => {
        localStorage.removeItem('gesteasy_token');
    },
    
    isValid: () => {
        const token = TokenManager.get();
        return token !== null && token !== '';
    }
};

// Armazenamento de usuário
const UserManager = {
    set: (usuario) => {
        localStorage.setItem('gesteasy_usuario', JSON.stringify(usuario));
    },
    
    get: () => {
        const usuario = localStorage.getItem('gesteasy_usuario');
        return usuario ? JSON.parse(usuario) : null;
    },
    
    remove: () => {
        localStorage.removeItem('gesteasy_usuario');
    }
};

// Cliente HTTP com autenticação
const apiClient = {
    async request(method, endpoint, data = null, config = {}) {
        const url = `${API_CONFIG.baseURL}${endpoint}`;
        const token = TokenManager.get();
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...config.headers
            },
            ...config
        };
        
        // Adicionar token se existir
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Adicionar body se houver dados
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            const responseData = await response.json();
            
            // Se token inválido, redirecionar para login
            if (response.status === 401 || response.status === 403) {
                TokenManager.remove();
                UserManager.remove();
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/index.html') {
                    window.location.href = '/login.html';
                }
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            
            if (!response.ok) {
                throw new Error(responseData.mensagem || 'Erro na requisição');
            }
            
            return responseData;
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    },
    
    get(endpoint, config = {}) {
        return this.request('GET', endpoint, null, config);
    },
    
    post(endpoint, data, config = {}) {
        return this.request('POST', endpoint, data, config);
    },
    
    put(endpoint, data, config = {}) {
        return this.request('PUT', endpoint, data, config);
    },
    
    delete(endpoint, config = {}) {
        return this.request('DELETE', endpoint, null, config);
    }
};

// Verificar autenticação
function verificarAutenticacao() {
    const paginasPublicas = ['/index.html', '/login.html', '/registro.html', '/'];
    const paginaAtual = window.location.pathname;
    
    if (!TokenManager.isValid() && !paginasPublicas.includes(paginaAtual)) {
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

// Logout
async function logout() {
    try {
        await apiClient.post('/auth/logout');
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    } finally {
        TokenManager.remove();
        UserManager.remove();
        window.location.href = '/login.html';
    }
}

// Utilitários de formatação
const Formatters = {
    currency: (valor) => {
        return parseFloat(valor).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    },
    
    date: (data) => {
        if (!data) return '';
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    },
    
    dateInput: (data) => {
        if (!data) return '';
        const d = new Date(data);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    percent: (valor) => {
        return parseFloat(valor).toFixed(2) + '%';
    }
};

// Utilitários de mensagens
const Messages = {
    success: (mensagem) => {
        alert('✓ ' + mensagem);
    },
    
    error: (mensagem) => {
        alert('✗ ' + mensagem);
    },
    
    confirm: (mensagem) => {
        return confirm(mensagem);
    }
};

// Nomes dos meses
const MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Cores padrão para categorias
const CORES_CATEGORIAS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
];
