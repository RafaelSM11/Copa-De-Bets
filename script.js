// ============================
// Variáveis Globais
// ============================
let participantes = [];
let valorEntrada = 50.00; // Valor padrão de entrada na banca
let totalBanca = 0;
let faseAtual = 1; 
let confrontos = [];
let provedoresConfrontos = {}; // { 'fase_index': 'PG' }
let vencedoresConfrontos = {}; // { 'fase_index': 'Nome' }
let confrontosConfirmados = {}; // { 'fase_index': true/false }
let ganhosJogadores = {};       // { 'fase_index_Nome': 150.00 }
let maiorGanho = 0;
let jogadorMaiorForrada = "";
let qtdParticipantes = 16;

// ============================
// Configurações padrão
// ============================
let nomeCopa = "Copa de Cassino";
let porcCampeao = 55;
let porcVice = 15;
let porcMaiorForrada = 10;
let porcOrganizador = 20;

// Custo por jogador em cada provedor escolhido no confronto (Para o Balanço Líquido)
const CUSTO_PG_POR_JOGADOR = 30.00;
const CUSTO_PRAGMATIC_POR_JOGADOR = 40.00;

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
  atualizarValoresGerais();
}

function atualizarValoresGerais() {
  const inputEntrada = document.getElementById('valorEntrada');
  if (inputEntrada) {
    valorEntrada = parseFloat(inputEntrada.value) || 0;
  }
  calcularValores();
}

// A banca soma APENAS O LÍQUIDO de cada jogador (Ganho - Custo do Bônus)
function calcularValores() {
  const bancaInicial = qtdParticipantes * valorEntrada;
  let somaLiquido = 0;

  // Varre os ganhos que já foram digitados e calcula o impacto na banca
  for (let chave in ganhosJogadores) {
    // chave tem o formato "fase_index_NomeJogador"
    const partes = chave.split('_');
    const chaveConfronto = `${partes[0]}_${partes[1]}`;
    
    // Descobre o custo com base na provedora daquele confronto específico
    const provSelecionado = provedoresConfrontos[chaveConfronto] || "PG";
    const custoEntrada = provSelecionado === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;
    
    const ganho = ganhosJogadores[chave] || 0;
    const liquido = ganho - custoEntrada; // Se perdeu tudo, vai gerar número negativo
    
    somaLiquido += liquido;
  }

  // Se todos perderem muito, a banca cai, mas trava no 0 para não bugar
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
    campoMaiorForrada.textContent = `${jogadorMaiorForrada} (R$ ${maiorGanho.toFixed(2)}) + Bônus: R$ ${premioMaiorForrada.toFixed(2)}`;
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
    alert(`Por favor, digite exatamente ${qtdParticipantes} nomes.`);
    return;
  }

  const listaEmbaralhada = embaralhar(participantes.slice());
  confrontos = [];
  confrontos[1] = []; 

  for (let i = 0; i < listaEmbaralhada.length; i += 2) {
    confrontos[1].push([listaEmbaralhada[i], listaEmbaralhada[i+1]]);
    provedoresConfrontos[`1_${confrontos[1].length - 1}`] = "PG";
  }

  faseAtual = 1;
  document.getElementById('setup').style.display = 'none';
  document.getElementById('copa').style.display = 'block';

  renderizarConfrontos();
}

function getNomeFase(totalConfrontos) {
  if (totalConfrontos === 16) return "Dezesseis-avos de Final";
  if (totalConfrontos === 8) return "Oitavas de Final";
  if (totalConfrontos === 4) return "Quartas de Final";
  if (totalConfrontos === 2) return "Semifinal";
  if (totalConfrontos === 1) return "Grande Final";
  return "Fase de Confrontos";
}

