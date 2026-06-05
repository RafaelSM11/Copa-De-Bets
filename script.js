// ============================
// Variáveis Globais
// ============================
let participantes = [];
let valorEntrada = 50.00;
let totalBanca = 0;
let faseAtual = 1; 
let confrontos = []; // Array 2D: confrontos[fase][index_match] = [Jog1, Jog2]
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

// ============================
// Configurações padrão
// ============================
let nomeCopa = "Fell Cup Engiene 2026 by@Bobbyzera";
let porcCampeao = 55;
let porcVice = 15;
let porcMaiorForrada = 10;
let porcOrganizador = 20;

const CUSTO_PG_POR_JOGADOR = 30.00;
const CUSTO_PRAGMATIC_POR_JOGADOR = 40.00;

// ============================
// Funções de Salvamento de Progresso (Local Storage)
// ============================
function salvarProgresso() {
  const estado = {
    participantes, valorEntrada, faseAtual, confrontos, provedoresConfrontos,
    vencedoresConfrontos, confrontosConfirmados, ganhosJogadores, qtdParticipantes, totalFases,
    textareaText: document.getElementById('textareaParticipantes').value,
    config: { nomeCopa, porcCampeao, porcVice, porcMaiorForrada, porcOrganizador },
    corFundo: document.getElementById('inputCorFundo').value,
    copaIniciada: document.getElementById('copa').style.display === 'block'
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

    if (estado.config) {
      nomeCopa = estado.config.nomeCopa || nomeCopa;
      porcCampeao = estado.config.porcCampeao || 55;
      porcVice = estado.config.porcVice || 15;
      porcMaiorForrada = estado.config.porcMaiorForrada || 10;
      porcOrganizador = estado.config.porcOrganizador || 20;

      document.getElementById('tituloCopa').textContent = nomeCopa;
      document.title = nomeCopa;
      document.getElementById('inputCorFundo').value = estado.corFundo || "#000000";
      document.body.style.background = `radial-gradient(circle at top, ${estado.corFundo || "#000000"}, #000000)`;
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

function reiniciarCopaConfirmar() {
  if(confirm("Tem certeza que deseja apagar a copa atual e criar uma do zero? Todo o progresso não salvo será perdido!")) {
    localStorage.removeItem('FellCup_EstadoSalvo');
    location.reload();
  }
}

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
  const input = document.getElementById('qtdParticipantes');
  qtdParticipantes = parseInt(input.value) || 16;
  const textarea = document.getElementById('textareaParticipantes');
  textarea.rows = qtdParticipantes;
  document.getElementById('infoQtd').textContent = `Os ${qtdParticipantes} nomes confirmados aparecerão aqui.`;
  atualizarValoresGerais();
}

function atualizarValoresGerais() {
  const inputEntrada = document.getElementById('valorEntrada');
  if (inputEntrada) {
    valorEntrada = parseFloat(inputEntrada.value) || 0;
  }
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
    const liquido = ganho - custoEntrada; 
    
    somaLiquido += liquido;
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
    campoMaiorForrada.textContent = `${jogadorMaiorForrada} (R$ ${maiorGanho.toFixed(2)}) Prêmio: R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    campoMaiorForrada.textContent = "-";
  }
}

// ============================
// Fluxo do Torneio (Mata-Mata)
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
        let p1Name = dupla[0];
        let p2Name = dupla[1];

        if (vencedor === dupla[0]) {
            p1Class += " winner-highlight";
            p2Class += " loser-fade";
            p1Name = `👑 ${dupla[0]}`;
        } else if (vencedor === dupla[1]) {
            p2Class += " winner-highlight";
            p1Class += " loser-fade";
            p2Name = `👑 ${dupla[1]}`;
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
        let p1Name = dupla[0];
        let p2Name = dupla[1];
        let p1NameClass = "player-name";
        let p2NameClass = "player-name";

        if (isConfirmado) {
            if (vencedorAtual === dupla[0]) {
                p1BoxClass += " winner-highlight";
                p2BoxClass += " loser-fade";
                p1Name = `👑 ${dupla[0]}`;
                p1NameClass += " crown";
            } else if (vencedorAtual === dupla[1]) {
                p2BoxClass += " winner-highlight";
                p1BoxClass += " loser-fade";
                p2Name = `👑 ${dupla[1]}`;
                p2NameClass += " crown";
            }
        }
        
        matchDiv.innerHTML = `
          <div class="bracket-header">
            <select onchange="alterarProvedor(${f}, ${m}, this.value)" ${isConfirmado ? 'disabled' : ''}>
              <option value="PG" ${provSelecionado === "PG" ? "selected" : ""}>PG (R$ 30)</option>
              <option value="Pragmatic" ${provSelecionado === "Pragmatic" ? "selected" : ""}>Pragmatic (R$ 40)</option>
            </select>
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
    const campeao = document.getElementById('vencedorFinal').textContent;
    matchDiv.innerHTML = `<h3>🏆 Campeão</h3><div class="player-locked crown" style="font-size:22px; padding:20px; border:none;">👑 ${campeao}</div>`;
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
    finalizarCampeonato(proximosVencedores[0], listaAtuais[0]);
    renderizarConfrontosBracket();
    salvarProgresso();
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
  document.getElementById('vencedorVice').textContent = `${vice} (R$ ${premioVice.toFixed(2)})`;
  
  if (maiorGanho > 0 && jogadorMaiorForrada) {
    document.getElementById('vencedorMaiorForrada').textContent = `${jogadorMaiorForrada} (R$ ${maiorGanho.toFixed(2)}) Prêmio: R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    document.getElementById('vencedorMaiorForrada').textContent = "-";
  }

  document.getElementById('vencedorOrganizador').textContent = `R$ ${premioOrganizador.toFixed(2)}`;
  document.getElementById('cardFinal').style.display = 'flex';
}

function gerarPDF() {
  document.getElementById('pdfTitulo').textContent = nomeCopa;
  
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR');
  document.getElementById('pdfData').textContent = `Gerado em: ${dataFormatada}`;
  
  document.getElementById('pdfCampeao').textContent = document.getElementById('vencedorFinal').textContent;
  document.getElementById('pdfVice').textContent = document.getElementById('vencedorVice').textContent.split(' (')[0]; 
  document.getElementById('pdfMaiorForrada').textContent = document.getElementById('vencedorMaiorForrada').textContent;
  
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
// Lógica do Sorteio (Efeito Cartas Virando - Card Flip)
// ============================
function toggleBlocoSorteio() {
  const bloco = document.getElementById('blocoSorteio');
  bloco.style.display = bloco.style.display === 'none' || bloco.style.display === '' ? 'block' : 'none';
}

function sortearParticipantes() {
  if (isSorteando) return; // Bloqueia clicks duplos

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
  
  // Prepara as cartas na mesa
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

  // Dá um tempinho pra galera ver as cartas na mesa e começa o show
  setTimeout(() => {
    animarCartasSorteio(sorteadosFinais, 0);
  }, 800);
}

function animarCartasSorteio(sorteadosFinais, indexAtual) {
  if (indexAtual >= sorteadosFinais.length) {
     isSorteando = false;
     document.getElementById('btnSorteio').disabled = false;
     return;
  }

  const card = document.getElementById(`carta-${indexAtual}`);
  const alvoNome = sorteadosFinais[indexAtual];
  
  // Dá o comando CSS para virar a carta 3D
  card.classList.add('flipped');

  // Espera a carta terminar de virar (0.6s) pra jogar o nome na lista
  setTimeout(() => {
      nomesSorteadosState.push(alvoNome);
      renderizarListaSorteio();
      
      // Espera mais um pouquinho de suspense e vira a próxima carta
      setTimeout(() => {
        animarCartasSorteio(sorteadosFinais, indexAtual + 1);
      }, 700); 
  }, 600); 
}

function renderizarListaSorteio() {
  const div = document.getElementById('resultadoSorteio');
  div.innerHTML = "";
  
  if (nomesSorteadosState.length === 0) return;

  const tituloLista = document.createElement('h3');
  tituloLista.textContent = "Participantes Sorteados:";
  tituloLista.style.color = "#ffd700";
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
      item.innerHTML = `<span class="nome-sorteado" style="text-decoration: line-through;">${i + 1}. ${nome}</span> <span style="color:#00ff88; font-weight:bold; font-size:14px;">✅ Confirmado na Copa</span>`;
    } else {
      item.innerHTML = `
        <span class="nome-sorteado">${i + 1}. ${nome}</span>
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

// Configurações
function abrirConfig() { 
  document.getElementById('inputNomeCopa').value = nomeCopa;
  document.getElementById('inputCampeao').value = porcCampeao;
  document.getElementById('inputVice').value = porcVice;
  document.getElementById('inputMaiorForrada').value = porcMaiorForrada;
  document.getElementById('inputOrganizador').value = porcOrganizador;
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
  
  const corFundo = document.getElementById('inputCorFundo').value;
  document.body.style.background = `radial-gradient(circle at top, ${corFundo}, #000000)`;

  calcularValores();
  salvarProgresso();
  
  alert("Configurações salvas com sucesso!"); 
  fecharConfig(); 
}

function abrirUltimasCopas() { document.getElementById('modalUltimasCopas').style.display = 'flex'; }
function fecharUltimasCopas() { document.getElementById('modalUltimasCopas').style.display = 'none'; }
function abrirRanking() { document.getElementById('modalRanking').style.display = 'flex'; }
function fecharRanking() { document.getElementById('modalRanking').style.display = 'none'; }
function fecharCardFinal() { document.getElementById('cardFinal').style.display = 'none'; }

// Inicia chamando o Load
window.onload = () => {
  carregarProgresso();
};