/**
 * Inicializa a estrutura da matriz (Tableau) com variáveis de folga.
 */
const M = 1000; // Penalidade do método do M-Grande

export function inicializarTableauMGrande(funcaoObjetiva, restricoes) {
  const numVars = funcaoObjetiva.length;
  
  // Identifica quantas folgas e artificiais serão necessárias
  let qtdFolgas = restricoes.length; 
  let qtdArtificiais = restricoes.filter(r => r.sinal === '>=').length;
  const totalColunasLivres = numVars + qtdFolgas + qtdArtificiais;

  // Gerar Rótulos das Colunas
  let varLabels = [];
  for(let i = 1; i <= numVars; i++) varLabels.push(`X${i}`);
  for(let i = 1; i <= qtdFolgas; i++) varLabels.push(`f${i}`);
  for(let i = 1; i <= qtdArtificiais; i++) varLabels.push(`A${i}`);

  let restrictionLabels = [];
  let matriz = [];

  // 1. Montagem da Linha Z Base
  let linhaZ = Array(totalColunasLivres + 1).fill(0);
  for(let j = 0; j < numVars; j++) {
    linhaZ[j] = -funcaoObjetiva[j];
  }

  // 2. Montagem das restrições e mapeamento das folgas/artificiais
  let indexFolga = 0;
  let indexArtificial = 0;

  restricoes.forEach((rest, idx) => {
    let linha = Array(totalColunasLivres + 1).fill(0);
    for(let j = 0; j < numVars; j++) linha[j] = rest.coeficientes[j];
    linha[totalColunasLivres] = rest.b;

    if (rest.sinal === '<=') {
      linha[numVars + indexFolga] = 1;
      restrictionLabels.push(`f${indexFolga + 1}`);
      indexFolga++;
    } else {
      linha[numVars + indexFolga] = -1; // excesso
      linha[numVars + qtdFolgas + indexArtificial] = 1; // artificial
      restrictionLabels.push(`A${indexArtificial + 1}`);
      
      linhaZ[numVars + qtdFolgas + indexArtificial] = M; // Penalidade M
      indexFolga++;
      indexArtificial++;
    }
    matriz.push(linha);
  });

  // Ajuste matemático obrigatório para zerar os coeficientes de 'A' na linha Z
  restricoes.forEach((rest, idx) => {
    if (rest.sinal === '>=') {
      for (let j = 0; j <= totalColunasLivres; j++) {
        linhaZ[j] -= M * matriz[idx][j];
      }
    }
  });

  matriz.unshift(linhaZ);
  return { matriz, varLabels, restrictionLabels };
}

/**
 * PASSO 1: Busca o menor valor negativo na linha Z (Índice da coluna pivô)
 */
export function passo1_EncontrarColunaPivo(matriz) {
  const linhaZ = matriz[0].slice(0, -1); // Ignora a coluna 'b'
  let minVal = 0;
  let colIdx = -1;

  for(let j = 0; j < linhaZ.length; j++) {
    if(linhaZ[j] < minVal) {
      minVal = linhaZ[j];
      colIdx = j;
    }
  }
  return colIdx; // Se retornar -1, a solução já é a ótima
}

/**
 * PASSO 2: Calcula as razões b / elemento_coluna
 */
export function passo2_CalcularRazoes(matriz, colunaPivo) {
  let razoes = [];
  // Começa de 1 para pular a linha Z
  for(let i = 1; i < matriz.length; i++) {
    const b = matriz[i][matriz[i].length - 1];
    const coef = matriz[i][colunaPivo];

    if(coef > 0) {
      razoes.push({ val: b / coef, txt: `${b.toFixed(1)} / ${coef.toFixed(1)} = ${(b/coef).toFixed(2)}`, linhaOriginal: i });
    } else {
      razoes.push({ val: Infinity, txt: 'Inviável (≤ 0)', linhaOriginal: i });
    }
  }
  return razoes;
}

/**
 * PASSO 3: Encontra a linha que sai (menor razão estritamente positiva)
 */
export function passo3_EncontrarLinhaPivo(razoes) {
  let minRazao = Infinity;
  let linhaPivoIdx = -1;

  razoes.forEach((r) => {
    if(r.val < minRazao && r.val !== Infinity) {
      minRazao = r.val;
      linhaPivoIdx = r.linhaOriginal;
    }
  });

  return linhaPivoIdx;
}


/**
 * PASSO 4: Executa o pivotamento e atualiza os rótulos da base
 */
export function passo4_Pivotar(matriz, linhaPivo, colunaPivo, labelsAtuais, varLabels) {
  const numColunas = matriz[0].length;
  const pivoValor = matriz[linhaPivo][colunaPivo];

  // 1. Normaliza a linha do pivô (faz o elemento pivô virar 1)
  for (let j = 0; j < numColunas; j++) {
    matriz[linhaPivo][j] /= pivoValor;
  }

  // 2. Zera os outros elementos daquela mesma coluna nas outras linhas
  for (let i = 0; i < matriz.length; i++) {
    if (i !== linhaPivo) {
      const fator = matriz[i][colunaPivo];
      for (let j = 0; j < numColunas; j++) {
        matriz[i][j] -= fator * matriz[linhaPivo][j];
      }
    }
  }

  // 3. TROCA DINÂMICA DE LABELS: A variável da coluna entra na Base
  // O índice da linha na base é (linhaPivo - 1) porque a linha 0 é o Z
  let novasRestricoesLabels = [...labelsAtuais.restrictions];
  novasRestricoesLabels[linhaPivo - 1] = varLabels[colunaPivo];

  return { 
    novaMatriz: matriz, 
    novasRestricoesLabels 
  };
}