function renderizarConfrontos() {
  const lista = confrontos[faseAtual];
  document.getElementById('faseNome').textContent = getNomeFase(lista.length);

  const container = document.getElementById('confrontos');
  container.innerHTML = "";

  lista.forEach((dupla, index) => {
    const chaveElemento = `${faseAtual}_${index}`;
    const provSelecionado = provedoresConfrontos[chaveElemento] || "PG";
    const vencedorAtual = vencedoresConfrontos[chaveElemento] || null;
    const isConfirmado = confrontosConfirmados[chaveElemento] || false;

    const ganhoJ1 = ganhosJogadores[`${chaveElemento}_${dupla[0]}`] || 0;
    const ganhoJ2 = ganhosJogadores[`${chaveElemento}_${dupla[1]}`] || 0;

    const custoEntrada = provSelecionado === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;
    
    const liquidoJ1 = ganhoJ1 - custoEntrada;
    const liquidoJ2 = ganhoJ2 - custoEntrada;

    const classLiquidoJ1 = liquidoJ1 >= 0 ? 'lucro' : 'prejuizo';
    const classLiquidoJ2 = liquidoJ2 >= 0 ? 'lucro' : 'prejuizo';

    const div = document.createElement('div');
    div.classList.add('confronto');
    if (isConfirmado) div.classList.add('confronto-confirmado');

    const selectDisabled = isConfirmado ? 'disabled' : '';
    const inputsDisabled = isConfirmado ? 'disabled' : '';

    div.innerHTML = `
      <h3>Confronto ${index + 1} ${isConfirmado ? '✅ (Confirmado)' : ''}</h3>
      <div style="margin-bottom: 15px;">
        <label style="display:inline; margin-right:10px;">Provedora das Slots:</label>
        <select onchange="alterarProvedorConfronto(${index}, this.value)" style="width:160px; display:inline-block;" ${selectDisabled}>
          <option value="PG" ${provSelecionado === "PG" ? "selected" : ""}>PG (R$ 30 cada)</option>
          <option value="Pragmatic" ${provSelecionado === "Pragmatic" ? "selected" : ""}>Pragmatic (R$ 40 cada)</option>
        </select>
      </div>
      
      <div class="dupla-confronto" style="display:flex; justify-content: space-around; align-items:stretch; gap:20px;">
        
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; background: rgba(50,50,50,0.2); padding: 10px; border-radius: 8px;">
          <button class="btn-jogador ${vencedorAtual === dupla[0] ? 'vencedor-ativo' : ''}" style="width:100%; max-width:100%; cursor:default;" disabled>
            ${dupla[0]}
          </button>
          <div style="margin-top:10px; width:100%;">
            <label style="font-size:12px; margin-top:0;">Valor Ganho (R$):</label>
            <input type="number" step="0.01" placeholder="0.00" value="${ganhoJ1 || ''}" oninput="salvarGanhoJogador(${index}, '${dupla[0]}', this.value)" style="padding:6px; font-size:14px; margin-top:2px;" ${inputsDisabled}>
            <div class="balanco-financeiro ${classLiquidoJ1}">
              Líquido: ${liquidoJ1 >= 0 ? '+' : ''}${liquidoJ1.toFixed(2)}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; font-weight:bold; color:#ffd700; font-size:20px;">VS</div>

        <div style="flex:1; display:flex; flex-direction:column; align-items:center; background: rgba(50,50,50,0.2); padding: 10px; border-radius: 8px;">
          <button class="btn-jogador ${vencedorAtual === dupla[1] ? 'vencedor-ativo' : ''}" style="width:100%; max-width:100%; cursor:default;" disabled>
            ${dupla[1]}
          </button>
          <div style="margin-top:10px; width:100%;">
            <label style="font-size:12px; margin-top:0;">Valor Ganho (R$):</label>
            <input type="number" step="0.01" placeholder="0.00" value="${ganhoJ2 || ''}" oninput="salvarGanhoJogador(${index}, '${dupla[1]}', this.value)" style="padding:6px; font-size:14px; margin-top:2px;" ${inputsDisabled}>
            <div class="balanco-financeiro ${classLiquidoJ2}">
              Líquido: ${liquidoJ2 >= 0 ? '+' : ''}${liquidoJ2.toFixed(2)}
            </div>
          </div>
        </div>

      </div>

      <div style="text-align:center; margin-top:15px; display:flex; justify-content:center; gap:10px;">
        ${!isConfirmado ? `
          <button class="btn-confirmar-confronto" onclick="confirmarConfrontoAutomatico(${index})">
            🔒 Confirmar Confronto
          </button>
        ` : `
          <button class="btn-editar-confronto" onclick="editarConfronto(${index})">
            ✏️ Editar Confronto
          </button>
        `}
      </div>
    `;
    container.appendChild(div);
  });

  document.getElementById('btnVoltar').style.display = faseAtual === 1 ? 'none' : 'inline-block';
  calcularValores();
}

