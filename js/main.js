// === IMPORTAÇÕES DO FIREBASE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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


// === LÓGICA DE AUTENTICAÇÃO ===
const btnLogin = document.getElementById('btn-login');
if(btnLogin) {
    btnLogin.addEventListener('click', () => {
        signInWithPopup(auth, provider).then((result) => {
            usuarioLogado = result.user;
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


// === GERAÇÃO DINÂMICA DE CAMPOS (Ligados ao objeto window para o HTML acessar) ===
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
    
    // Mostra/esconde apenas a área de dados dos filhos 
    // (o upload dinâmico de doc. dependentes no HTML já fica disponível na seção 7)
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

window.onload = () => {
    window.addGraduacao();
    window.addPos();
    window.addSenai();
    window.addCurso();
    updateProgress();
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

// Upload para um input isolado com propriedade 'multiple'
async function uploadMultiplosArquivos(inputElement, pasta) {
    if (!inputElement || !inputElement.files || inputElement.files.length === 0) return [];
    const promessas = [];
    for (let i = 0; i < inputElement.files.length; i++) {
        promessas.push(uploadArquivo(inputElement.files[i], pasta));
    }
    return await Promise.all(promessas);
}

// NOVA FUNÇÃO: Upload para múltiplos inputs dinâmicos na tela (ex: doc_filhos[], certificados[])
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
    // Filtra para remover valores nulos
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
        if (pLoading) pLoading.innerText = "Enviando arquivos... Isso pode levar alguns segundos.";

        try {
            // Usa encadeamento opcional (?.) para evitar erro se o input não for encontrado
            const linksDocumentos = {
                rg: await uploadArquivo(document.getElementById('file_rg')?.files[0], 'documentos_pessoais'),
                cpf: await uploadArquivo(document.getElementById('file_cpf')?.files[0], 'documentos_pessoais'),
                cnh: await uploadArquivo(document.getElementById('file_cnh')?.files[0], 'documentos_pessoais'),
                ctps: await uploadArquivo(document.getElementById('file_ctps')?.files[0], 'documentos_pessoais'),
                reservista: await uploadArquivo(document.getElementById('file_reservista')?.files[0], 'documentos_pessoais'),
                sus: await uploadArquivo(document.getElementById('file_sus')?.files[0], 'documentos_pessoais'),
                certidao: await uploadArquivo(document.getElementById('file_certidao')?.files[0], 'documentos_pessoais'),
                
                // Atualizado para varrer os inputs dinâmicos:
                filhos: await uploadArquivosDinamicos('input[name="doc_filhos[]"]', 'documentos_dependentes'),
                diplomas: await uploadMultiplosArquivos(document.getElementById('file_diplomas'), 'escolaridade'),
                certificados: await uploadArquivosDinamicos('input[name="certificados[]"]', 'certificados')
            };

            if (pLoading) pLoading.innerText = "Salvando prontuário...";

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