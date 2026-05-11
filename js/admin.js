// 1. Importações do Firebase (Agora com Auth)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Lista de e-mails autorizados
const ADMIN_EMAILS = [
    "welingtonhopka@gmail.com",
    "email_do_socio@gmail.com",
    "email_do_rh@gmail.com"
];

// Suas credenciais do Firebase
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

// Variáveis Globais
let documents = []; 
let filteredDocs = [];
let currentDetailId = null;

// === CATRACA DE AUTENTICAÇÃO ===
// Escuta o estado do usuário. Só deixa passar se estiver logado E na lista.
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (ADMIN_EMAILS.includes(user.email)) {
            console.log("Acesso Liberado para:", user.email);
            // Oculta a área de login se ela existir no seu HTML
            const areaLogin = document.getElementById('area-login-admin');
            if (areaLogin) areaLogin.classList.add('hidden');
            
            // AGORA SIM, com passe livre, puxamos os dados
            carregarDadosDoBanco();
        } else {
            showToast("Acesso Negado: Seu e-mail não é administrador.", "error");
            signOut(auth); // Expulsa imediatamente
        }
    } else {
        // Ninguém está logado
        console.log("Aguardando login de administrador...");
        const areaLogin = document.getElementById('area-login-admin');
        if (areaLogin) areaLogin.classList.remove('hidden');
    }
});

// === FUNÇÕES DE LOGIN/LOGOUT PARA O HTML CHAMAR ===
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


// === BUSCAR DADOS NO FIREBASE ===
async function carregarDadosDoBanco() {
    try {
        const q = query(collection(db, "Funcionarios"), orderBy("dataPreenchimento", "desc"));
        const querySnapshot = await getDocs(q);
        
        documents = []; 

        querySnapshot.forEach((docSnap) => {
            const dados = docSnap.data();
            const id = docSnap.id;

            const dataObj = new Date(dados.dataPreenchimento);
            const dataFormatada = dataObj.toLocaleDateString('pt-BR');

            let arquivosReais = [];
            if (dados.arquivosAnexados) {
                for (const [chave, valor] of Object.entries(dados.arquivosAnexados)) {
                    if (Array.isArray(valor)) {
                        valor.forEach(v => arquivosReais.push({ nome: v.nome, url: v.url }));
                    } else if (valor && valor.nome) {
                        arquivosReais.push({ nome: valor.nome, url: valor.url });
                    }
                }
            }

            documents.push({
                id: id,
                nome: dados.dadosPessoais?.nome || 'Nome não informado',
                cpf: dados.dadosPessoais?.nif || 'NIF não informado',
                categoria: 'registro', 
                data: dataFormatada,
                status: 'pendente', 
                anexos: arquivosReais.length,
                notas: `Email corporativo: ${dados.emailFuncionario}`,
                arquivos: arquivosReais 
            });
        });

        filteredDocs = [...documents];
        renderTable(filteredDocs);
        atualizarCards(filteredDocs); // Mantém os cards atualizados
        showToast('Dados do Firebase carregados com sucesso!', 'success');

    } catch (error) {
        console.error("Erro ao buscar do Firebase:", error);
        showToast("Erro ao conectar com o banco de dados.", "error");
    }
}


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

// === RENDERIZAR TABELA ===
function renderTable(docs) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const countEl = document.getElementById('resultCount');
    if (countEl) countEl.textContent = docs.length;

    if (docs.length === 0) {
        if(tbody) tbody.innerHTML = '';
        if(emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if(emptyState) emptyState.classList.add('hidden');
    if(tbody) {
        tbody.innerHTML = docs.map((doc, i) => `
            <tr class="hover:bg-slate-50 transition-colors fade-in">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold text-xs">
                            ${doc.nome.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <p class="text-sm font-semibold text-slate-800">${doc.nome}</p>
                            <p class="text-xs text-slate-400">ID: ${doc.id.substring(0,8)}...</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">${doc.cpf}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${getCategoryLabel(doc.categoria)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${doc.data}</td>
                <td class="px-6 py-4 whitespace-nowrap">${getStatusBadge(doc.status)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="flex justify-end gap-1.5">
                        <button onclick="window.abrirDetalhes('${doc.id}')" class="text-blue-600 bg-blue-50 p-2 rounded-lg" title="Ver Dados">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// === MODAL DE DETALHES ===
window.abrirDetalhes = function(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    currentDetailId = id;
    document.getElementById('modalName').textContent = doc.nome;
    document.getElementById('modalCategory').textContent = getCategoryLabel(doc.categoria);
    document.getElementById('modalCpf').textContent = doc.cpf;
    document.getElementById('modalDate').textContent = doc.data;
    document.getElementById('modalStatus').innerHTML = getStatusBadge(doc.status);
    document.getElementById('modalAttachments').textContent = `${doc.anexos} arquivo(s)`;
    document.getElementById('modalNotes').textContent = doc.notas;

    const filesList = document.getElementById('modalFilesList');
    
    if(doc.arquivos.length > 0) {
        filesList.innerHTML = doc.arquivos.map((f) => `
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

    const modal = document.getElementById('detailModal');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.closeDetailModal = function() {
    const modal = document.getElementById('detailModal');
    if(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    currentDetailId = null;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    if(toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
}

function atualizarCards(docs) {
    const total = docs.length;
    const aprovados = docs.filter(d => d.status === 'aprovado').length;
    const pendentes = docs.filter(d => d.status === 'pendente').length;
    const rejeitados = docs.filter(d => d.status === 'rejeitado').length;

    const elTotal = document.getElementById('card-total');
    const elAprovados = document.getElementById('card-aprovados');
    const elPendentes = document.getElementById('card-pendentes');
    const elRejeitados = document.getElementById('card-rejeitados');

    if (elTotal) elTotal.textContent = total;
    if (elAprovados) elAprovados.textContent = aprovados;
    if (elPendentes) elPendentes.textContent = pendentes;
    if (elRejeitados) elRejeitados.textContent = rejeitados;
}