function alterarProvedorConfronto(index, provedor) {
  provedoresConfrontos[`${faseAtual}_${index}`] = provedor;
  calcularValores(); // Atualiza a banca na mesma hora
  renderizarValoresLiquidosIndividuais(index);
}

function salvarGanhoJogador(confrontoIndex, jogadorNome, valor) {
  const chave = `${faseAtual}_${confrontoIndex}_${jogadorNome}`;
  ganhosJogadores[chave] = parseFloat(valor) || 0;
  calcularValores();
  renderizarValoresLiquidosIndividuais(confrontoIndex);
}

function renderizarValoresLiquidosIndividuais(index) {
  const chaveElemento = `${faseAtual}_${index}`;
  const provSelecionado = provedoresConfrontos[chaveElemento] || "PG";
  const custoEntrada = provSelecionado === "PG" ? CUSTO_PG_POR_JOGADOR : CUSTO_PRAGMATIC_POR_JOGADOR;
  const dupla = confrontos[faseAtual][index];

  dupla.forEach((jogador, jIdx) => {
    const ganho = ganhosJogadores[`${chaveElemento}_${jogador}`] || 0;
    const liquido = ganho - custoEntrada;
    const containerConfrontos = document.getElementById('confrontos').children[index];
    if(containerConfrontos) {
      const divBalanco = containerConfrontos.querySelectorAll('.balanco-financeiro')[jIdx];
      if(divBalanco) {
        divBalanco.className = `balanco-financeiro ${liquido >= 0 ? 'lucro' : 'prejuizo'}`;
        divBalanco.textContent = `Líquido: ${liquido >= 0 ? '+' : ''}${liquido.toFixed(2)}`;
      }
    }
  });
}

function confirmarConfrontoAutomatico(index) {
  const chaveElemento = `${faseAtual}_${index}`;
  const dupla = confrontos[faseAtual][index];

  const ganhoJ1 = ganhosJogadores[`${chaveElemento}_${dupla[0]}`] || 0;
  const ganhoJ2 = ganhosJogadores[`${chaveElemento}_${dupla[1]}`] || 0;

  if (ganhoJ1 === 0 && ganhoJ2 === 0) {
    if (!confirm("Os dois jogadores estão com valor 0. Deseja confirmar assim mesmo?")) {
      return;
    }
  }

  if (ganhoJ1 > ganhoJ2) {
    vencedoresConfrontos[chaveElemento] = dupla[0];
  } else if (ganhoJ2 > ganhoJ1) {
    vencedoresConfrontos[chaveElemento] = dupla[1];
  } else {
    const desempate = prompt(`Empate detectado (${ganhoJ1} x ${ganhoJ2}). Quem vence no critério de desempate?\n1 - ${dupla[0]}\n2 - ${dupla[1]}`);
    if (desempate === "1") {
      vencedoresConfrontos[chaveElemento] = dupla[0];
    } else if (desempate === "2") {
      vencedoresConfrontos[chaveElemento] = dupla[1];
    } else {
      alert("Confirmação cancelada. Escolha um vencedor válido para desempatar.");
      return;
    }
  }

  confrontosConfirmados[chaveElemento] = true;
  renderizarConfrontos();
}

function editarConfronto(index) {
  const chaveElemento = `${faseAtual}_${index}`;
  confrontosConfirmados[chaveElemento] = false;
  vencedoresConfrontos[chaveElemento] = null;
  renderizarConfrontos();
}

