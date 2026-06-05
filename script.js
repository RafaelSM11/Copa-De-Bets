// ============================
// Variáveis Globais
// ============================
let participantes = [];
let valorEntrada = 50.00;
let totalBanca = 0;
let faseAtual = 1; 
let confrontos = []; 
let provedoresConfrontos = {}; 
let vencedoresConfrontos = {}; 
let confrontosConfirmados = {}; 
let ganhosJogadores = {};       
let maiorGanho = 0;
let jogadorMaiorForrada = "";
let qtdParticipantes = 16;
let totalFases = 1;

let nomesSorteadosState = [];
let nomesReservaState = [];
let isSorteando = false; 

let estatisticasComputadas = false;
let estatisticasGlobais = JSON.parse(localStorage.getItem('FellCup_Estatisticas')) || {};

// ============================
// Configurações padrão e Roletas
// ============================
let nomeCopa = "FELCUP ENGIENE 2026 by@bobbyzera";
let porcCampeao = 55;
let porcVice = 15;
let porcMaiorForrada = 10;
let porcOrganizador = 20;
let somAtivo = true;
let temaAtual = "padrao";

let jogosPG = [];
let jogosPragmatic = [];

const CUSTO_PG_POR_JOGADOR = 30.00;
const CUSTO_PRAGMATIC_POR_JOGADOR = 40.00;

// ============================
// Efeitos Sonoros (Sintetizador Web Audio API)
// ============================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function tocarSom(tipo) {
  if (!somAtivo) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  
  if (tipo === 'flip') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.1);
  } 
  else if (tipo === 'confirm') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start(now); osc.stop(now + 0.2);
  } 
  else if (tipo === 'win') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(554, now + 0.15);
    osc.frequency.setValueAtTime(659, now + 0.3);
    osc.frequency.setValueAtTime(880, now + 0.45);
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 1.2);
    osc.start(now); osc.stop(now + 1.2);
  }
  else if (tipo === 'vs') {
    // Efeito de suspense dramático
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);
    gainNode.gain.setValueAtTime(0.6, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    osc.start(now); osc.stop(now + 1.5);
  }
}

// ============================
// Histórico Global (Hall da Fama)
// ============================
function getBadges(nomePuro) {
  const stats = estatisticasGlobais[nomePuro];
  if (!stats) return nomePuro; 
  
  let badges = "";
  if (stats.campeao > 0) badges += ` 🏆${stats.campeao}x`;
  if (stats.vice > 0) badges += ` 🥈${stats.vice}x`;
  if (stats.forrada > 0) badges += ` 🔥${stats.forrada}x`;
  
  if (badges !== "") {
    return `${nomePuro} <span class="badge-text">${badges}</span>`;
  }
  return nomePuro;
}

function registrarEstatisticasGlobal(campeao, vice, forrada) {
  if (!estatisticasGlobais[campeao]) estatisticasGlobais[campeao] = {campeao:0, vice:0, forrada:0};
  if (!estatisticasGlobais[vice]) estatisticasGlobais[vice] = {campeao:0, vice:0, forrada:0};
  if (forrada && !estatisticasGlobais[forrada]) estatisticasGlobais[forrada] = {campeao:0, vice:0, forrada:0};

  estatisticasGlobais[campeao].campeao++;
  estatisticasGlobais[vice].vice++;
  if (forrada) estatisticasGlobais[forrada].forrada++;

  localStorage.setItem('FellCup_Estatisticas', JSON.stringify(estatisticasGlobais));
}

function removerEstatisticasGlobal(campeao, vice, forrada) {
  if (estatisticasGlobais[campeao] && estatisticasGlobais[campeao].campeao > 0) estatisticasGlobais[campeao].campeao--;
  if (estatisticasGlobais[vice] && estatisticasGlobais[vice].vice > 0) estatisticasGlobais[vice].vice--;
  if (forrada && estatisticasGlobais[forrada] && estatisticasGlobais[forrada].forrada > 0) estatisticasGlobais[forrada].forrada--;
  
  localStorage.setItem('FellCup_Estatisticas', JSON.stringify(estatisticasGlobais));
}

