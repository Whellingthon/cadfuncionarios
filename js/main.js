import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCgDbwdOmhyFe4HflcYcOaEX8LXrF3k1U0",
    authDomain: "cadfuncionario-13bac.firebaseapp.com",
    projectId: "cadfuncionario-13bac",
    storageBucket: "cadfuncionario-13bac.appspot.com",
    messagingSenderId: "392240312410",
    appId: "1:392240312410:web:0d9b28dbc4017154d32863",
    measurementId: "G-90G0FMKM1F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let usuarioLogado = null;

// Lógica de Login
document.getElementById('btn-login').addEventListener('click', () => {
    signInWithPopup(auth, provider).then((result) => {
        usuarioLogado = result.user;

        // Esconde login e mostra formulário
        document.getElementById('area-login').classList.add('hidden');
        document.getElementById('area-formulario').classList.remove('hidden');
        document.getElementById('nome-usuario').innerText = usuarioLogado.displayName;
    }).catch((error) => {
        alert("Erro ao fazer login: " + error.message);
    });
});

// Lógica para Salvar no Banco de Dados
document.getElementById('btn-salvar').addEventListener('click', async () => {
    if (!usuarioLogado) return alert("Você precisa estar logado!");

    // Montando o JSON com os dados para o NoSQL
    const dadosProntuario = {
        emailFuncionario: usuarioLogado.email,
        dataPreenchimento: new Date().toISOString(),
        dadosPessoais: {
            nomeCompleto: document.getElementById('nome').value,
            nif: document.getElementById('nif').value
        },
        formacoes: [
            {
                tipo: "Graduação",
                curso: document.getElementById('curso-graduacao').value,
                ano: document.getElementById('ano-graduacao').value
            }
            // Aqui entrariam todos os cursos que a pessoa adicionou dinamicamente
        ]
    };

    try {
        // Salvando na coleção "Funcionarios" no Firestore
        await addDoc(collection(db, "Funcionarios"), dadosProntuario);
        alert("Dados salvos com sucesso no Firebase!");
        // Aqui você poderia recarregar a página ou limpar os campos
    } catch (error) {
        console.error("Erro ao salvar: ", error);
        alert("Erro ao salvar os dados.");
    }
});