function avancarFase() {
  const listaAtuais = confrontos[faseAtual];
  const proximosVencedores = [];

  for (let i = 0; i < listaAtuais.length; i++) {
    const chave = `${faseAtual}_${i}`;
    if (!confrontosConfirmados[chave]) {
      alert(`Por favor, clique em "Confirmar Confronto" no Confronto ${i + 1} antes de avançar.`);
      return;
    }
    proximosVencedores.push(vencedoresConfrontos[chave]);
  }

  if (listaAtuais.length === 1) {
    finalizarCampeonato(proximosVencedores[0], listaAtuais[0]);
    return;
  }

  faseAtual++;
  confrontos[faseAtual] = [];
  for (let i = 0; i < proximosVencedores.length; i += 2) {
    confrontos[faseAtual].push([proximosVencedores[i], proximosVencedores[i+1]]);
  }

  renderizarConfrontos();
}

function voltarFase() {
  if (faseAtual > 1) {
    faseAtual--;
    renderizarConfrontos();
  }
}

function finalizarCampeonato(campeao, duplaFinal) {
  const vice = duplaFinal[0] === campeao ? duplaFinal[1] : duplaFinal[0];
  
  document.getElementById('vencedorFinal').textContent = campeao;
  document.getElementById('vencedorVice').textContent = vice;
  
  const premioMaiorForrada = totalBanca * (porcMaiorForrada / 100);
  const premioOrganizador = totalBanca * (porcOrganizador / 100);
  
  if (maiorGanho > 0 && jogadorMaiorForrada) {
    document.getElementById('vencedorMaiorForrada').textContent = `${jogadorMaiorForrada} (R$ ${maiorGanho.toFixed(2)}) + Bônus: R$ ${premioMaiorForrada.toFixed(2)}`;
  } else {
    document.getElementById('vencedorMaiorForrada').textContent = "-";
  }

  document.getElementById('vencedorOrganizador').textContent = `R$ ${premioOrganizador.toFixed(2)}`;
  document.getElementById('cardFinal').style.display = 'flex';
}

// ============================
// Sorteio Animado
// ============================
function toggleBlocoSorteio() {
  const bloco = document.getElementById('blocoSorteio');
  bloco.style.display = bloco.style.display === 'none' || bloco.style.display === '' ? 'block' : 'none';
}

function sortearParticipantes() {
  const nomes = document.getElementById('textareaSortear').value
    .split('\n')
    .map(n => n.trim())
    .filter(n => n !== "");

  if (nomes.length === 0) { alert("Digite ao menos 1 nome"); return; }
  const qtd = parseInt(document.getElementById('qtdSortear').value);
  if (qtd > nomes.length) { alert("Quantidade a sortear maior que nomes disponíveis"); return; }

  const boxQtdGeral = document.getElementById('qtdParticipantes');
  boxQtdGeral.value = qtd;
  atualizarQuantidadeParticipantes();

  const embaralhados = embaralhar(nomes.slice());
  const sorteados = embaralhados.slice(0, qtd);
  
  const textareaGeral = document.getElementById('textareaParticipantes');
  textareaGeral.value = sorteados.join('\n');
  
  mostrarSorteados(sorteados);
}

function mostrarSorteados(sorteados) {
  const div = document.getElementById('resultadoSorteio');
  div.innerHTML = "";
  sorteados.forEach((nome, i) => {
    const bolinha = document.createElement('div');
    bolinha.classList.add('bolinha');
    bolinha.textContent = nome.substring(0, 5);
    bolinha.style.setProperty('--desloc', `${Math.random()*100 - 50}px`);
    div.appendChild(bolinha);
    setTimeout(() => { bolinha.style.animation = `cair 1s forwards`; }, i * 200);
  });
}

function abrirConfig() { document.getElementById('modalConfig').style.display = 'flex'; }
function fecharConfig() { document.getElementById('modalConfig').style.display = 'none'; }
function salvarConfig() { alert("Configurações salvas!"); fecharConfig(); }
function abrirUltimasCopas() { document.getElementById('modalUltimasCopas').style.display = 'flex'; }
function fecharUltimasCopas() { document.getElementById('modalUltimasCopas').style.display = 'none'; }
function abrirRanking() { document.getElementById('modalRanking').style.display = 'flex'; }
function fecharRanking() { document.getElementById('modalRanking').style.display = 'none'; }
function fecharCardFinal() { document.getElementById('cardFinal').style.display = 'none'; }
function reiniciarCopa() { location.reload(); }

window.onload = () => {
  atualizarValoresGerais();
  atualizarQuantidadeParticipantes();
};