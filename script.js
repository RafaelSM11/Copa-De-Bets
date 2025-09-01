// ============================
// Variáveis Globais
// ============================
let participantes = [];
let valorApostado = 0;
let totalBanca = 0;
let faseAtual = 1;
let confrontos = [];
let vencedoresConfirmados = {};
let confrontosConfirmados = {};
let maiorGanho = 0;
let jogadorMaiorForrada = "";
let historicoFases = [];
let qtdParticipantes = 16;
let dadosIniciais = { qtd: 16, valor: 0, nomes: [] };
let ranking = {};
let ultimasCopas = [];

// ============================
// Configurações padrão
// ============================
let nomeCopa = "Copa de Cassino";
let porcCampeao = 55;
let porcVice = 15;
let porcMaiorForrada = 10;
let porcOrganizador = 20;

// ============================
// Funções auxiliares
// ============================
function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function atualizarQuantidadeParticipantes() {
  const select = document.getElementById('qtdParticipantes');
  qtdParticipantes = parseInt(select.value);
  const textarea = document.getElementById('textareaParticipantes');
  textarea.rows = qtdParticipantes;
  document.getElementById('infoQtd').textContent = `Digite exatamente ${qtdParticipantes} nomes.`;
}

function calcularValores() {
  valorApostado = parseFloat(document.getElementById('valorAposta').value) || 0;
  totalBanca = valorApostado * participantes.length;
  atualizarValoresPremiacao();
}

function atualizarValoresPremiacao() {
  const premioCampeao = totalBanca * (porcCampeao / 100);
  const premioVice = totalBanca * (porcVice / 100);
  const premioMaiorForrada = totalBanca * (porcMaiorForrada / 100);
  const premioOrganizador = totalBanca * (porcOrganizador / 100);

  document.getElementById('totalBanca')?.textContent = totalBanca.toFixed(2);
  document.getElementById('premioCampeao')?.textContent = premioCampeao.toFixed(2);
  document.getElementById('premioVice')?.textContent = premioVice.toFixed(2);
  document.getElementById('premioOrganizador')?.textContent = premioOrganizador.toFixed(2);

  if (maiorGanho > 0 && jogadorMaiorForrada) {
    document.getElementById('maiorForrada')?.textContent = `${jogadorMaiorForrada} R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    document.getElementById('maiorForrada')?.textContent = "";
  }
}

// ============================
// Sorteio Animado
// ============================
function mostrarTelaSorteio() {
  document.getElementById('setup').style.display = 'none';
  document.getElementById('telaSorteio').style.display = 'block';
}

function voltarParaInicial() {
  document.getElementById('telaSorteio').style.display = 'none';
  document.getElementById('setup').style.display = 'block';
}

function sortearParticipantes() {
  const nomes = document.getElementById('textareaSortear').value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n !== "");

  if (nomes.length === 0) { alert("Digite ao menos 1 nome"); return; }
  if (nomes.length > 40) { alert("Máximo 40 nomes permitidos"); return; }

  const qtd = parseInt(document.getElementById('qtdSortear').value);
  if (qtd > nomes.length) { alert("Quantidade a sortear maior que nomes disponíveis"); return; }

  const embaralhados = embaralhar(nomes.slice());
  const sorteados = embaralhados.slice(0, qtd);
  mostrarSorteados(sorteados);
}

function mostrarSorteados(sorteados) {
  const div = document.getElementById('resultadoSorteio');
  div.innerHTML = "";
  const tempoBase = 500; 

  sorteados.forEach((nome, i) => {
    const bolinha = document.createElement('div');
    bolinha.classList.add('bolinha');
    bolinha.textContent = nome;
    bolinha.style.setProperty('--desloc', `${Math.random()*200 - 100}px`);
    div.appendChild(bolinha);

    setTimeout(() => {
      bolinha.style.animation = `cair 1.5s forwards`;
    }, i * tempoBase);

    setTimeout(() => {
      const btn = document.createElement('button');
      btn.textContent = "Pago";
      btn.style.backgroundColor = "#00ff88";
      btn.style.color = "#000";
      btn.onclick = () => adicionarParticipante(nome, btn);
      bolinha.appendChild(btn);
    }, i * tempoBase + 1500);
  });
}

// ============================
// Função de adicionar participante
// ============================
function adicionarParticipante(nome, btn) {
  const textarea = document.getElementById('textareaParticipantes');
  const atuais = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== "");
  if (!atuais.includes(nome)) {
    textarea.value += (atuais.length > 0 ? '\n' : '') + nome;
    atualizarQuantidadeParticipantes();
  }
  btn.disabled = true;
  btn.textContent = "Adicionado";
  btn.style.backgroundColor = "#aaa";
}

// ============================
// Inicialização
// ============================
window.onload = () => {
  atualizarQuantidadeParticipantes();
};
