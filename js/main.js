// === IMPORTAÇÕES DO FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// === CONFIGURAÇÃO ===
const firebaseConfig = {
    apiKey: "AIzaSyCgDbwdOmhyFe4HflcYcOaEX8LXrF3k1U0",
    authDomain: "cadfuncionario-13bac.firebaseapp.com",
    projectId: "cadfuncionario-13bac",
    storageBucket: "cadfuncionario-13bac.firebasestorage.app", 
    messagingSenderId: "392240312410",
    appId: "1:392240312410:web:0d9b28dbc4017154d32863",
    measurementId: "G-90G0FMKM1F"
};

// === INICIALIZAÇÃO ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();
let usuarioLogado = null;


// === FUNÇÕES DE INTERFACE (UI) ===
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const inner = document.getElementById('toast-inner');
    const msg = document.getElementById('toast-msg');
    const icon = document.getElementById('toast-icon');

    if(!toast) return;

    msg.textContent = message;
    inner.className = 'flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-white font-medium text-sm transition-all duration-300 transform';

    if (type === 'success') {
        inner.classList.add('bg-gradient-to-r', 'from-accent-500', 'to-accent-600');
        icon.setAttribute('data-lucide', 'check-circle');
    } else if (type === 'error') {
        inner.classList.add('bg-gradient-to-r', 'from-red-500', 'to-red-600');
        icon.setAttribute('data-lucide', 'alert-circle');
    } else {
        inner.classList.add('bg-gradient-to-r', 'from-primary-500', 'to-primary-600');
        icon.setAttribute('data-lucide', 'info');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
    toast.classList.remove('hidden');
    inner.classList.remove('translate-x-full');

    setTimeout(() => {
        inner.classList.add('translate-x-full');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3500);
}

function updateProgress() {
    const fields = ['nome', 'nif', 'endereco', 'telefone', 'email_particular', 'estado_civil', 'ano_medio'];
    let filled = 0;
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== '') filled++;
    });
    
    const filhosVal = document.querySelector('input[name="tem_filhos"]:checked');
    if (filhosVal) filled++;

    const pct = Math.round((filled / (fields.length + 1)) * 100);
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if(progressBar) progressBar.style.width = pct + '%';
    if(progressText) progressText.textContent = pct + '%';
}

// Configura os listeners de progresso
const camposParaOuvir = ['nome', 'nif', 'endereco', 'telefone', 'email_particular', 'estado_civil', 'ano_medio'];
camposParaOuvir.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateProgress);
});
document.querySelectorAll('input[name="tem_filhos"]').forEach(r => r.addEventListener('change', updateProgress));

