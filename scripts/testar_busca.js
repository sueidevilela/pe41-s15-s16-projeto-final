/*
 * CUIDAR — teste da busca (app/rag.js) com perguntas do jeito que pacientes e cuidadoras falam.
 *
 * Uso:  node scripts/testar_busca.js
 *
 * Cada caso diz qual verbete deve vir em 1º lugar. "nenhum" = a biblioteca ainda não tem esse
 * tema (ver docs/lacunas.md) e a busca não deve trazer verbete errado.
 * Sai com código 1 se algum caso falhar.
 */
const path = require('path');
const { buscar } = require(path.join(__dirname, '..', 'app', 'rag.js'));
const base = require(path.join(__dirname, '..', 'dados', 'biblioteca.json'));

const CASOS = [
  ['o que é cuidado paliativo', 'cp-001'],
  ['o sofrimento não é só dor', 'cp-002'],
  ['o que é luto antecipatório', 'cp-003'],
  ['qual o objetivo do tratamento agora', 'cp-004'],
  ['minha família não aceita que não tem cura', 'cp-005'],
  ['saúde quando não tem cura', 'cp-006'],
  ['estou cansada de cuidar da minha mãe', 'cp-007'],
  ['estou exausta, posso descansar?', 'cp-007'],
  ['ele quer voltar para casa', 'cp-008'],
  ['como a família pode ajudar', 'cp-009'],
  ['paliativo é desistir?', 'cp-010'],
  ['fico triste de aceitar o paliativo', 'cp-011'],
  ['não sei o que fazer para ajudar meu pai', 'cp-012'],
  ['por que ele melhorou quando voltou para casa', 'cp-013'],
  ['precisa de cama hospitalar?', 'cp-014'],
  ['ele tem vergonha na hora do banho', 'cp-015'],
  ['o aparelho fica apitando a noite toda no hospital', 'cp-016'],
  ['minha mãe não fala mais, como sei se ela tem dor', 'cp-017'],
  ['sinto culpa porque ele morreu no hospital e não em casa', 'cp-018'],
  ['meu pai não quer falar sobre a doença', 'cp-019'],
  ['a família tem um costume religioso para a hora da morte', 'cp-020'],
  ['como aproveitar o tempo que resta', 'cp-021'],
  ['o que levar na consulta, a receita ou os remédios?', 'cp-022'],
  ['sinto que virei mãe da minha mãe', 'cp-023'],
  ['ele se sente inútil desde que parou de trabalhar', 'cp-024'],
  ['minha mãe diz que não quer dar trabalho', 'cp-025'],
  ['ele está com muita dor, por onde começar?', 'cp-026'],
  ['como funciona a fila do transplante', 'tx-001'],
  ['o que é meld', 'tx-002'],
  ['quando a pessoa precisa de transplante de fígado', 'tx-003'],
  ['o que é o número rict', 'tx-004'],
  ['fiquei inativo na lista, o que significa', 'tx-005'],
  ['o que é situação especial', 'tx-006'],
  ['quanto tempo vou esperar pelo fígado', 'tx-007'],
  ['quais são os tipos de transplante de fígado', 'tx-008'],
  ['o fígado cresce de novo no doador?', 'tx-030'],
  ['meu marido pode doar parte do fígado?', 'tx-030'],
  ['posso doar parte do fígado para minha mãe?', 'tx-009'],
  ['o que fazer enquanto espero o transplante', 'tx-010'],
  ['quando ir ao pronto-socorro antes do transplante', 'tx-011'],
  ['fui chamado mas cancelaram a cirurgia', 'tx-012'],
  ['quais os riscos do transplante', 'tx-013'],
  ['quanto tempo na uti depois do transplante', 'tx-014'],
  ['para que serve o tacrolimo', 'tx-015'],
  ['como saber se o corpo rejeitou o fígado', 'tx-016'],
  ['estou com febre depois do transplante', 'tx-017'],
  ['posso ter cachorro depois do transplante', 'tx-018'],
  ['o que posso comer depois do transplante', 'tx-019'],
  ['posso beber cerveja depois do transplante', 'tx-020'],
  ['posso tomar vacina da febre amarela', 'tx-021'],
  ['estou com medo do transplante', 'tx-022'],
  ['para que serve o fígado', 'tx-023'],
  ['meu olho ficou amarelo', 'tx-024'],
  ['o que é tgo alto no exame', 'tx-025'],
  ['gama gt alta', 'tx-026'],
  ['apareceu um nódulo no fígado no ultrassom', 'tx-027'],
  ['tenho gordura no fígado', 'tx-028'],
  ['o que é fibrose hepática', 'tx-029'],
  ['o que é cirrose', 'tx-031'],
  ['o que causa a cirrose', 'tx-032'],
  ['quais os sintomas da cirrose', 'tx-033'],
  ['o que é ascite', 'tx-034'],
  ['tenho varizes de esôfago', 'tx-034'],
  ['o que é encefalopatia hepática', 'tx-035'],
  ['cirrose tem cura?', 'tx-036'],
  ['quanto tempo dura a cirurgia do transplante', 'tx-037'],
  ['quanto tempo fica internado depois do transplante', 'tx-038'],
  ['quais as vantagens do transplante intervivos', 'tx-039'],
  ['quais os riscos para o doador', 'tx-040'],
  ['o que é hepatite fulminante', 'tx-041'],
  ['tenho hepatite autoimune', 'tx-042'],
  ['como pega hepatite b', 'tx-043'],
  ['hepatite c tem cura?', 'tx-044'],
  ['o que é colangite esclerosante', 'tx-045'],
  ['o câncer espalhou para o fígado', 'tx-046'],
  ['o laudo diz hemangioma', 'tx-047'],
  ['o que é adenoma hepático', 'tx-048'],
  ['o que é doença do caramujo', 'tx-049'],
  ['doença de wilson', 'tx-050'],
  ['quais doenças levam ao transplante', 'tx-051'],
  ['minha doença pode ter transplante de fígado?', 'tx-051'],
  ['o meu médico falou que estou na fila e a ordem é um cálculo chamado meld, o que é?', 'tx-002'],
  // lacunas e erros de digitação: não pode trazer verbete errado
  ['pra que serve o tracolino?', 'nenhum'],
  ['pra que serve o remédio que o meu médico passou?', 'nenhum'],
  ['se tomar morfina agora depois não faz efeito?', 'nenhum'],
];

let ok = 0;
for (const [pergunta, esperado] of CASOS) {
  const achados = buscar(pergunta, base.verbetes);
  const primeiro = achados.length ? achados[0].verbete.id : 'nenhum';
  const passou = primeiro === esperado;
  if (passou) ok++;
  const lista = achados.map(a => `${a.verbete.id} (${a.score})`).join(', ') || 'nenhum';
  console.log(`${passou ? 'OK  ' : 'FALHOU'}  ${pergunta}  ->  ${lista}${passou ? '' : `   [esperado ${esperado}]`}`);
}
console.log(`\n${ok} de ${CASOS.length} perguntas acharam o verbete certo.`);
process.exit(ok === CASOS.length ? 0 : 1);
