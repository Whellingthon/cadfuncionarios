// =========================================================================
// 1. IMPORTAÇÕES DO FIREBASE
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// =========================================================================
// 2. CONFIGURAÇÃO E CREDENCIAIS DO FIREBASE
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCgDbwdOmhyFe4HflcYcOaEX8LXrF3k1U0",
    authDomain: "cadfuncionario-13bac.firebaseapp.com",
    projectId: "cadfuncionario-13bac",
    storageBucket: "cadfuncionario-13bac.firebasestorage.app",
    messagingSenderId: "392240312410",
    appId: "1:392240312410:web:0d9b28dbc4017154d32863",
    measurementId: "G-90G0FMKM1F"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Lista de e-mails autorizados como administradores
const ADMIN_EMAILS = [
    "welingtonhopka@gmail.com",
    "gi.abertoni@gmail.com",
    "email_do_rh@gmail.com"
];

// Variáveis Globais de Controlo
let documents = []; 
let filteredDocs = [];
let currentDetailId = null;

// =========================================================================
// 3. CATRACA DE AUTENTICAÇÃO (Muda os nomes na tela dinamicamente)
// =========================================================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (ADMIN_EMAILS.includes(user.email)) {
            console.log("Acesso Liberado para:", user.email);
            
            const areaLogin = document.getElementById('area-login-admin');
            if (areaLogin) areaLogin.classList.add('hidden');
            
            // ATUALIZAÇÃO DOS CAMPOS DE UTILIZADOR NA TELA
            const nomeCompleto = user.displayName || "Administrador";
            const iniciais = nomeCompleto.substring(0, 2).toUpperCase();
            
            const elSidebarName = document.getElementById('sidebar-user-name');
            const elSidebarInitials = document.getElementById('sidebar-user-initials');
            const elSidebarEmail = document.getElementById('sidebar-user-email');
            const elFooterName = document.getElementById('footer-user-name');
            
            if (elSidebarName) elSidebarName.textContent = nomeCompleto;
            if (elSidebarInitials) elSidebarInitials.textContent = iniciais;
            if (elSidebarEmail) elSidebarEmail.textContent = user.email;
            if (elFooterName) elFooterName.textContent = nomeCompleto;

            // Puxa os dados reais do Firestore
            carregarDadosDoBanco();
        } else {
            showToast("Acesso Negado: O seu e-mail não é administrador.", "error");
            signOut(auth); 
        }
    } else {
        console.log("Aguardando login de administrador...");
        const areaLogin = document.getElementById('area-login-admin');
        if (areaLogin) areaLogin.classList.remove('hidden');
    }
});

window.loginAdmin = function() {
    signInWithPopup(auth, provider).catch(error => {
        console.error("Erro no login:", error);
        showToast("Erro ao tentar fazer login", "error");
    });
};

window.logoutAdmin = function() {
    signOut(auth).then(() => {
        documents = [];
        renderTable([]);
        atualizarCards([]);
        showToast("Sessão encerrada", "success");
    });
};

// =========================================================================
// 4. MÁQUINA DE ESTADOS (Aprovar e Reprovar Prontuários)
// =========================================================================
window.aprovarCadastro = async function(idFuncionario, emailFuncionario, nomeFuncionario) {
    try {
        const docRef = doc(db, "Funcionarios", idFuncionario);
        await updateDoc(docRef, { statusCadastro: "aprovado" });
        
        showToast("Cadastro Aprovado com sucesso!", "success");
        carregarDadosDoBanco(); 
        closeDetailModal(); 
        
        const assunto = encodeURIComponent("Prontuário Aprovado - DocVault");
        const mensagem = encodeURIComponent(`Olá ${nomeFuncionario},\n\nSeu prontuário foi analisado e aprovado com sucesso pelo setor de RH.\n\nAtenciosamente,\nEquipe DocVault`);
        window.open(`mailto:${emailFuncionario}?subject=${assunto}&body=${mensagem}`);
        
    } catch (error) {
        showToast("Erro ao aprovar cadastro.", "error");
        console.error(error);
    }
};

