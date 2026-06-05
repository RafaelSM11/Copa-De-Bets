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

// Variáveis de Estado do Sorteio
let nomesSorteadosState = [];
let nomesReservaState = [];

// ============================
// Configurações padrão
// ============================
let nomeCopa = "Fell Cup Engiene 2026 by@Bobbyzera";
let porcCampeao = 55;
let porcVice = 15;
let porcMaiorForrada = 10;
let porcOrganizador = 20;

// Custo por jogador em cada provedor escolhido no confronto
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
}

// A banca soma APENAS O LÍQUIDO de cada jogador (Ganho - Custo do Bônus)
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

  // Lógica inteligente: Aceita número ímpar e aplica "BYE" automático
  for (let i = 0; i < listaEmbaralhada.length; i += 2) {
    const j1 = listaEmbaralhada[i];
    const j2 = listaEmbaralhada[i+1] || "BYE (Avança Direto)";
    confrontos[1].push([j1, j2]);
    provedoresConfrontos[`1_${confrontos[1].length - 1}`] = "PG";
  }

  faseAtual = 1;
  document.getElementById('setup').style.display = 'none';
  document.getElementById('blocoSorteio').style.display = 'none';
  document.getElementById('copa').style.display = 'block';

  renderizarConfrontos();
}

function getNomeFase(totalConfrontos) {
  if (totalConfrontos === 1) return "Grande Final";
  if (totalConfrontos === 2) return "Semifinal";
  if (totalConfrontos === 3 || totalConfrontos === 4) return "Quartas de Final";
  if (totalConfrontos > 4 && totalConfrontos <= 8) return "Oitavas de Final";
  return "Fase de Confrontos";
}

function renderizarConfrontos() {
  const lista = confrontos[faseAtual];
  document.getElementById('faseNome').textContent = getNomeFase(lista.length);

  const container = document.getElementById('confrontos');
  container.innerHTML = "";

  const btnAvancar = document.getElementById('btnAvancar');
  if(lista.length === 1) {
    btnAvancar.style.display = 'none';
  } else {
    btnAvancar.style.display = 'inline-block';
  }

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
  calcularValores(); 
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

  if (confrontos[faseAtual].length === 1) {
    setTimeout(() => {
      avancarFase();
    }, 500); 
  }
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
    const j1 = proximosVencedores[i];
    const j2 = proximosVencedores[i+1] || "BYE (Avança Direto)";
    confrontos[faseAtual].push([j1, j2]);
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

// ============================
// Geração do PDF
// ============================
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
// Nova Lógica do Sorteio
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

  if (nomes.length === 0) { alert("Digite ao menos 1 nome na caixa de sorteio."); return; }
  
  // A quantidade do sorteio agora é totalmente livre e NÃO sobrepõe a quantidade da Copa
  const qtd = parseInt(document.getElementById('qtdSortear').value) || 1;
  if (qtd > nomes.length) { alert("A quantidade a sortear não pode ser maior que o número de nomes disponíveis."); return; }

  const embaralhados = embaralhar(nomes.slice());
  
  nomesSorteadosState = embaralhados.slice(0, qtd);
  nomesReservaState = embaralhados.slice(qtd);
  
  renderizarListaSorteio();
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
  
  nomesSorteadosState.forEach((nome, i) => {
    const item = document.createElement('div');
    item.className = "item-sorteado";
    item.innerHTML = `
      <span class="nome-sorteado">${i + 1}. ${nome}</span>
      <div class="acoes-sorteio">
        <button class="btn-acao-sorteio btn-ok" onclick="confirmarSorteado('${nome}', this.parentElement.parentElement)" title="Aprovar e adicionar à copa">✅</button>
        <button class="btn-acao-sorteio btn-x" onclick="trocarSorteado(${i})" title="Remover e puxar o próximo da reserva">❌</button>
      </div>
    `;
    lista.appendChild(item);
  });
  
  div.appendChild(lista);
}

function confirmarSorteado(nome, rowElement) {
  const textarea = document.getElementById('textareaParticipantes');
  let atuais = textarea.value.split('\n').map(n => n.trim()).filter(n => n !== "");
  
  if (atuais.length >= qtdParticipantes) {
    alert(`A lista oficial já atingiu o limite de ${qtdParticipantes} participantes!`);
    return;
  }

  if (!atuais.includes(nome)) {
    atuais.push(nome);
    textarea.value = atuais.join('\n');
  }
  
  rowElement.classList.add('sorteado-confirmado');
  rowElement.innerHTML = `<span class="nome-sorteado" style="text-decoration: line-through;">${nome}</span> <span style="color:#00ff88; font-weight:bold; font-size:14px;">✅ Confirmado na Copa</span>`;
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

function abrirConfig() { 
  document.getElementById('inputNomeCopa').value = nomeCopa;
  document.getElementById('inputCampeao').value = porcCampeao;
  document.getElementById('inputVice').value = porcVice;
  document.getElementById('inputMaiorForrada').value = porcMaiorForrada;
  document.getElementById('inputOrganizador').value = porcOrganizador;
  document.getElementById('modalConfig').style.display = 'flex'; 
}

function fecharConfig() { 
  document.getElementById('modalConfig').style.display = 'none'; 
}

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

  alert("Configurações salvas com sucesso!"); 
  fecharConfig(); 
}

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