// === LÓGICA DE LOGIN (COM BLOQUEIO DE DUPLICADOS) ===
const btnLogin = document.getElementById('btn-login');
if(btnLogin) {
    btnLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider).then(async (result) => {
            usuarioLogado = result.user;
            
            // VERIFICA SE O UTILIZADOR JÁ TEM REGISTO
            const q = query(collection(db, "Funcionarios"), where("emailFuncionario", "==", usuarioLogado.email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                // JÁ CADASTROU! Trava o ecrã.
                document.getElementById('area-login').innerHTML = `
                    <div class="bg-green-50 text-green-700 p-8 rounded-2xl border border-green-200">
                        <i data-lucide="check-circle" class="w-12 h-12 mx-auto mb-4"></i>
                        <h2 class="text-xl font-bold mb-2">Prontuário já enviado!</h2>
                        <p class="text-sm">Os seus dados já estão em análise pelos Recursos Humanos. Obrigado!</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return; // Pára o código aqui, não mostra o formulário.
            }

            // SE NÃO TEM REGISTO, LIBERTA O FORMULÁRIO:
            document.getElementById('area-login').classList.add('hidden');
            document.getElementById('area-formulario').classList.remove('hidden');
            document.getElementById('nome-usuario').innerText = usuarioLogado.displayName;
            showToast('Bem-vindo(a), ' + usuarioLogado.displayName + '!', 'info');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }).catch((error) => {
            showToast("Erro ao fazer login: " + error.message, 'error');
        });
    });
}

const btnLogout = document.getElementById('btn-logout');
if(btnLogout) {
    btnLogout.addEventListener('click', () => {
        signOut(auth).then(() => {
            usuarioLogado = null;
            document.getElementById('area-formulario').classList.add('hidden');
            document.getElementById('area-login').classList.remove('hidden');
            showToast('Sessão encerrada', 'info');
        });
    });
}


// === GERAÇÃO DINÂMICA DE CAMPOS ===
const inputClasses = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-slate-700 bg-slate-50/50 hover:bg-white';
const labelClasses = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider';
const selectClasses = 'w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm text-slate-700 bg-slate-50/50 hover:bg-white appearance-none cursor-pointer';

function removeBtnHtml() {
    return `<button type="button" onclick="this.closest('.dynamic-item').remove(); if(typeof lucide !== 'undefined') lucide.createIcons();" class="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50" title="Remover"><i data-lucide="x" class="w-4 h-4"></i></button>`;
}

window.addFilho = function () {
    const div = document.createElement('div');
    div.className = 'dynamic-item relative bg-white border border-slate-200 rounded-xl p-5 mb-3 slide-in form-filho';
    div.innerHTML = `
        ${removeBtnHtml()}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label class="${labelClasses}">Nome do Filho(a)</label>
                <input type="text" class="filho-nome ${inputClasses}" placeholder="Nome completo">
            </div>
            <div>
                <label class="${labelClasses}">Data de Nascimento</label>
                <input type="date" class="filho-nascimento ${inputClasses}">
            </div>
        </div>
    `;
    document.getElementById('lista-filhos').appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.toggleFilhos = function () {
    const radioVal = document.querySelector('input[name="tem_filhos"]:checked');
    if(!radioVal) return;
    
    const temFilhos = radioVal.value;
    const areaFilhos = document.getElementById('area_filhos');
    
    if (temFilhos === 'sim') {
        if(areaFilhos) areaFilhos.classList.remove('hidden');
        const listaFilhos = document.getElementById('lista-filhos');
        if (listaFilhos && listaFilhos.children.length === 0) {
            window.addFilho();
        }
    } else {
        if(areaFilhos) areaFilhos.classList.add('hidden');
        const listaFilhos = document.getElementById('lista-filhos');
        if(listaFilhos) listaFilhos.innerHTML = ''; 
    }
    updateProgress();
}

window.addGraduacao = function () {
    const div = document.createElement('div');
    div.className = 'dynamic-item relative bg-violet-50/40 border-l-4 border-violet-400 rounded-r-xl p-5 mb-4 slide-in';
    div.innerHTML = `
        ${removeBtnHtml()}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
                <label class="${labelClasses}">Nível</label>
                <select class="grad-nivel ${selectClasses}">
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Bacharelado">Bacharelado</option>
                    <option value="Tecnólogo">Tecnólogo</option>
                </select>
            </div>
            <div>
                <label class="${labelClasses}">Área</label>
                <select class="grad-area ${selectClasses}">
                    <option value="Humanas">Humanas</option>
                    <option value="Exatas">Exatas</option>
                    <option value="Biológicas">Biológicas</option>
                </select>
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="${labelClasses}">Nome do Curso</label>
                <input type="text" class="grad-curso ${inputClasses}" placeholder="Ex: Administração">
            </div>
            <div>
                <label class="${labelClasses}">Ano de Conclusão</label>
                <input type="number" class="grad-ano ${inputClasses}" placeholder="Ano">
            </div>
        </div>
    `;
    document.getElementById('lista-graduacoes').appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addPos = function () {
    const div = document.createElement('div');
    div.className = 'dynamic-item relative bg-indigo-50/40 border-l-4 border-indigo-400 rounded-r-xl p-5 mb-4 slide-in';
    div.innerHTML = `
        ${removeBtnHtml()}
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label class="${labelClasses}">Nível</label>
                <select class="pos-nivel ${selectClasses}">
                    <option value="Lato Sensu">Lato Sensu</option>
                    <option value="MBA">MBA</option>
                    <option value="Mestrado Stricto Sensu">Mestrado Stricto Sensu</option>
                    <option value="Doutorado Stricto Sensu">Doutorado Stricto Sensu</option>
                </select>
            </div>
            <div>
                <label class="${labelClasses}">Nome do Curso</label>
                <input type="text" class="pos-curso ${inputClasses}" placeholder="Ex: MBA em Gestão">
            </div>
            <div>
                <label class="${labelClasses}">Ano de Conclusão</label>
                <input type="number" class="pos-ano ${inputClasses}" placeholder="Ano">
            </div>
        </div>
    `;
    document.getElementById('lista-pos').appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addSenai = function () {
    const div = document.createElement('div');
    div.className = 'dynamic-item relative bg-orange-50/40 border-l-4 border-orange-400 rounded-r-xl p-5 mb-4 slide-in';
    div.innerHTML = `
        ${removeBtnHtml()}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
                <label class="${labelClasses}">Tipo de Curso</label>
                <select class="senai-tipo ${selectClasses}">
                    <option value="CAI">CAI</option>
                    <option value="Técnico">Técnico</option>
                    <option value="FIC">FIC</option>
                </select>
            </div>
            <div>
                <label class="${labelClasses}">Nome do Curso</label>
                <input type="text" class="senai-curso ${inputClasses}" placeholder="Nome do curso">
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="${labelClasses}">Concluído em (Ano)</label>
                <input type="number" class="senai-ano ${inputClasses}" placeholder="Ano">
            </div>
            <div>
                <label class="${labelClasses}">Carga Horária (Para FIC)</label>
                <input type="text" class="senai-carga ${inputClasses}" placeholder="Ex: 80h">
            </div>
        </div>
    `;
    document.getElementById('lista-senai').appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addCurso = function () {
    const div = document.createElement('div');
    div.className = 'dynamic-item relative bg-teal-50/40 border-l-4 border-teal-400 rounded-r-xl p-5 mb-4 slide-in';
    div.innerHTML = `
        ${removeBtnHtml()}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
                <label class="${labelClasses}">Categoria</label>
                <select class="curso-categoria ${selectClasses}">
                    <option value="Idioma">Idioma</option>
                    <option value="Informática">Informática</option>
                    <option value="Outros">Outros</option>
                </select>
            </div>
            <div>
                <label class="${labelClasses}">Nome do Curso / Ferramenta</label>
                <input type="text" class="curso-nome ${inputClasses}" placeholder="Ex: Inglês, Excel...">
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
                <label class="${labelClasses}">Concluído em (Ano)</label>
                <input type="number" class="curso-ano ${inputClasses}" placeholder="Ano">
            </div>
            <div>
                <label class="${labelClasses}">Carga Horária</label>
                <input type="text" class="curso-carga ${inputClasses}" placeholder="Ex: 40h">
            </div>
        </div>
    `;
    document.getElementById('lista-cursos').appendChild(div);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// === SISTEMA DE ACUMULAÇÃO DE ARQUIVOS ===
const acumuladorArquivos = {
    'file_diplomas': new DataTransfer(),
    'file_filhos': new DataTransfer() 
};

function configurarInputMultiplo(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const listaNomesUI = document.createElement('div');
    listaNomesUI.className = 'mt-2 space-y-1.5';
    input.parentNode.appendChild(listaNomesUI);

    input.addEventListener('change', function() {
        const dt = acumuladorArquivos[inputId];
        
        for (let i = 0; i < this.files.length; i++) {
            const novoArquivo = this.files[i];
            let jaExiste = Array.from(dt.files).some(f => f.name === novoArquivo.name);
            
            if (!jaExiste) {
                dt.items.add(novoArquivo);
            }
        }
        
        this.files = dt.files;
        renderizarListaArquivos(inputId, listaNomesUI);
    });
}

function renderizarListaArquivos(inputId, containerUI) {
    containerUI.innerHTML = '';
    const dt = acumuladorArquivos[inputId];
    
    Array.from(dt.files).forEach(file => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm fade-in';
        div.innerHTML = `
            <span class="text-xs text-slate-600 font-medium truncate max-w-[80%]">
                <i data-lucide="file" class="w-3 h-3 inline mr-1 text-slate-400"></i>${file.name}
            </span>
            <button type="button" class="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" onclick="removerArquivoAcumulado('${inputId}', '${file.name}')" title="Remover este arquivo">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        `;
        containerUI.appendChild(div);
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.removerArquivoAcumulado = function(inputId, fileName) {
    const dt = acumuladorArquivos[inputId];
    const novoDt = new DataTransfer();
    
    Array.from(dt.files).forEach(file => {
        if (file.name !== fileName) novoDt.items.add(file);
    });
    
    acumuladorArquivos[inputId] = novoDt;
    
    const input = document.getElementById(inputId);
    if (input) {
        input.files = novoDt.files;
        renderizarListaArquivos(inputId, input.nextElementSibling);
    }
}

window.onload = () => {
    window.addGraduacao();
    window.addPos();
    window.addSenai();
    window.addCurso();
    updateProgress();
    configurarInputMultiplo('file_diplomas');
};

// === LÓGICA DE UPLOAD NO STORAGE ===
async function uploadArquivo(file, pasta) {
    if (!file) return null;
    const caminho = `${pasta}/${usuarioLogado.email}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, caminho);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { nome: file.name, url: downloadURL };
}

async function uploadMultiplosArquivos(inputElement, pasta) {
    if (!inputElement || !inputElement.files || inputElement.files.length === 0) return [];
    const promessas = [];
    for (let i = 0; i < inputElement.files.length; i++) {
        promessas.push(uploadArquivo(inputElement.files[i], pasta));
    }
    return await Promise.all(promessas);
}

async function uploadArquivosDinamicos(seletor, pasta) {
    const inputs = document.querySelectorAll(seletor);
    const promessas = [];
    
    inputs.forEach(input => {
        if (input.files && input.files.length > 0) {
            for (let i = 0; i < input.files.length; i++) {
                promessas.push(uploadArquivo(input.files[i], pasta));
            }
        }
    });
    
    const resultados = await Promise.all(promessas);
    return resultados.filter(res => res !== null); 
}


// === SALVAR NO FIRESTORE ===
const btnSalvar = document.getElementById('btn-salvar');
if(btnSalvar) {
    btnSalvar.addEventListener('click', async () => {
        if (!usuarioLogado) {
            showToast("Sessão expirada. Faça login novamente.", 'error');
            return;
        }

        const nome = document.getElementById('nome').value.trim();
        const nif = document.getElementById('nif').value.trim();
        if (!nome || !nif) {
            showToast("Preencha ao menos Nome e NIF!", 'error');
            return;
        }

        document.getElementById('loading-overlay').classList.remove('hidden');
        document.getElementById('loading-overlay').classList.add('flex');
        
        const pLoading = document.querySelector('#loading-overlay p');
        if (pLoading) pLoading.innerText = "Enviando arquivos... Isto pode levar alguns segundos.";

        try {
            const linksDocumentos = {
                rg: await uploadArquivo(document.getElementById('file_rg')?.files[0], 'documentos_pessoais'),
                cpf: await uploadArquivo(document.getElementById('file_cpf')?.files[0], 'documentos_pessoais'),
                cnh: await uploadArquivo(document.getElementById('file_cnh')?.files[0], 'documentos_pessoais'),
                ctps: await uploadArquivo(document.getElementById('file_ctps')?.files[0], 'documentos_pessoais'),
                reservista: await uploadArquivo(document.getElementById('file_reservista')?.files[0], 'documentos_pessoais'),
                sus: await uploadArquivo(document.getElementById('file_sus')?.files[0], 'documentos_pessoais'),
                certidao: await uploadArquivo(document.getElementById('file_certidao')?.files[0], 'documentos_pessoais'),
                
                filhos: await uploadArquivosDinamicos('input[name="doc_filhos[]"]', 'documentos_dependentes'),
                diplomas: await uploadMultiplosArquivos(document.getElementById('file_diplomas'), 'escolaridade'),
                certificados: await uploadArquivosDinamicos('input[name="certificados[]"]', 'certificados')
            };

            if (pLoading) pLoading.innerText = "A guardar prontuário...";

            let listaDeFilhos = [];
            if (document.querySelector('input[name="tem_filhos"]:checked').value === 'sim') {
                document.querySelectorAll('.form-filho').forEach(el => {
                    const nomeFilho = el.querySelector('.filho-nome').value.trim();
                    const nascimentoFilho = el.querySelector('.filho-nascimento').value;
                    if (nomeFilho) listaDeFilhos.push({ nome: nomeFilho, nascimento: nascimentoFilho });
                });
            }

            let graduacoes = [];
            document.querySelectorAll('.form-graduacao, .dynamic-item .grad-nivel').forEach(el => {
                const parent = el.closest('.dynamic-item');
                if (!parent) return;
                const nivel = parent.querySelector('.grad-nivel');
                if (!nivel) return;
                graduacoes.push({
                    nivel: nivel.value,
                    area: parent.querySelector('.grad-area')?.value || '',
                    curso: parent.querySelector('.grad-curso')?.value || '',
                    ano: parent.querySelector('.grad-ano')?.value || ''
                });
            });

            const seen = new Set();
            graduacoes = graduacoes.filter(g => {
                const key = g.nivel + g.curso + g.ano;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            let pos = [];
            document.querySelectorAll('.pos-nivel').forEach(el => {
                const parent = el.closest('.dynamic-item');
                if (!parent) return;
                pos.push({
                    nivel: el.value,
                    curso: parent.querySelector('.pos-curso')?.value || '',
                    ano: parent.querySelector('.pos-ano')?.value || ''
                });
            });

            let senai = [];
            document.querySelectorAll('.senai-tipo').forEach(el => {
                const parent = el.closest('.dynamic-item');
                if (!parent) return;
                senai.push({
                    tipo: el.value,
                    curso: parent.querySelector('.senai-curso')?.value || '',
                    ano: parent.querySelector('.senai-ano')?.value || '',
                    cargaHoraria: parent.querySelector('.senai-carga')?.value || ''
                });
            });

            let cursos = [];
            document.querySelectorAll('.curso-categoria').forEach(el => {
                const parent = el.closest('.dynamic-item');
                if (!parent) return;
                cursos.push({
                    categoria: el.value,
                    nome: parent.querySelector('.curso-nome')?.value || '',
                    ano: parent.querySelector('.curso-ano')?.value || '',
                    cargaHoraria: parent.querySelector('.curso-carga')?.value || ''
                });
            });

            const dadosProntuario = {
                emailFuncionario: usuarioLogado.email,
                statusCadastro: "pendente",
                dataPreenchimento: new Date().toISOString(),
                dadosPessoais: {
                    nome: nome,
                    nif: nif,
                    endereco: document.getElementById('endereco').value,
                    telefone: document.getElementById('telefone').value,
                    emailParticular: document.getElementById('email_particular').value,
                    estadoCivil: document.getElementById('estado_civil').value,
                    temFilhos: document.querySelector('input[name="tem_filhos"]:checked').value,
                    filhos: listaDeFilhos 
                },
                escolaridadeBasica: {
                    anoMedio: document.getElementById('ano_medio').value,
                    cursoTecnico: document.getElementById('curso_tecnico').value,
                    anoTecnico: document.getElementById('ano_tecnico').value
                },
                graduacoes: graduacoes,
                posGraduacoes: pos,
                senai: senai,
                cursosProfissionalizantes: cursos,
                arquivosAnexados: linksDocumentos
            };

            await addDoc(collection(db, "Funcionarios"), dadosProntuario);
            
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('loading-overlay').classList.remove('flex');
            showToast("Prontuário salvo com sucesso!", 'success');

            btnSalvar.classList.add('pulse-save');
            setTimeout(() => btnSalvar.classList.remove('pulse-save'), 600);

        } catch (error) {
            console.error("Erro ao salvar: ", error);
            document.getElementById('loading-overlay').classList.add('hidden');
            document.getElementById('loading-overlay').classList.remove('flex');
            showToast("Erro ao salvar os dados: " + error.message, 'error');
        }
    });
}

// === GERAÇÃO DOS ANEXOS DINÂMICOS (Filhos e Certificados) ===
document.addEventListener('DOMContentLoaded', () => {
    // LÓGICA PARA DOCUMENTOS DE FILHOS
    const btnAddDocFilho = document.getElementById('btn_add_doc_filho');
    const containerDocsFilhos = document.getElementById('container_docs_filhos');
    let contadorDocsFilhos = 0;

    if(btnAddDocFilho && containerDocsFilhos) {
        btnAddDocFilho.addEventListener('click', () => {
            contadorDocsFilhos++;
            const div = document.createElement('div');
            div.className = 'relative bg-white rounded-lg border border-primary-200 p-3 fade-in shadow-sm hover:border-primary-300 transition-all';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-xs font-semibold text-primary-700">Documento Filho(a) ${contadorDocsFilhos}</label>
                    <button type="button" class="text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onclick="this.parentElement.parentElement.remove()" title="Remover">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <input type="file" name="doc_filhos[]" accept=".pdf,.jpg,.jpeg,.png" class="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:text-xs file:font-semibold file:bg-primary-600 file:text-white file:border-0 hover:file:bg-primary-700 cursor-pointer">
            `;
            containerDocsFilhos.appendChild(div);
            
            if(window.lucide) lucide.createIcons({ root: div });
        });
        btnAddDocFilho.click(); // Inicia com um visível
    }

    // LÓGICA PARA CERTIFICADOS
    const btnAddCertificadoDoc = document.getElementById('btn_add_certificado_doc');
    const containerDocsCertificados = document.getElementById('container_docs_certificados');
    let contadorCertificadosDoc = 0;

    if(btnAddCertificadoDoc && containerDocsCertificados) {
        btnAddCertificadoDoc.addEventListener('click', () => {
            contadorCertificadosDoc++;
            const div = document.createElement('div');
            div.className = 'relative bg-white rounded-lg border border-slate-200 p-3 fade-in shadow-sm hover:border-sky-200 transition-all';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <label class="block text-xs font-semibold text-slate-600">Certificado Adicional ${contadorCertificadosDoc}</label>
                    <button type="button" class="text-xs text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" onclick="this.parentElement.parentElement.remove()" title="Remover">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
                <input type="file" name="certificados[]" accept=".pdf,.jpg,.jpeg,.png" class="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:text-xs file:font-semibold file:bg-sky-600 file:text-white file:border-0 hover:file:bg-sky-700 cursor-pointer">
            `;
            containerDocsCertificados.appendChild(div);
            
            if(window.lucide) lucide.createIcons({ root: div });
        });
        btnAddCertificadoDoc.click(); // Inicia com um visível
    }
});