window.reprovarCadastro = async function(idFuncionario, emailFuncionario, nomeFuncionario) {
    try {
        const docRef = doc(db, "Funcionarios", idFuncionario);
        await updateDoc(docRef, { statusCadastro: "rejeitado" });
        
        showToast("Cadastro Rejeitado com sucesso!", "success");
        carregarDadosDoBanco(); 
        closeDetailModal(); 
        
        const assunto = encodeURIComponent("Ajuste necessário no Prontuário - DocVault");
        const mensagem = encodeURIComponent(`Olá ${nomeFuncionario},\n\nSeu prontuário foi analisado e precisamos que você revise ou reenvie algumas informações.\n\nAtenciosamente,\nEquipe DocVault`);
        window.open(`mailto:${emailFuncionario}?subject=${assunto}&body=${mensagem}`);
        
    } catch (error) {
        showToast("Erro ao reprovar cadastro.", "error");
    }
};

// =========================================================================
// 5. BUSCA E TRATAMENTO DE DADOS DO FIRESTORE
// =========================================================================
async function carregarDadosDoBanco() {
    try {
        const q = query(collection(db, "Funcionarios"), orderBy("dataPreenchimento", "desc"));
        const querySnapshot = await getDocs(q);
        
        documents = []; 

        querySnapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;

            const dataObj = new Date(dados.dataPreenchimento);
            const dataFormatada = isNaN(dataObj.getTime()) ? '---' : dataObj.toLocaleDateString('pt-BR');

            let arquivosReais = [];
            if (dados.arquivosAnexados) {
                for (const [chave, valor] of Object.entries(dados.arquivosAnexados)) {
                    if (Array.isArray(valor)) {
                        valor.forEach(v => { if (v && v.nome) arquivosReais.push({ nome: v.nome, url: v.url }); });
                    } else if (valor && valor.nome) {
                        arquivosReais.push({ nome: valor.nome, url: valor.url });
                    }
                }
            }

            documents.push({
                id: id,
                nome: dados.dadosPessoais?.nome || 'Nome não informado',
                // AQUI ESTÁ A CORREÇÃO DO CPF QUE COMBINAMOS:
                cpf: dados.dadosPessoais?.cpf || dados.dadosPessoais?.nif || 'CPF não informado',
                categoria: 'registro', 
                status: dados.statusCadastro || 'pendente', 
                email: dados.emailFuncionario || '',
                anexos: arquivosReais.length,
                notas: `Email corporativo: ${dados.emailFuncionario || 'Não informado'}`,
                arquivos: arquivosReais 
            });
        });

        filteredDocs = [...documents];
        renderTable(filteredDocs);
        atualizarCards(filteredDocs); 
        showToast('Dados atualizados do servidor!', 'success');

    } catch (error) {
        console.error("Erro ao buscar do Firebase:", error);
        showToast("Erro ao conectar com o banco de dados.", "error");
    }
}

// =========================================================================
// 6. RENDERIZAÇÃO DA INTERFACE E COMPONENTES VISUAIS
// =========================================================================
function getStatusBadge(status) {
    const map = {
        aprovado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Aprovado' },
        pendente: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pendente' },
        rejeitado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Rejeitado' },
    };
    const s = map[status] || map.pendente;
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}">
        <span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>${s.label}
    </span>`;
}

function getCategoryLabel(cat) {
    const map = { contrato: 'Contrato', procuracao: 'Procuração', registro: 'Registro', certidao: 'Certidão' };
    return map[cat] || cat;
}

function renderTable(listaDeProntuarios) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('resultCount');
    if (countEl) countEl.textContent = listaDeProntuarios.length;

    if (!tbody) return;

    if (listaDeProntuarios.length === 0) {
        tbody.innerHTML = '';
        if(emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if(emptyState) emptyState.classList.add('hidden');
    
    // Variável alterada para 'prontuario' para evitar o conflito com o 'doc' do Firebase
    tbody.innerHTML = listaDeProntuarios.map((prontuario) => `
        <tr class="hover:bg-slate-50 transition-colors fade-in">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs">
                        ${prontuario.nome.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm font-semibold text-slate-800">${prontuario.nome}</p>
                        <p class="text-xs text-slate-400">ID: ${prontuario.id.substring(0,8)}...</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">${prontuario.cpf}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${getCategoryLabel(prontuario.categoria)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${prontuario.data}</td>
            <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(prontuario.status)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
                <button onclick="window.abrirDetalhes('${prontuario.id}')" class="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors" title="Ver Dados">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// =========================================================================
// 7. SISTEMAS DE FILTRAGEM, BARRA DE PESQUISA E EXPORTAÇÃO
// =========================================================================
window.filterTable = function() {
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusText = document.getElementById('statusFilter')?.value || '';
    
    filteredDocs = documents.filter(pront => {
        const bateTexto = pront.nome.toLowerCase().includes(searchText) || pront.cpf.includes(searchText);
        const bateStatus = statusText === '' || pront.status === statusText;
        return bateTexto && bateStatus;
    });
    
    renderTable(filteredDocs);
    atualizarCards(filteredDocs);
};

window.resetFilters = function() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    filteredDocs = [...documents];
    renderTable(filteredDocs);
    atualizarCards(filteredDocs);
};

