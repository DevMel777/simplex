import React, { useState } from 'react';
import { 
  inicializarTableauMGrande, 
  passo1_EncontrarColunaPivo, 
  passo2_CalcularRazoes, 
  passo3_EncontrarLinhaPivo, 
  passo4_Pivotar 
} from './simplexLogic';

export default function SimplexSimulator() {
  // Estados de Entrada
  const [numVariaveis, setNumVariaveis] = useState(2);
  const [numRestricoes, setNumRestricoes] = useState(2);
  const [funcaoObjetiva, setFuncaoObjetiva] = useState([c => '']);
  const [restricoes, setRestricoes] = useState([
  { coeficientes: [0, 0], sinal: '<=', b: 0 },
  { coeficientes: [0, 0], sinal: '<=', b: 0 }
]);
  
  // Estados da Execução
  const [tableau, setTableau] = useState(null);
  const [fase, setFase] = useState('ENTRADA'); // ENTRADA, PASSO_1, PASSO_2, PASSO_3, PASSO_4, OTIMO
  const [colunaPivo, setColunaPivo] = useState(-1);
  const [razoes, setRazoes] = useState([]);
  const [linhaPivo, setLinhaPivo] = useState(-1);
  const [labels, setLabels] = useState({ vars: [], restrictions: [] });

  // Inicializa os campos de input baseados no número de variáveis/restrições
  const configurarProblema = () => {
  setFuncaoObjetiva(Array(Number(numVariaveis)).fill(0));
  setRestricoes(Array(Number(numRestricoes)).fill(0).map(() => ({
    coeficientes: Array(Number(numVariaveis)).fill(0),
    sinal: '<=', // <-- Nova propriedade
    b: 0
  })));
  setTableau(null);
  setFase('ENTRADA');
};

  // Inicia o algoritmo gerando a primeira matriz (Tableau)
  const iniciarCalculo = () => {
    const { matriz, varLabels, restrictionLabels } = inicializarTableauMGrande(funcaoObjetiva, restricoes);
    setTableau(matriz);
    setLabels({ vars: varLabels, restrictions: restrictionLabels });
    setFase('PASSO_1');
    setColunaPivo(-1);
    setLinhaPivo(-1);
    setRazoes([]);
  };

  // Gerenciador do Clique de Próximo Passo
  const proximoPasso = () => {
    let t = [...tableau.map(row => [...row])];

    switch (fase) {
      case 'PASSO_1':
        // 1. Procura o elemento mais negativo na linha Z (Maximização)
        const col = passo1_EncontrarColunaPivo(t);
        if (col === -1) {
          setFase('OTIMO');
        } else {
          setColunaPivo(col);
          setFase('PASSO_2');
        }
        break;

      case 'PASSO_2':
        // 2 & 3. Mostra o cálculo do pivô (Razões b / coluna_pivo)
        const r = passo2_CalcularRazoes(t, colunaPivo);
        setRazoes(r);
        setFase('PASSO_3');
        break;

      case 'PASSO_3':
        // 4 & 5. Marca o pivô e a linha que sai (menor razão positiva)
        const lin = passo3_EncontrarLinhaPivo(razoes);
        if (lin === -1) {
          alert("Problema não tem solução limitada.");
          return;
        }
        setLinhaPivo(lin);
        setFase('PASSO_4');
        break;

      case 'PASSO_4':
        // 6. Nova matriz elementar (Pivotamento) com troca de variáveis na Base
        const { novaMatriz, novasRestricoesLabels } = passo4_Pivotar(
          t, 
          linhaPivo, 
          colunaPivo, 
          labels, 
          labels.vars
        );

        setTableau(novaMatriz);
        setLabels({
          ...labels,
          restrictions: novasRestricoesLabels // Atualiza os nomes na coluna Base
        });

        // Reseta destaques e volta pro Passo 1 para testar otimalidade
        setColunaPivo(-1);
        setLinhaPivo(-1);
        setRazoes([]);
        setFase('PASSO_1');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800 font-sans">
      <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-xl p-6">
        <h1 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">Simulador Simplex Passo a Passo</h1>

        {/* CONFIGURAÇÃO DO TAMANHO DA MATRIZ */}
        {fase === 'ENTRADA' && !tableau && (
          <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex gap-4 items-end justify-center">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Variáveis de Decisão:</label>
              <input type="number" min="1" value={numVariaveis} onChange={e => setNumVariaveis(e.target.value)} className="w-20 p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nº Restrições:</label>
              <input type="number" min="1" value={numRestricoes} onChange={e => setNumRestricoes(e.target.value)} className="w-20 p-2 border rounded" />
            </div>
            <button onClick={configurarProblema} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded transition">
              Gerar Campos
            </button>
          </div>
        )}

        {/* FORMULÁRIO DE ENTRADA DOS COEFICIENTES */}
        {fase === 'ENTRADA' && funcaoObjetiva.length > 0 && (
          <div className="space-y-6 border-t pt-4">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Função Objetiva (Maximizar Z):</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-lg">Z =</span>
                {funcaoObjetiva.map((_, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="number" placeholder="0" onChange={e => {
                      const v = [...funcaoObjetiva]; v[i] = Number(e.target.value); setFuncaoObjetiva(v);
                    }} className="w-16 p-1.5 border rounded text-center" />
                    <span className="font-medium">X{i+1} {i < funcaoObjetiva.length - 1 ? '+' : ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Restrições (Sujeito a):</h3>
              {restricoes.map((rest, i) => (
                <div key={i} className="flex items-center gap-2 mb-3 flex-wrap bg-gray-50 p-2 rounded">
                  <span className="text-sm font-bold text-gray-500">#{i+1}</span>
                  {rest.coeficientes.map((_, j) => (
                    <div key={j} className="flex items-center gap-1">
                      <input type="number" placeholder="0" onChange={e => {
                        const r = [...restricoes]; r[i].coeficientes[j] = Number(e.target.value); setRestricoes(r);
                      }} className="w-16 p-1.5 border rounded text-center" />
                      <span className="font-medium">X{j+1} {j < rest.coeficientes.length - 1 ? '+' : ''}</span>
                    </div>
                  ))}
                  <select 
                    value={rest.sinal} 
                    onChange={e => {
                      const r = [...restricoes]; r[i].sinal = e.target.value; setRestricoes(r);
                    }}
                    className="p-1.5 border rounded bg-white font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="<=">&le;</option>
                    <option value=">=">&ge;</option>
                  </select>
                  <input type="number" placeholder="0" onChange={e => {
                    const r = [...restricoes]; r[i].b = Number(e.target.value); setRestricoes(r);
                  }} className="w-20 p-1.5 border rounded text-center font-semibold" />
                </div>
              ))}
            </div>

            <button onClick={iniciarCalculo} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg text-lg shadow transition">
              Iniciar Simplex
            </button>
          </div>
        )}

        {/* VISUALIZAÇÃO DO TABLEAU E EXECUÇÃO PASSO A PASSO */}
        {tableau && (
          <div className="mt-6 border-t pt-6">
            {/* Status do Passo Atual */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
              <h4 className="font-bold text-yellow-800">Passo Atual:</h4>
              <p className="text-sm text-yellow-900 font-medium">
                {fase === 'PASSO_1' && "1. Analisando a linha de Z para encontrar a variável que entra na base (Coluna com o menor valor negativo)."}
                {fase === 'PASSO_2' && "2 e 3. Coluna pivô identificada! Calculando as razões (b / Coeficiente da Coluna) para definir quem sai."}
                {fase === 'PASSO_3' && "4 e 5. Linha e Elemento Pivô determinados (Menor razão positiva estrita)."}
                {fase === 'PASSO_4' && "6. Realizando operações de linha (pivotamento) para zerar o restante da coluna."}
                {fase === 'OTIMO' && "Solução Ótima Encontrada! Não há valores negativos na linha Z."}
              </p>
            </div>

            {/* Renderização da Tabela do Tableau */}
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border-collapse border border-gray-300 text-center">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 font-bold text-sm">Base</th>
                    {labels.vars.map((lbl, idx) => (
                      <th key={idx} className={`border border-gray-300 p-2 text-sm font-bold ${idx === colunaPivo ? 'bg-amber-200' : ''}`}>
                        {lbl}
                      </th>
                    ))}
                    <th className="border border-gray-300 p-2 font-bold text-sm">b</th>
                    {fase !== 'PASSO_1' && <th className="border border-gray-300 p-2 font-bold text-sm bg-purple-50 text-purple-700">Razão (b / Coef.)</th>}
                  </tr>
                </thead>
                <tbody>
                  {tableau.map((linha, iIdx) => (
                    <tr key={iIdx} className={`${iIdx === linhaPivo ? 'bg-emerald-100' : ''} hover:bg-gray-50 transition`}>
                      <td className="border border-gray-300 p-2 font-bold bg-gray-50 text-xs">
                        {iIdx === 0 ? 'Z' : labels.restrictions[iIdx - 1]}
                      </td>
                      {linha.map((val, jIdx) => {
                        const isPivo = iIdx === linhaPivo && jIdx === colunaPivo;
                        return (
                          <td key={jIdx} className={`border border-gray-300 p-3 text-sm font-mono 
                            ${jIdx === colunaPivo ? 'bg-amber-50' : ''} 
                            ${isPivo ? 'bg-red-500 text-white font-extrabold text-base rounded shadow-inner animate-pulse' : ''}
                          `}>
                            {Number(val).toFixed(2)}
                          </td>
                        );
                      })}
                      {/* Coluna de Razões */}
                      {fase !== 'PASSO_1' && (
                        <td className="border border-gray-300 p-2 bg-purple-50 text-xs font-mono text-purple-900">
                          {iIdx === 0 ? '-' : (razoes[iIdx - 1]?.val === Infinity ? '∞' : razoes[iIdx - 1]?.txt || '-')}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DA ANIMAÇÃO/PASSOS */}
            <div className="flex gap-4 justify-between items-center">
              <button onClick={() => { setTableau(null); setFase('ENTRADA'); }} className="text-gray-600 hover:text-gray-800 font-medium text-sm underline">
                Reiniciar Problema
              </button>

              {fase !== 'OTIMO' ? (
                <button onClick={proximoPasso} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition flex items-center gap-2">
                  Próximo Passo &rarr;
                </button>
              ) : (
                <div className="bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-lg shadow">
                  Resultado Ótimo: Z = {Number(tableau[0][tableau[0].length - 1]).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}