/**
 * Inicializa a estrutura da matriz (Tableau) com variáveis de folga.
 */
export function inicializarTableau(funcaoObjetiva, restricoes) {
  const numVars = funcaoObjetiva.length;
  const numRestricoes = restricoes.length;
  
  // Rótulos (Labels) para a tabela
  let varLabels = [];
  for(let i = 1; i <= numVars; i++) varLabels.push(`X${i}`);
  for(let i = 1; i <= numRestricoes; i++) varLabels.push(`f${i}`);

  let restrictionLabels = [];
  for(let i = 1; i <= numRestricoes; i++) restrictionLabels.push(`f${i}`);

  // Montagem das Linhas
  let matriz = [];

  // Linha Z: [ -C1, -C2, ... , 0 (folgas), 0 (b) ]
  let linhaZ = funcaoObjetiva.map(val => -val);
  let folgasZ = Array(numRestricoes).fill(0);
  matriz.push([...linhaZ, ...folgasZ, 0]);

  // Linhas das Restrições
  restricoes.forEach((rest, idx) => {
    let linha = [...rest.coeficientes];
    let folgas = Array(numRestricoes).fill(0);
    folgas[idx] = 1; // Insere a variável de folga na diagonal
    matriz.push([...linha, ...folgas, rest.b]);
  });

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