window.exportData = function() {
    if (filteredDocs.length === 0) return showToast("Nenhum dado para exportar", "error");
    
    let csv = "\uFEFFNome;CPF;Data;Status;Anexos;Email\n";
    filteredDocs.forEach(d => {
        csv += `"${d.nome}";"${d.cpf}";"${d.data}";"${d.status}";"${d.anexos}";"${d.email}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "relatorio_funcionarios.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    }
};

// =========================================================================
// 8. CONTROLO DO MODAL DE DETALHES E TOASTS
// =========================================================================
window.abrirDetalhes = function(id) {
    // Variável alterada para 'prontuario' para evitar o conflito com o 'doc' do Firebase
    const prontuario = documents.find(d => d.id === id);
    if (!prontuario) return;

    currentDetailId = id;
    document.getElementById('modalName').textContent = prontuario.nome;
    document.getElementById('modalCategory').textContent = getCategoryLabel(prontuario.categoria);
    document.getElementById('modalCpf').textContent = prontuario.cpf;
    document.getElementById('modalDate').textContent = prontuario.data;
    document.getElementById('modalStatus').innerHTML = getStatusBadge(prontuario.status);
    document.getElementById('modalAttachments').textContent = `${prontuario.anexos} arquivo(s)`;
    document.getElementById('modalNotes').textContent = prontuario.notas;

    const filesList = document.getElementById('modalFilesList');
    
    if(prontuario.arquivos.length > 0) {
        filesList.innerHTML = prontuario.arquivos.map((f) => `
            <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 hover:bg-slate-100 transition-colors mb-2">
                <div class="flex items-center gap-3 w-3/4">
                    <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <i data-lucide="file" class="w-4 h-4"></i>
                    </div>
                    <div class="truncate">
                        <p class="text-sm font-medium text-slate-700 truncate" title="${f.nome}">${f.nome}</p>
                        <p class="text-xs text-slate-400">Armazenado na nuvem</p>
                    </div>
                </div>
                <a href="${f.url}" target="_blank" class="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-blue-600 hover:text-blue-800 flex-shrink-0">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                </a>
            </div>
        `).join('');
    } else {
        filesList.innerHTML = '<p class="text-sm text-slate-400">Nenhum arquivo anexado.</p>';
    }

    const actionButtons = document.getElementById('modalActionButtons');
    if (actionButtons) {
        if (prontuario.status === 'pendente') {
            actionButtons.innerHTML = `
                <button onclick="window.reprovarCadastro('${prontuario.id}', '${prontuario.email}', '${prontuario.nome}')" class="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Reprovar</button>
                <button onclick="window.aprovarCadastro('${prontuario.id}', '${prontuario.email}', '${prontuario.nome}')" class="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 transition-colors">Aprovar Prontuário</button>
            `;
        } else {
            actionButtons.innerHTML = '';
        }
    }

    const modal = document.getElementById('detailModal');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeDetailModal = function() {
    const modal = document.getElementById('detailModal');
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    currentDetailId = null;
};

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if(toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

function atualizarCards(listaDeProntuarios) {
    const total = listaDeProntuarios.length;
    const aprovados = listaDeProntuarios.filter(d => d.status === 'aprovado').length;
    const pendentes = listaDeProntuarios.filter(d => d.status === 'pendente').length;
    const rejeitados = listaDeProntuarios.filter(d => d.status === 'rejeitado').length;

    const elTotal = document.getElementById('card-total');
    const elAprovados = document.getElementById('card-aprovados');
    const elPendentes = document.getElementById('card-pendentes');
    const elRejeitados = document.getElementById('card-rejeitados');

    if (elTotal) elTotal.textContent = total;
    if (elAprovados) elAprovados.textContent = aprovados;
    if (elPendentes) elPendentes.textContent = pendentes;
    if (elRejeitados) elRejeitados.textContent = rejeitados;
}