function abrirHallDaFama() {
  const tbody = document.getElementById('hallFamaList');
  tbody.innerHTML = "";
  
  const ranking = Object.keys(estatisticasGlobais).map(nome => {
    return { nome: nome, ...estatisticasGlobais[nome] };
  });

  if(ranking.length === 0) {
     tbody.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 20px;'>Nenhum histórico registrado ainda. Conclua uma copa primeiro!</td></tr>";
     document.getElementById('modalHallFama').style.display = 'flex';
     return;
  }

  ranking.sort((a, b) => {
    if (b.campeao !== a.campeao) return b.campeao - a.campeao;
    if (b.vice !== a.vice) return b.vice - a.vice;
    return b.forrada - a.forrada;
  });

  ranking.forEach((jog, index) => {
    let pos = index + 1;
    let corNome = "#fff";
    if(pos === 1) corNome = "var(--cor-primaria)";
    if(pos === 2) corNome = "#C0C0C0";
    if(pos === 3) corNome = "#CD7F32";

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pos}º</td>
      <td style="font-weight:bold; color:${corNome}; text-align:left;">${jog.nome}</td>
      <td>${jog.campeao > 0 ? jog.campeao : '-'}</td>
      <td>${jog.vice > 0 ? jog.vice : '-'}</td>
      <td>${jog.forrada > 0 ? jog.forrada : '-'}</td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('modalHallFama').style.display = 'flex';
}

function fecharHallDaFama() {
  document.getElementById('modalHallFama').style.display = 'none';
}

function limparEstatisticas() {
  if(confirm("ATENÇÃO: Isso vai apagar todo o histórico de vitórias e forradas de todos os jogadores para sempre. Deseja continuar?")) {
      estatisticasGlobais = {};
      localStorage.removeItem('FellCup_Estatisticas');
      abrirHallDaFama(); 
  }
}

// ============================
// Salvamento e Backup SaaS
// ============================
function salvarProgresso() {
  const estado = {
    participantes, valorEntrada, faseAtual, confrontos, provedoresConfrontos,
    vencedoresConfrontos, confrontosConfirmados, ganhosJogadores, qtdParticipantes, totalFases,
    textareaText: document.getElementById('textareaParticipantes').value,
    config: { nomeCopa, porcCampeao, porcVice, porcMaiorForrada, porcOrganizador, somAtivo, temaAtual, jogosPG, jogosPragmatic },
    copaIniciada: document.getElementById('copa').style.display === 'block',
    estatisticasComputadas: estatisticasComputadas
  };
  localStorage.setItem('FellCup_EstadoSalvo', JSON.stringify(estado));
}

function carregarProgresso() {
  const saved = localStorage.getItem('FellCup_EstadoSalvo');
  if (saved) {
    const estado = JSON.parse(saved);
    
    participantes = estado.participantes || [];
    valorEntrada = estado.valorEntrada || 50.00;
    faseAtual = estado.faseAtual || 1;
    confrontos = estado.confrontos || [];
    provedoresConfrontos = estado.provedoresConfrontos || {};
    vencedoresConfrontos = estado.vencedoresConfrontos || {};
    confrontosConfirmados = estado.confrontosConfirmados || {};
    ganhosJogadores = estado.ganhosJogadores || {};
    qtdParticipantes = estado.qtdParticipantes || 16;
    totalFases = estado.totalFases || 1;
    estatisticasComputadas = estado.estatisticasComputadas || false;

    if (estado.config) {
      nomeCopa = estado.config.nomeCopa || nomeCopa;
      porcCampeao = estado.config.porcCampeao || 55;
      porcVice = estado.config.porcVice || 15;
      porcMaiorForrada = estado.config.porcMaiorForrada || 10;
      porcOrganizador = estado.config.porcOrganizador || 20;
      somAtivo = estado.config.somAtivo !== undefined ? estado.config.somAtivo : true;
      temaAtual = estado.config.temaAtual || "padrao";
      jogosPG = estado.config.jogosPG || [];
      jogosPragmatic = estado.config.jogosPragmatic || [];

      document.getElementById('tituloCopa').textContent = nomeCopa;
      document.title = nomeCopa;
      document.body.setAttribute('data-theme', temaAtual);
    }

    document.getElementById('valorEntrada').value = valorEntrada;
    document.getElementById('qtdParticipantes').value = qtdParticipantes;
    document.getElementById('textareaParticipantes').value = estado.textareaText || "";

    calcularValores();

    if (estado.copaIniciada) {
      document.getElementById('setup').style.display = 'none';
      document.getElementById('blocoSorteio').style.display = 'none';
      document.getElementById('copa').style.display = 'block';
      renderizarConfrontosBracket();
      
      if (faseAtual > totalFases) {
        const campeao = vencedoresConfrontos[`${totalFases}_0`];
        const duplaFinal = confrontos[totalFases][0];
        if (campeao && duplaFinal) finalizarCampeonato(campeao, duplaFinal);
      }
    }
  } else {
    atualizarValoresGerais();
    atualizarQuantidadeParticipantes();
  }
}

function exportarBackup() {
  salvarProgresso();
  const dataToExport = {
    versao: 2,
    copa: JSON.parse(localStorage.getItem('FellCup_EstadoSalvo')),
    estatisticas: estatisticasGlobais
  };
  
  const blob = new Blob([JSON.stringify(dataToExport)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Backup_${nomeCopa.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importarBackup(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      if(json.versao === 2) {
        localStorage.setItem('FellCup_EstadoSalvo', JSON.stringify(json.copa));
        localStorage.setItem('FellCup_Estatisticas', JSON.stringify(json.estatisticas || {}));
      } else if (json.participantes !== undefined) {
        localStorage.setItem('FellCup_EstadoSalvo', JSON.stringify(json));
      } else {
        return alert("Arquivo JSON inválido!");
      }
      alert("Backup restaurado com sucesso! Recarregando...");
      location.reload();
    } catch(err) { alert("Erro ao ler o arquivo."); }
  };
  reader.readAsText(file);
}

function reiniciarCopaConfirmar() {
  if(confirm("Deseja apagar a copa atual e criar uma do zero? (As estatísticas globais NÃO serão perdidas, apenas a copa atual)")) {
    localStorage.removeItem('FellCup_EstadoSalvo');
    location.reload();
  }
}

// ============================
// Lógica Matemática
// ============================
function embaralhar(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function atualizarQuantidadeParticipantes() {
  const input = document.getElementById('qtdParticipantes');
  qtdParticipantes = parseInt(input.value) || 16;
  const textarea = document.getElementById('textareaParticipantes');
  textarea.rows = qtdParticipantes;
  document.getElementById('infoQtd').textContent = `Os ${qtdParticipantes} nomes confirmados aparecerão aqui.`;
  atualizarValoresGerais();
}

function atualizarValoresGerais() {
  const inputEntrada = document.getElementById('valorEntrada');
  if (inputEntrada) valorEntrada = parseFloat(inputEntrada.value) || 0;
  calcularValores();
  salvarProgresso();
}

function calcularValores() {
  const bancaInicial = qtdParticipantes * valorEntrada;
  let somaLiquido = 0;

  for (let chave in ganhosJogadores) {
    const partes = chave.split('_');
    const chaveConfronto = `${partes[0]}_${partes[1]}`;
    const provSelecionado = provedoresConfrontos[chaveConfronto] || "PG";
    const custoEntrada = provSelecionado === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;
    const ganho = ganhosJogadores[chave] || 0;
    somaLiquido += (ganho - custoEntrada);
  }

  totalBanca = bancaInicial + somaLiquido;
  if (totalBanca < 0) totalBanca = 0; 

  CalcularMaiorForradaReal();
  atualizarValoresPremiacao();
}

function CalcularMaiorForradaReal() {
  maiorGanho = 0;
  jogadorMaiorForrada = "";
  for (let chave in ganhosJogadores) {
    const valor = ganhosJogadores[chave] || 0;
    if (valor > maiorGanho) {
      maiorGanho = valor;
      const partes = chave.split('_');
      jogadorMaiorForrada = partes.slice(2).join('_'); 
    }
  }
}

function atualizarValoresPremiacao() {
  const premioCampeao = totalBanca * (porcCampeao / 100);
  const premioVice = totalBanca * (porcVice / 100);
  const premioMaiorForrada = totalBanca * (porcMaiorForrada / 100);
  const premioOrganizador = totalBanca * (porcOrganizador / 100);

  document.getElementById('totalBanca').textContent = totalBanca.toFixed(2);
  document.getElementById('premioCampao').textContent = premioCampeao.toFixed(2);
  document.getElementById('premioVice').textContent = premioVice.toFixed(2);
  document.getElementById('premioOrganizador').textContent = premioOrganizador.toFixed(2);

  const campoMaiorForrada = document.getElementById('maiorForrada');
  if (maiorGanho > 0 && jogadorMaiorForrada) {
    campoMaiorForrada.innerHTML = `${getBadges(jogadorMaiorForrada)} (R$ ${maiorGanho.toFixed(2)})<br>Prêmio: R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    campoMaiorForrada.textContent = "-";
  }
}

// ============================
// Fluxo do Torneio (Bracket)
// ============================
function iniciarCopa() {
  atualizarValoresGerais();
  const textarea = document.getElementById('textareaParticipantes');
  participantes = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== "");

  if (participantes.length !== qtdParticipantes) {
    alert(`A Copa exige exatamente ${qtdParticipantes} nomes confirmados na caixa de participantes.`);
    return;
  }

  const listaEmbaralhada = embaralhar(participantes.slice());
  confrontos = [];
  confrontos[1] = []; 
  estatisticasComputadas = false;

  for (let i = 0; i < listaEmbaralhada.length; i += 2) {
    const j1 = listaEmbaralhada[i];
    const j2 = listaEmbaralhada[i+1] || "BYE (Avança Direto)";
    confrontos[1].push([j1, j2]);
    provedoresConfrontos[`1_${confrontos[1].length - 1}`] = "PG";
  }

  let tempMatches = confrontos[1].length;
  totalFases = 1;
  while(tempMatches > 1) {
    tempMatches = Math.ceil(tempMatches / 2);
    totalFases++;
  }

  faseAtual = 1;
  document.getElementById('setup').style.display = 'none';
  document.getElementById('blocoSorteio').style.display = 'none';
  document.getElementById('copa').style.display = 'block';

  renderizarConfrontosBracket();
  salvarProgresso();
}

function getNomeFase(faseNum, total) {
  const matches = Math.ceil(confrontos[1].length / Math.pow(2, faseNum - 1));
  if (matches === 1) return "Grande Final";
  if (matches === 2) return "Semifinal";
  if (matches === 3 || matches === 4) return "Quartas de Final";
  if (matches > 4 && matches <= 8) return "Oitavas de Final";
  return `Fase ${faseNum}`;
}

function renderizarConfrontosBracket() {
  const wrapper = document.getElementById('confrontos');
  wrapper.innerHTML = "";

  document.getElementById('faseNome').textContent = getNomeFase(faseAtual, totalFases) + ` (Fase ${faseAtual} de ${totalFases})`;
  
  const btnAvancar = document.getElementById('btnAvancar');
  const btnVoltar = document.getElementById('btnVoltar');
  
  btnAvancar.style.display = faseAtual > totalFases ? 'none' : 'inline-block';
  btnVoltar.style.display = faseAtual === 1 ? 'none' : 'inline-block';

  let matchesInPhase = confrontos[1].length;

  for (let f = 1; f <= totalFases; f++) {
    const colDiv = document.createElement('div');
    colDiv.className = 'bracket-col';

    const colTitle = document.createElement('div');
    colTitle.className = 'bracket-col-title';
    colTitle.textContent = getNomeFase(f, totalFases);
    colDiv.appendChild(colTitle);

    for (let m = 0; m < matchesInPhase; m++) {
      const matchDiv = document.createElement('div');
      
      if (f < faseAtual) {
        const dupla = confrontos[f][m];
        const vencedor = vencedoresConfrontos[`${f}_${m}`];
        matchDiv.className = 'bracket-box locked';
        
        let p1Class = "player-locked";
        let p2Class = "player-locked";
        
        let p1Name = getBadges(dupla[0]);
        let p2Name = getBadges(dupla[1]);

        if (vencedor === dupla[0]) {
            p1Class += " winner-highlight";
            p2Class += " loser-fade";
            p1Name = `👑 ${p1Name}`;
        } else if (vencedor === dupla[1]) {
            p2Class += " winner-highlight";
            p1Class += " loser-fade";
            p2Name = `👑 ${p2Name}`;
        }

        matchDiv.innerHTML = `
          <div class="${p1Class}">${p1Name}</div>
          <div class="${p2Class}">${p2Name}</div>
        `;
      } 
      else if (f === faseAtual) {
        const dupla = confrontos[f][m];
        const chaveElemento = `${f}_${m}`;
        const provSelecionado = provedoresConfrontos[chaveElemento] || "PG";
        const vencedorAtual = vencedoresConfrontos[chaveElemento] || null;
        const isConfirmado = confrontosConfirmados[chaveElemento] || false;

        const ganhoJ1 = ganhosJogadores[`${chaveElemento}_${dupla[0]}`] || 0;
        const ganhoJ2 = ganhosJogadores[`${chaveElemento}_${dupla[1]}`] || 0;

        const custoEntrada = provSelecionado === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;
        const liquidoJ1 = ganhoJ1 - custoEntrada;
        const liquidoJ2 = ganhoJ2 - custoEntrada;

        matchDiv.className = `bracket-box active ${isConfirmado ? 'confirmado' : ''}`;
        
        let p1BoxClass = "player-input-box";
        let p2BoxClass = "player-input-box";
        
        let p1Name = getBadges(dupla[0]);
        let p2Name = getBadges(dupla[1]);
        
        let p1NameClass = "player-name";
        let p2NameClass = "player-name";

        if (isConfirmado) {
            if (vencedorAtual === dupla[0]) {
                p1BoxClass += " winner-highlight";
                p2BoxClass += " loser-fade";
                p1Name = `👑 ${p1Name}`;
                p1NameClass += " crown";
            } else if (vencedorAtual === dupla[1]) {
                p2BoxClass += " winner-highlight";
                p1BoxClass += " loser-fade";
                p2Name = `👑 ${p2Name}`;
                p2NameClass += " crown";
            }
        }
        
        matchDiv.innerHTML = `
          <div class="bracket-header">
            <select onchange="alterarProvedor(${f}, ${m}, this.value)" ${isConfirmado ? 'disabled' : ''}>
              <option value="PG" ${provSelecionado === "PG" ? "selected" : ""}>PG (R$ 30)</option>
              <option value="Pragmatic" ${provSelecionado === "Pragmatic" ? "selected" : ""}>Pragmatic (R$ 40)</option>
            </select>
            <button class="btn-vs" onclick="mostrarCaraACara(${f}, ${m})" title="Apresentar Confronto" ${isConfirmado ? 'disabled' : ''}>⚔️</button>
            <button class="btn-roleta" onclick="abrirRoleta(${f}, ${m})" title="Sortear Jogo" ${isConfirmado ? 'disabled' : ''}>🎰</button>
          </div>
          
          <div class="${p1BoxClass}">
            <div class="${p1NameClass}">${p1Name}</div>
            <div class="player-data">
              <input type="number" step="0.01" placeholder="R$ Ganho" value="${ganhoJ1 || ''}" 
                oninput="salvarGanho(${f}, ${m}, '${dupla[0]}', 1, this.value)" ${isConfirmado ? 'disabled' : ''}>
              <span id="liq_${f}_${m}_1" class="liq-span ${liquidoJ1 >= 0 ? 'lucro' : 'prejuizo'}">Liq: ${liquidoJ1 >= 0 ? '+' : ''}${liquidoJ1.toFixed(2)}</span>
            </div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="${p2BoxClass}">
            <div class="${p2NameClass}">${p2Name}</div>
            <div class="player-data">
              <input type="number" step="0.01" placeholder="R$ Ganho" value="${ganhoJ2 || ''}" 
                oninput="salvarGanho(${f}, ${m}, '${dupla[1]}', 2, this.value)" ${isConfirmado ? 'disabled' : ''}>
              <span id="liq_${f}_${m}_2" class="liq-span ${liquidoJ2 >= 0 ? 'lucro' : 'prejuizo'}">Liq: ${liquidoJ2 >= 0 ? '+' : ''}${liquidoJ2.toFixed(2)}</span>
            </div>
          </div>

          <div class="bracket-footer">
            ${!isConfirmado ? `
              <button class="btn-conf" onclick="confirmarMatch(${f}, ${m})">🔒 Confirmar</button>
            ` : `
              <button class="btn-edit" onclick="editarMatch(${f}, ${m})">✏️ Editar</button>
            `}
          </div>
        `;
      } 
      else {
        matchDiv.className = 'bracket-box future';
        matchDiv.innerHTML = `
          <div class="player-locked">???</div>
          <div class="player-locked">???</div>
        `;
      }

      colDiv.appendChild(matchDiv);
    }
    wrapper.appendChild(colDiv);
    matchesInPhase = Math.ceil(matchesInPhase / 2);
  }

  if (faseAtual > totalFases) {
    const colDiv = document.createElement('div');
    colDiv.className = 'bracket-col';
    const matchDiv = document.createElement('div');
    matchDiv.className = 'bracket-box champion-box winner-highlight';
    
    const campeaoBruto = document.getElementById('vencedorFinal').textContent;
    matchDiv.innerHTML = `<h3>🏆 Campeão</h3><div class="player-locked crown" style="font-size:20px; padding:20px; border:none;">👑 ${getBadges(campeaoBruto)}</div>`;
    colDiv.appendChild(matchDiv);
    wrapper.appendChild(colDiv);
  }
}

function alterarProvedor(fase, matchIndex, provedor) {
  provedoresConfrontos[`${fase}_${matchIndex}`] = provedor;
  calcularValores();
  atualizarSpansLiquido(fase, matchIndex);
  salvarProgresso();
}

function salvarGanho(fase, matchIndex, nomeJogador, playerNum, valor) {
  ganhosJogadores[`${fase}_${matchIndex}_${nomeJogador}`] = parseFloat(valor) || 0;
  calcularValores();
  atualizarSpansLiquido(fase, matchIndex);
  salvarProgresso();
}

function atualizarSpansLiquido(fase, matchIndex) {
  const chave = `${fase}_${matchIndex}`;
  const dupla = confrontos[fase][matchIndex];
  const prov = provedoresConfrontos[chave] || "PG";
  const custo = prov === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;

  const ganho1 = ganhosJogadores[`${chave}_${dupla[0]}`] || 0;
  const liq1 = ganho1 - custo;
  const span1 = document.getElementById(`liq_${fase}_${matchIndex}_1`);
  if (span1) {
    span1.textContent = `Liq: ${liq1 >= 0 ? '+' : ''}${liq1.toFixed(2)}`;
    span1.className = `liq-span ${liq1 >= 0 ? 'lucro' : 'prejuizo'}`;
  }

  const ganho2 = ganhosJogadores[`${chave}_${dupla[1]}`] || 0;
  const liq2 = ganho2 - custo;
  const span2 = document.getElementById(`liq_${fase}_${matchIndex}_2`);
  if (span2) {
    span2.textContent = `Liq: ${liq2 >= 0 ? '+' : ''}${liq2.toFixed(2)}`;
    span2.className = `liq-span ${liq2 >= 0 ? 'lucro' : 'prejuizo'}`;
  }
}

function confirmarMatch(fase, matchIndex) {
  const chaveElemento = `${fase}_${matchIndex}`;
  const dupla = confrontos[fase][matchIndex];

  const ganhoJ1 = ganhosJogadores[`${chaveElemento}_${dupla[0]}`] || 0;
  const ganhoJ2 = ganhosJogadores[`${chaveElemento}_${dupla[1]}`] || 0;

  if (ganhoJ1 === 0 && ganhoJ2 === 0) {
    if (!confirm("Os dois estão zerados. Confirmar empate?")) return;
  }

  if (ganhoJ1 > ganhoJ2) {
    vencedoresConfrontos[chaveElemento] = dupla[0];
  } else if (ganhoJ2 > ganhoJ1) {
    vencedoresConfrontos[chaveElemento] = dupla[1];
  } else {
    const desempate = prompt(`Empate (${ganhoJ1}x${ganhoJ2}). Quem avança?\n1 - ${dupla[0]}\n2 - ${dupla[1]}`);
    if (desempate === "1") vencedoresConfrontos[chaveElemento] = dupla[0];
    else if (desempate === "2") vencedoresConfrontos[chaveElemento] = dupla[1];
    else return alert("Ação cancelada.");
  }

  confrontosConfirmados[chaveElemento] = true;
  tocarSom('confirm');
  renderizarConfrontosBracket();
  salvarProgresso();
}

function editarMatch(fase, matchIndex) {
  confrontosConfirmados[`${fase}_${matchIndex}`] = false;
  vencedoresConfrontos[`${fase}_${matchIndex}`] = null;
  renderizarConfrontosBracket();
  salvarProgresso();
}

function avancarFase() {
  const listaAtuais = confrontos[faseAtual];
  const proximosVencedores = [];

  for (let i = 0; i < listaAtuais.length; i++) {
    const chave = `${faseAtual}_${i}`;
    if (!confrontosConfirmados[chave]) {
      alert(`O confronto da chave ${i + 1} ainda não foi confirmado!`);
      return;
    }
    proximosVencedores.push(vencedoresConfrontos[chave]);
  }

  if (faseAtual === totalFases) {
    faseAtual++; 
    
    const campeaoFinal = proximosVencedores[0];
    const duplaFinal = listaAtuais[0];
    const viceFinal = duplaFinal[0] === campeaoFinal ? duplaFinal[1] : duplaFinal[0];

    if (!estatisticasComputadas) {
      registrarEstatisticasGlobal(campeaoFinal, viceFinal, jogadorMaiorForrada);
      estatisticasComputadas = true;
      salvarProgresso();
    }

    finalizarCampeonato(campeaoFinal, duplaFinal);
    renderizarConfrontosBracket();
    return;
  }

  faseAtual++;
  confrontos[faseAtual] = [];
  for (let i = 0; i < proximosVencedores.length; i += 2) {
    const j1 = proximosVencedores[i];
    const j2 = proximosVencedores[i+1] || "BYE (Avança Direto)";
    confrontos[faseAtual].push([j1, j2]);
    provedoresConfrontos[`${faseAtual}_${confrontos[faseAtual].length - 1}`] = "PG";
  }

  renderizarConfrontosBracket();
  salvarProgresso();
}

function voltarFase() {
  if (faseAtual > 1) {
    if (faseAtual > totalFases && estatisticasComputadas) {
        const campeaoFinal = vencedoresConfrontos[`${totalFases}_0`];
        const duplaFinal = confrontos[totalFases][0];
        const viceFinal = duplaFinal[0] === campeaoFinal ? duplaFinal[1] : duplaFinal[0];
        
        removerEstatisticasGlobal(campeaoFinal, viceFinal, jogadorMaiorForrada);
        estatisticasComputadas = false;
    }

    faseAtual--;
    renderizarConfrontosBracket();
    salvarProgresso();
  }
}

function finalizarCampeonato(campeao, duplaFinal) {
  const vice = duplaFinal[0] === campeao ? duplaFinal[1] : duplaFinal[0];
  
  const premioCampeao = totalBanca * (porcCampeao / 100);
  const premioVice = totalBanca * (porcVice / 100);
  const premioMaiorForrada = totalBanca * (porcMaiorForrada / 100);
  const premioOrganizador = totalBanca * (porcOrganizador / 100);

  document.getElementById('vencedorFinal').textContent = campeao;
  document.getElementById('vencedorPremioCampeao').textContent = `R$ ${premioCampeao.toFixed(2)}`;
  
  document.getElementById('vencedorVice').innerHTML = `${getBadges(vice)} (R$ ${premioVice.toFixed(2)})`;
  
  if (maiorGanho > 0 && jogadorMaiorForrada) {
    document.getElementById('vencedorMaiorForrada').innerHTML = `${getBadges(jogadorMaiorForrada)} (R$ ${maiorGanho.toFixed(2)})<br>Prêmio: R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    document.getElementById('vencedorMaiorForrada').textContent = "-";
  }

  document.getElementById('vencedorOrganizador').textContent = `R$ ${premioOrganizador.toFixed(2)}`;
  
  tocarSom('win');
  document.getElementById('cardFinal').style.display = 'flex';
}

function gerarPDF() {
  document.getElementById('pdfTitulo').textContent = nomeCopa;
  
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR');
  document.getElementById('pdfData').textContent = `Gerado em: ${dataFormatada}`;
  
  document.getElementById('pdfCampeao').textContent = document.getElementById('vencedorFinal').textContent;
  
  const viceHTML = document.getElementById('vencedorVice').textContent; 
  document.getElementById('pdfVice').textContent = viceHTML.split(' (')[0]; 
  
  document.getElementById('pdfMaiorForrada').textContent = document.getElementById('vencedorMaiorForrada').textContent.split(' (')[0];
  
  document.getElementById('pdfBanca').textContent = totalBanca.toFixed(2);
  document.getElementById('pdfPremioCampeao').textContent = (totalBanca * (porcCampeao / 100)).toFixed(2);
  document.getElementById('pdfPremioVice').textContent = (totalBanca * (porcVice / 100)).toFixed(2);
  document.getElementById('pdfPremioMaiorForrada').textContent = (totalBanca * (porcMaiorForrada / 100)).toFixed(2);
  document.getElementById('pdfPremioOrganizador').textContent = (totalBanca * (porcOrganizador / 100)).toFixed(2);

  document.getElementById('pdfParticipantes').innerHTML = participantes.map(p => `• ${p}`).join('<br>');

  const elemento = document.getElementById('relatorioPDF');
  elemento.style.display = 'block';

  const opt = {
    margin:       15,
    filename:     `${nomeCopa.replace(/\s+/g, '_')}_${hoje.getTime()}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(elemento).save().then(() => {
    elemento.style.display = 'none';
  });
}

// ============================
// Lógica do Sorteio (Efeito Cartas Virando)
// ============================
function toggleBlocoSorteio() {
  const bloco = document.getElementById('blocoSorteio');
  bloco.style.display = bloco.style.display === 'none' || bloco.style.display === '' ? 'block' : 'none';
}

function sortearParticipantes() {
  if (isSorteando) return; 

  const nomes = document.getElementById('textareaSortear').value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n !== "");

  if (nomes.length === 0) { alert("Digite ao menos 1 nome na caixa de sorteio."); return; }
  
  const qtd = parseInt(document.getElementById('qtdSortear').value) || 1;
  if (qtd > nomes.length) { alert("A quantidade a sortear não pode ser maior que o número de nomes disponíveis."); return; }

  isSorteando = true;
  document.getElementById('btnSorteio').disabled = true;

  const embaralhados = embaralhar(nomes.slice());
  const sorteadosFinais = embaralhados.slice(0, qtd);
  nomesReservaState = embaralhados.slice(qtd);
  nomesSorteadosState = []; 
  
  document.getElementById('resultadoSorteio').innerHTML = "";
  
  const cardsContainer = document.getElementById('cardsContainer');
  cardsContainer.style.display = 'flex';
  cardsContainer.innerHTML = "";

  sorteadosFinais.forEach((nome, i) => {
    const card = document.createElement('div');
    card.className = 'flip-card';
    card.id = `carta-${i}`;
    card.innerHTML = `
      <div class="flip-card-inner">
        <div class="flip-card-front">🃏</div>
        <div class="flip-card-back">${nome}</div>
      </div>
    `;
    cardsContainer.appendChild(card);
  });

  setTimeout(() => { animarCartasSorteio(sorteadosFinais, 0); }, 800);
}

function animarCartasSorteio(sorteadosFinais, indexAtual) {
  if (indexAtual >= sorteadosFinais.length) {
     isSorteando = false;
     document.getElementById('btnSorteio').disabled = false;
     return;
  }

  const card = document.getElementById(`carta-${indexAtual}`);
  const alvoNome = sorteadosFinais[indexAtual];
  
  tocarSom('flip');
  card.classList.add('flipped');

  setTimeout(() => {
      nomesSorteadosState.push(alvoNome);
      renderizarListaSorteio();
      setTimeout(() => { animarCartasSorteio(sorteadosFinais, indexAtual + 1); }, 700); 
  }, 600); 
}

function renderizarListaSorteio() {
  const div = document.getElementById('resultadoSorteio');
  div.innerHTML = "";
  
  if (nomesSorteadosState.length === 0) return;

  const tituloLista = document.createElement('h3');
  tituloLista.textContent = "Participantes Sorteados:";
  tituloLista.style.color = "var(--cor-primaria)";
  tituloLista.style.marginTop = "20px";
  div.appendChild(tituloLista);

  const lista = document.createElement('div');
  lista.className = "lista-sorteados";
  
  const textarea = document.getElementById('textareaParticipantes');
  const atuais = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== "");

  nomesSorteadosState.forEach((nome, i) => {
    const item = document.createElement('div');
    item.className = "item-sorteado";
    
    if (atuais.includes(nome)) {
      item.classList.add('sorteado-confirmado');
      item.innerHTML = `<span class="nome-sorteado" style="text-decoration: line-through;">${i + 1}. ${getBadges(nome)}</span> <span style="color:var(--cor-secundaria); font-weight:bold; font-size:14px;">✅ Confirmado</span>`;
    } else {
      item.innerHTML = `
        <span class="nome-sorteado">${i + 1}. ${getBadges(nome)}</span>
        <div class="acoes-sorteio">
          <button class="btn-acao-sorteio btn-ok" onclick="confirmarSorteado('${nome}')" title="Aprovar e adicionar à copa">✅</button>
          <button class="btn-acao-sorteio btn-x" onclick="trocarSorteado(${i})" title="Remover e puxar o próximo da reserva">❌</button>
        </div>
      `;
    }
    lista.appendChild(item);
  });
  
  div.appendChild(lista);
}

function confirmarSorteado(nome) {
  const textarea = document.getElementById('textareaParticipantes');
  let atuais = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== "");
  
  if (atuais.length >= qtdParticipantes) {
    alert(`A lista oficial já atingiu o limite de ${qtdParticipantes} participantes!`);
    return;
  }

  if (!atuais.includes(nome)) {
    atuais.push(nome);
    textarea.value = atuais.join('\n');
    salvarProgresso();
  }
  renderizarListaSorteio();
}

function trocarSorteado(index) {
  if (nomesReservaState.length === 0) {
    alert("Não há mais nomes no banco de reservas para fazer a substituição.");
    return;
  }
  
  const nomeRemovido = nomesSorteadosState[index];
  const novoNome = nomesReservaState.shift(); 
  
  nomesSorteadosState[index] = novoNome;
  nomesReservaState.push(nomeRemovido); 
  renderizarListaSorteio();
}

// ============================
// Modais de Configurações
// ============================
function abrirConfig() { 
  document.getElementById('inputNomeCopa').value = nomeCopa;
  document.getElementById('inputCampeao').value = porcCampeao;
  document.getElementById('inputVice').value = porcVice;
  document.getElementById('inputMaiorForrada').value = porcMaiorForrada;
  document.getElementById('inputOrganizador').value = porcOrganizador;
  
  document.getElementById('inputSom').value = somAtivo ? "true" : "false";
  document.getElementById('inputTema').value = temaAtual;
  
  document.getElementById('inputJogosPG').value = jogosPG.join('\n');
  document.getElementById('inputJogosPragmatic').value = jogosPragmatic.join('\n');

  document.getElementById('modalConfig').style.display = 'flex'; 
}

function fecharConfig() { document.getElementById('modalConfig').style.display = 'none'; }

function salvarConfig() { 
  const novoNome = document.getElementById('inputNomeCopa').value;
  if (novoNome.trim() !== "") {
    nomeCopa = novoNome;
    document.getElementById('tituloCopa').textContent = nomeCopa;
    document.title = nomeCopa;
  }

  porcCampeao = parseFloat(document.getElementById('inputCampeao').value) || porcCampeao;
  porcVice = parseFloat(document.getElementById('inputVice').value) || porcVice;
  porcMaiorForrada = parseFloat(document.getElementById('inputMaiorForrada').value) || porcMaiorForrada;
  porcOrganizador = parseFloat(document.getElementById('inputOrganizador').value) || porcOrganizador;
  
  somAtivo = document.getElementById('inputSom').value === "true";
  temaAtual = document.getElementById('inputTema').value;
  
  jogosPG = document.getElementById('inputJogosPG').value.split('\n').map(n => n.trim()).filter(n => n !== "");
  jogosPragmatic = document.getElementById('inputJogosPragmatic').value.split('\n').map(n => n.trim()).filter(n => n !== "");

  document.body.setAttribute('data-theme', temaAtual);

  calcularValores();
  salvarProgresso();
  
  alert("Configurações salvas com sucesso!"); 
  fecharConfig(); 
}

// ============================
// Sistema Cara a Cara (VS)
// ============================
function mostrarCaraACara(fase, matchIndex) {
  const dupla = confrontos[fase][matchIndex];
  
  document.getElementById('vsP1').innerHTML = dupla[0];
  document.getElementById('vsP2').innerHTML = dupla[1];

  const tela = document.getElementById('telaVs');
  tela.style.display = 'flex';
  tocarSom('vs');

  const left = document.querySelector('.vs-player-left');
  const right = document.querySelector('.vs-player-right');
  const center = document.querySelector('.vs-center-logo');
  
  left.style.animation = 'none'; 
  right.style.animation = 'none'; 
  center.style.animation = 'none';
  
  setTimeout(() => {
      left.style.animation = 'slideInLeft 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
      right.style.animation = 'slideInRight 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards';
      center.style.animation = 'zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.3s';
  }, 10);

  setTimeout(() => {
      tela.style.display = 'none';
  }, 3500);
}

// ============================
// Sistema de Roleta
// ============================
let roletaAtualJogos = [];
let anguloAtual = 0;
let roletaGirando = false;

function abrirRoleta(f, m) {
  const chave = `${f}_${m}`;
  const provSelecionado = provedoresConfrontos[chave] || "PG";
  
  roletaAtualJogos = provSelecionado === "PG" ? jogosPG : jogosPragmatic;

  if(roletaAtualJogos.length === 0) {
    alert(`Você não configurou os jogos da ${provSelecionado}. Vá em Configurações e adicione a lista de jogos!`);
    return;
  }

  document.getElementById('tituloRoleta').textContent = `🎰 Roleta ${provSelecionado}`;
  document.getElementById('resultadoRoleta').innerHTML = "";
  document.getElementById('btnGirarRoleta').disabled = false;
  anguloAtual = 0;
  
  desenharRoleta();
  document.getElementById('modalRoleta').style.display = 'flex';
}

function fecharRoleta() {
  if (roletaGirando) return; 
  document.getElementById('modalRoleta').style.display = 'none';
}

function desenharRoleta() {
  const canvas = document.getElementById('canvasRoleta');
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;
  
  const sliceAngle = (2 * Math.PI) / roletaAtualJogos.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < roletaAtualJogos.length; i++) {
    const startAngle = anguloAtual + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.fillStyle = i % 2 === 0 ? '#1a1a1a' : '#333333';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffd700';
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.fillText(roletaAtualJogos[i], radius - 20, 5);
    ctx.restore();
  }
}

function girarRoleta() {
  if (roletaGirando || roletaAtualJogos.length === 0) return;
  roletaGirando = true;
  document.getElementById('btnGirarRoleta').disabled = true;
  document.getElementById('resultadoRoleta').innerHTML = "<span style='color:#aaa;'>Sorteando...</span>";
  
  const voltasIniciais = Math.floor(Math.random() * 5) + 5; 
  const anguloExtra = Math.random() * Math.PI * 2;
  const anguloFinal = anguloAtual + (voltasIniciais * Math.PI * 2) + anguloExtra;
  
  let startTime = null;
  const duration = 4000; 

  function animar(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percent = Math.min(progress / duration, 1);
    
    const easeOut = 1 - Math.pow(1 - percent, 4);
    
    anguloAtual = anguloFinal * easeOut;
    desenharRoleta();
    
    if (progress % 150 < 20) tocarSom('flip');
    
    if (percent < 1) {
      requestAnimationFrame(animar);
    } else {
      roletaGirando = false;
      tocarSom('win');
      
      const normalizedAngle = anguloAtual % (2 * Math.PI);
      const sliceAngle = (2 * Math.PI) / roletaAtualJogos.length;
      let pointerAngle = (1.5 * Math.PI - normalizedAngle);
      while(pointerAngle < 0) pointerAngle += 2 * Math.PI;
      
      const winningIndex = Math.floor(pointerAngle / sliceAngle);
      const jogoVencedor = roletaAtualJogos[winningIndex];
      
      document.getElementById('resultadoRoleta').innerHTML = `🎮 <strong style="font-size:22px; color:#fff;">${jogoVencedor}</strong>`;
    }
  }
  
  requestAnimationFrame(animar);
}

function fecharCardFinal() { document.getElementById('cardFinal').style.display = 'none'; }

// Expõe a nova função de VS para o HTML
window.mostrarCaraACara = mostrarCaraACara;

// Inicia chamando o Load
window.onload = () => {
  carregarProgresso();
};