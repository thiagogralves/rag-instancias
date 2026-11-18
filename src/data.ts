import type { Drop, Instance, SectionId } from "./types"

function drop(id: string, name: string, detail: string, crafts: string[] = [], itemId?: number): Drop {
  return { id, name, detail, crafts, itemId }
}

const ira = drop("ira-deus-mar",
  "Ira do Deus do Mar",
  "Bigodes paga 1 no Normal e 5 no Difícil. Pelo mapa ainda caem bolsas de moedas e peixes enlatados.",
  ["Encantamentos de Malangdo: dá para escolher a linha física, de longa distância ou mágica."], 6423)
const moedaA = drop("moeda-classe-a",
  "Moeda Classe A",
  "Premiação do serviço no modo difícil.",
  ["Também escolhe a linha do encanto em Malangdo. Moedas mais fracas sorteiam o encanto."], 6418)
const moedaB = drop("moedas-classe-b",
  "Moedas Classe B",
  "Premiação do serviço no modo normal.",
  ["Encanto aleatório nas armas aceitas em Malangdo."], 6419)
const caixa = drop(
  "caixa-melhores-armas",
  "Caixa das Melhores Armas",
  "Premiação da caçada. O arpão é o item para conduzir a instância, não o drop.",
)
const poEspacial = drop("po-espacial",
  "Pó Espacial",
  "Item negociado na entrada do farol.",
  ["Armas, armaduras ou encantos com o Pharos, na entrada do farol."], 6905)
const chifres = drop(
  "chifres-majestosos",
  "Chifres Majestosos",
  "Premiação do Altar do Selo. A tabela antiga chama de Chifres Místicos de Bafomé.",
)
const chifresG = drop(
  "chifres-gigantes",
  "Chifres Majestosos Gigantes",
  "Versão maior dos chifres do Altar do Selo.",
)
const boneco = drop("boneco-bafome", "Boneco de Bafomé Maldito", "Drop do Altar do Selo.")
const cristalEsc = drop("cristal-escuridao", "Cristal da Escuridão", "Drop do Altar do Selo.")
const fragEsc = drop("fragmento-escuridao", "Fragmento da Escuridão", "Drop do Altar do Selo.")
const carta = drop("carta-dourada",
  "Carta Dourada",
  "Premiação da caçada aos Roborings, no fim da instância.",
  ["50 cartas viram 1 Tanque Velho com o Dr. Magnatum, em Verus (verus04 79, 114)."], 25627)
const charleston = drop("componente-charleston",
  "Componente de Charleston",
  "Material que também sai em Verus, ligado à mesma região.",
  ["15 componentes viram combinadores com a Ingrata M (verus04 69, 108)."], 6752)
const petala = drop(
  "petala-invernal",
  "Pétala de Flor Invernal",
  "Premiação da linha de Ilusão da Flor de Neve: Simulação, Operação Destruição e Patrulha da Águia.",
)
const minerio = drop(
  "minerio-flor-neve",
  "Minério Mágico da Flor de Neve",
  "Sai junto da pétala na Batalha de Simulação e na Operação Destruição.",
)
const anelOrcs = drop("anel-orcs",
  "Anel dos Orcs",
  "O anel recebe 2 encantos, um de cada vez. A categoria é escolhida; o encanto específico, não.",
  ["Cada encanto custa 100.000 zeny e 20 Presas de Orc. Sucesso de 100%. O reset só existe com os 2 slots preenchidos."], 28522)
const amuleto = drop(
  "amuleto-menor",
  "Amuleto Menor",
  "Item adquirido na Caverna de Buwaya.",
  ["Trocado por tatuagens no Festival de Pintados. Nesta instância, a tatuagem é a de Buwaya."],
)
const tatuBang = drop(
  "tatuagem-bangungot",
  "Tatuagem de Bangungot",
  "Os itens do Hospital Abandonado são trocados no Festival de Pintados.",
  ["A tatuagem é o item final da troca."],
)
const tatuBako = drop(
  "tatuagem-bakonawa",
  "Tatuagem de Bakonawa",
  "Os itens do Lago de Bakonawa são trocados no Festival de Pintados.",
  ["A tatuagem é o item final da troca."],
)
const marca = drop("marca-heroi",
  "Marca do Herói",
  "Moeda de Ilha Bios e da Caverna de Mors. A ilha também solta caixas e peças heroicas.",
  [
    "30 marcas viram 1 Anel Heroico com a Negociante Especial, na Caverna de Fogo.",
    "O Encantador Byrnes encanta o anel de graça. Resetar custa 3 marcas.",
  ], 6684)
const pele = drop(
  "pele-rainha-verme",
  "Pele da Rainha Verme",
  "Cada baú entrega 1 pele já com refino e encantos aleatórios. O 3º slot define o super encanto do 2º.",
  [],
  20717,
)
const vale = drop(
  "vale-varmida",
  "Vale Varmida",
  "Moeda das instâncias de Varmundt: Duelo com Sweety, Fazenda de Pitayas, Jardim Secreto e Ortus Aqua.",
)
const nucleoAuto = drop("nucleo-automata", "Núcleo de Autômata Quebrada", "Sai no Duelo com Sweety, junto do Vale.")
const fragExp = drop("fragmento-experimento", "Fragmento de Experimento", "Premiação da Edda do Biolaboratório.")
const bioarma = drop(
  "bioarma",
  "Bioarma",
  "As caixas da Edda abrem nas armas de classe: Volar, Vernan, Argen Blanco, Lançarin, Adorare e as demais memórias.",
  ["Lavian, em Juno (yuno 220, 352), coloca até 2 encantos. Parte das armas não aceita encanto."],
)
const fragSonho = drop("fragmento-sonho", "Fragmento de Sonho", "Premiação da Edda do Quarto Crescente.")
const moedaSang = drop("moeda-sangrenta",
  "Moeda Sangrenta",
  "Premiação da Fábrica do Terror e da Fábrica Infantil. Baús ainda podem deixar caixas e chapelaria antiga.",
  ["Trocada pelos itens natalinos de Lutie."], 7642)
const brasao = drop("brasao-honra", "Brasão de Honra", "Premiação da operação militar em Terra Gloria.")
const mana = drop("mana-coagulada", "Mana Coagulada", "Premiação de Maldição de Glastheim e de Glastheim Infantil.")
const cristalTempo = drop("cristal-tempo", "Cristal do Tempo", "Sai na Maldição de Glastheim, junto da mana.")
const ametista = drop(
  "fragmento-ametista",
  "Fragmento de Ametista",
  "Premiação da Mansão da Desilusão e da Purificação do Santuário. O santuário paga um lote de fragmentos.",
)
const chave = drop("chave-mansao", "Chave da Mansão", "Premiação ao clicar no altar, depois da batalha.")
const mineas = drop("mineas",
  "Mineas",
  "O Marquês paga em Mineas depois de Sakray.",
  ["O NPC troca Mineas por armas Paenitentia. O Paenitentia Aegis não pode ser encantado."], 1000367)
const armaDanif = drop(
  "arma-danificada",
  "Arma Danificada",
  "Uma das recompensas aleatórias do Memorial COR e da Missão OS.",
  ["Trocada por Equipamentos Ilusión."],
)
const nucleoCor = drop(
  "nucleo-cor",
  "Núcleo COR",
  "Recompensa aleatória do Memorial COR e da Missão OS.",
  ["Trocado por Equipamentos Ilusión."],
)
const chip = drop(
  "chip-misterioso",
  "Chip Misterioso",
  "Recompensa aleatória do Memorial COR e da Missão OS.",
  ["Trocado por Equipamentos Ilusión."],
)
const cinzas = drop("fragmento-cinzas",
  "Fragmento de Cinzas",
  "O Rei troca os fragmentos por equipamento, e a Viajante das Dimensões repete a troca fora da instância (dali02 51, 130).",
  ["Armas e peças de Cinzas: botas, capa, armadura, manto, escudo, elmo, lanças, punho, violino, chicote, adaga, espadas, machado, katar e cajados."], 6672)
const cristalCorr = drop(
  "cristal-corrompido",
  "Cristal Corrompido",
  "Oscar entrega a recompensa depois do MVP.",
  ["Usado nas Máquinas do Oscar, na linha Edda de Glastheim."],
)
const peca = drop("peca-intacta",
  "Peça Intacta",
  "Premiação da Sala Final.",
  ["Fruit troca 17 peças por equipamentos. A lista completa está na bROWiki."], 6827)
const marcaHonra = drop("marca-honra", "Marca de Honra", "Entregue por Friedrich S. Heine ao sair do Salão de Ymir.")
const dente = drop("dente-marfim",
  "Dente de Marfim",
  "A página atual usa este nome. O compilado antigo citava Dente de Jitterbug.",
  ["Igu troca 50 dentes por 1 item aleatório: peitorais, braceletes, anéis, pingentes, arcos, microfone, fita, ukulele ou contrabaixo."], 6719)
const premio = drop(
  "premio-esquadrao",
  "Prêmio de Esquadrão",
  "1 prêmio com o Ajudante Abidal ou com a Hisie, conforme a missão aceita.",
  [],
  22567,
)
const moedaMag = drop("moeda-magica-geffen",
  "Moeda Mágica de Geffen",
  "O Guia do Torneio paga ao fim de cada partida.",
  ["A Negociante de dentro troca as moedas por encantadores, refletor, enciclopédia, anéis de reforço, traje e manto. Cada encantador custa 100 moedas."], 6671)
const esconj = drop(
  "arma-esconjurante",
  "Arma Esconjurante",
  "Maça, arco, katar, espada, punhal ou cajado. Já vem entre +1 e +12, com encanto aleatório.",
)
const cebolinha = drop("cebolinha",
  "Cebolinha",
  "Vegetal da Vila dos Porings. Recebe 1 encanto aleatório.",
  ["Encantar ou resetar custa 20.000 zeny e 50 Jellopy, com 70% de sucesso."], 19238)
const cenourinha = drop("cenourinha",
  "Cenourinha",
  "Vegetal da Vila dos Porings. Recebe 1 encanto aleatório.",
  ["Encantar ou resetar custa 20.000 zeny e 50 Jellopy, com 70% de sucesso."], 19239)
const moedaNoite = drop("moeda-noturna",
  "Moeda Noturna de Geffen",
  "A recompensa só entra se a rodada terminar e você desistir. Quanto mais longe, maior o prêmio.",
  ["A Máquina Abandonada (dali 79, 60) troca a moeda por equipamentos, adornos e cartas noturnas."], 1000316)
const sobrenatural = drop(
  "arma-sobrenatural",
  "Arma Sobrenatural",
  "Adaga, livro, shuriken, revólver, violino, chicote, arco, espadas, arpão, glaive, katar, punho, cajado, cetro, machado ou maça.",
  ["A arma já vem com 3 bônus aleatórios."],
)
const fragTemp = drop(
  "fragmento-temporal",
  "Fragmento Temporal",
  "Cai no baú para o grupo.",
  ["Usado nas Máquinas do Oscar."],
)
const diadema = drop(
  "diadema-temporal",
  "Diadema Temporal Selado",
  "Bônus do líder ao falar com Oscar. A chance acompanha as Origens da Corrupção.",
  ["Usado nas Máquinas do Oscar."],
)
const gemaTemp = drop("gema-temporal", "Gema Temporal", "Recompensa de Glastheim Infernal.", ["Usada nas Máquinas do Oscar."])
const poderTemp = drop("poder-temporal", "Poder Temporal", "Recompensa de Glastheim Infernal.", ["Usado nas Máquinas do Oscar."])
const manaSomb = drop("mana-sombria", "Mana Sombria", "Premiação de Glastheim Sombria, junto da Mana Coagulada.")
const biologico = drop(
  "material-biologico",
  "Material biológico",
  "Premiação do Laboratório de Wolfchev.",
  ["Trocado pelos itens biológicos de Lighthalzen."],
)
const gemaCorr = drop(
  "gema-corrompida",
  "Gema Corrompida",
  "Oscar entrega a recompensa depois do MVP.",
  ["Usada nas Máquinas do Oscar, na linha Edda de Glastheim."],
)
const fragYmir = drop("fragmento-ymir", "Fragmento de Ymir", "Premiação da Queda do Aeroplano.")
const contas = drop("contas-ymir", "Contas de Ymir", "Sai junto do fragmento na Queda do Aeroplano.")
const bota = drop(
  "bota-desconhecida",
  "Bota Desconhecida",
  "Uma bota entre FOR, DES, VIT, INT, AGI e SOR.",
)
const fragMeteoro = drop("fragmento-meteorito",
  "Fragmento de Meteorito",
  "A premiação grossa vem da soma dos atributos, não do clique no MVP.",
  [
    "Trocado nas Máquinas do Oscar, em Alberta (203, 75), por pós, vestes, armaduras e sinetes.",
    "Encantar o 4º slot na OSC0008 custa 5 fragmentos e 300.000 zeny. O 3º slot custa 10 fragmentos e 500.000 zeny.",
  ], 1000373)
const poMeteoro = drop(
  "po-meteorito",
  "Pó de Meteorito",
  "Variação da premiação da Torre da Constelação: Poder, Estamina, Concentração, Criatividade, Feitiço ou Sabedoria.",
  ["As vestes, armaduras e sinetes nebulosos saem dessa troca."],
)
const alma = drop("alma-naght", "Alma de Naght Sieger", "1 alma ao eliminar o MVP. O restante da premiação vem da pontuação.", [], 1000396)
const pocaoExp = drop("pocao-exp", "Poção Menor de EXP", "Recompensa atual da Cripta. O compilado antigo citava Embalagem de Poções.")
const pocaoClasse = drop("pocao-classe", "Poção Menor de Classe", "Recompensa atual da Cripta, junto da poção de experiência.")
const cristalTemporal = drop("cristal-temporal", "Cristal Temporal", "Sai em Glastheim Infantil, junto da Mana Coagulada.")
const gigantes = drop("fragmento-gigantes",
  "Fragmento de Gigantes",
  "O NPC vende os brincos e encanta os dois lados com listas diferentes.",
  [
    "1 fragmento compra 1 Brinco de Locomoção ou de Regeneração.",
    "Encantar custa 4 fragmentos. O brinco aceita 2 encantos, um por vez.",
    "Resetar custa 1 fragmento.",
  ], 6803)
const pedra = drop(
  "pedra-bruta",
  "Pedra Bruta",
  "Encantar custa 10 pedras e 100.000 zeny, com 100% de sucesso.",
  [
    "O Homem Suspeito encanta o Anel do Monarca em 2 slots. A categoria é escolhida. O reset, com os 2 slots cheios, tem 20% de chance de destruir o anel.",
    "A Colecionadora encanta 1 slot aleatório de acessórios comuns, como anéis, brincos, broches e luvas listados na bROWiki.",
  ],
  25235,
)

function inst(
  id: string,
  name: string,
  section: SectionId,
  sectionRank: number,
  subRank: number,
  nivel: string,
  retorno: string,
  modo: string,
  requisito: string,
  premiacao: string,
  slug: string,
  drops: Drop[],
  blurb?: string,
): Instance {
  return {
    id,
    name,
    section,
    sectionRank,
    subRank,
    nivel,
    retorno,
    modo,
    requisito,
    premiacao,
    url: `https://browiki.org/wiki/${slug}`,
    blurb,
    drops,
  }
}

export const INSTANCES: Instance[] = [
  inst("inst_50", "Esgotos de Malangdo", "horas", 1, 1, "90", "1 hora", "1+", "-", "Ira do Deus do Mar", "Esgotos_de_Malangdo", [ira, moedaA, moedaB], "Missão com Bigodes. Normal no 90, difícil no 140."),
  inst("inst_51", "Labirinto da Neblina", "horas", 1, 2, "99", "2 horas", "1+", "-", "Aventuras na Vila", "Labirinto_da_Neblina", [], "Não tem item de farm. Concluir libera a missão diária Aventuras na Vila."),
  inst("inst_49", "Caverna do Polvo", "horas", 1, 3, "90", "3 horas", "1+", "-", "Caixa das Melhores Armas", "Caverna_do_Polvo", [caixa]),
  inst("inst_52", "Espaço Infinito", "horas", 1, 3, "100", "3 horas", "1+", "-", "Pó Espacial", "Espaço_Infinito", [poEspacial]),
  inst("inst_48", "Altar do Selo", "horas", 1, 12, "75", "12 horas", "2+", "-", "Chifres Majestosos", "Altar_do_Selo", [chifres, chifresG, boneco, cristalEsc, fragEsc]),

  inst("inst_14", "Aos Pés do Rei", "diario", 2, 0, "130", "Diária", "1+", "-", "Carta Dourada", "Aos_Pés_do_Rei", [carta, charleston], "A caçada aos Roborings paga experiência e a carta no fim."),
  inst("inst_7", "Base Militar", "diario", 2, 0, "100", "Diária", "1+", "Terra Gloria", "Brasão de Honra", "Base_Militar", [brasao]),
  inst("inst_35", "Batalha de Simulação", "diario", 2, 0, "200", "Diária", "1+", "-", "Pétala de Flor Invernal", "Batalha_de_Simulação", [petala, minerio]),
  inst("inst_2", "Batalha dos Orcs", "diario", 2, 0, "60", "Diária", "1+", "-", "Anel dos Orcs", "Batalha_dos_Orcs", [anelOrcs]),
  inst("inst_20", "Caverna de Buwaya", "diario", 2, 0, "130", "Diária", "1+", "Segredos na Floresta", "Tatuagem de Buwaya", "Caverna_de_Buwaya", [amuleto]),
  inst("inst_28", "Caverna de Mors", "diario", 2, 0, "160", "Diária", "1+", "Ilha Bios", "Marca do Herói", "Caverna_de_Mors", [marca], "A tabela antiga chama a premiação de Prêmio do Herói."),
  inst("inst_23", "Covil de Vermes", "diario", 2, 0, "140", "Diária", "1+", "-", "Pele da Rainha Verme", "Covil_de_Vermes", [pele], "Quanto mais rápido o caminho, mais baús dá para abrir. Os encantos não mudam com o tempo."),
  inst("inst_19", "Duelo com Sweety", "diario", 2, 0, "130", "Diária", "1+", "Legado do Sábio", "Vale Varmida", "Duelo_com_Sweety", [vale, nucleoAuto], "A recompensa é retirada com Amêndoa, fora da instância."),
  inst("inst_30", "Edda do Biolaboratório", "diario", 2, 0, "170", "Diária", "1+", "-", "Fragmento de Experimento", "Edda_do_Biolaboratório", [fragExp, bioarma], "Modo Batalha paga mais. Modo Expedição luta menos."),
  inst("inst_3", "Edda do Quarto Crescente", "diario", 2, 0, "80", "Diária", "Solo", "-", "Fragmento de Sonho", "Edda_do_Quarto_Crescente", [fragSonho]),
  inst("inst_24", "Fábrica do Terror", "diario", 2, 0, "140", "Diária", "1+", "-", "Moeda Sangrenta", "Fábrica_do_Terror", [moedaSang]),
  inst("inst_18", "Fazenda de Pitayas", "diario", 2, 0, "130", "Diária", "1+", "Legado do Sábio", "Vale Varmida", "Fazenda_de_Pitayas", [vale]),
  inst("inst_27", "Ilha Bios", "diario", 2, 0, "160", "Diária", "1+", "Viagem Dimensional", "Marca do Herói", "Ilha_Bios", [marca]),
  inst("inst_13", "Invasão ao Aeroplano", "diario", 2, 0, "125", "Diária", "Solo", "-", "Experiência", "Invasão_ao_Aeroplano", [], "A recompensa é experiência. Os monstros do aviso são NPCs de cena."),
  inst("inst_17", "Jardim Secreto", "diario", 2, 0, "130", "Diária", "1+", "Zona Restrita", "Vale Varmida", "Jardim_Secreto", [vale], "Também pode sair Caixa de Automódulo H-. O MVP precisa morrer na sua tela."),
  inst("inst_25", "Laboratório Central", "diario", 2, 0, "140", "Diária", "1+", "Fantasmagórica", "Batalha contra MVPs", "Laboratório_Central", [], "A instância é a batalha contra MVPs aleatórios. A bROWiki não lista um item fixo de craft."),
  inst("inst_8", "Laboratório Werner", "diario", 2, 0, "100", "Diária", "1+", "Terra Gloria", "Brasão de Honra", "Laboratório_Werner", [brasao]),
  inst("inst_21", "Maldição de Glastheim", "diario", 2, 0, "130", "Diária", "1+", "-", "Mana Coagulada", "Maldição_de_Glastheim", [mana, cristalTempo], "O grupo precisa estar vivo e na mesma tela para o MVP contar."),
  inst("inst_33", "Mansão da Desilusão", "diario", 2, 0, "200", "Diária", "2+", "-", "Chave da Mansão", "Mansão_da_Desilusão", [chave, ametista]),
  inst("inst_37", "Mausoléu das Mágoas", "diario", 2, 0, "220", "Diária", "1+", "-", "Mineas", "Mausoléu_das_Mágoas", [mineas]),
  inst("inst_10", "Memorial COR", "diario", 2, 0, "110", "Diária", "1+", "Ilusión", "Núcleo COR", "Memorial_COR", [nucleoCor, chip, armaDanif], "Elena entrega a recompensa depois de EL-A17T."),
  inst("inst_5", "Memórias de Sarah", "diario", 2, 0, "99", "Diária", "1+", "-", "Experiência", "Memórias_de_Sarah", [], "Leon paga a recompensa em experiência."),
  inst("inst_32", "Memórias de Thanatos", "diario", 2, 0, "180", "Diária", "1+", "-", "Acessórios especiais", "Memórias_de_Thanatos", [], "Os fragmentos de Ódio, Agonia, Desgraça e Desespero são chaves da própria instância. A premiação de saída são os acessórios."),
  inst("inst_9", "Missão OS", "diario", 2, 0, "110", "Diária", "1+", "Ocupação OS", "Chip Misterioso", "Missão_OS", [chip, nucleoCor, armaDanif], "A experiência ainda varia com o CP de Miguel."),
  inst("inst_36", "Operação Destruição", "diario", 2, 0, "200", "Diária", "1+", "-", "Pétala de Flor Invernal", "Operação_Destruição", [petala, minerio], "O dispositivo depois de Aquila paga experiência, reputação, minério e pétala."),
  inst("inst_16", "Ortus Aqua", "diario", 2, 0, "130", "Diária", "1+", "Salvando Elyumina", "Vale Varmida", "Ortus_Aqua", [vale], "O volume segue a missão escolhida lá dentro."),
  inst("inst_11", "Palácio das Mágoas", "diario", 2, 0, "120", "Diária", "Solo", "-", "Fragmento de Cinzas", "Palácio_das_Mágoas", [cinzas]),
  inst("inst_34", "Patrulha da Águia", "diario", 2, 0, "200", "Diária", "1+", "-", "Pétala de Flor Invernal", "Patrulha_da_Águia", [petala], "Fique na mesma tela dos NPCs durante a patrulha."),
  inst("inst_31", "Purificação do Santuário", "diario", 2, 0, "170", "Diária", "1+", "-", "Fragmento de Ametista", "Purificação_do_Santuário", [ametista], "Aceite as missões com o Sacerdote antes de entrar."),
  inst("inst_22", "Ruína de Glastheim", "diario", 2, 0, "130", "Diária", "1+", "Edda de Glastheim", "Cristal Corrompido", "Ruína_de_Glastheim", [cristalCorr]),
  inst("inst_26", "Sala Final", "diario", 2, 0, "150", "Diária", "1+", "Investigando o Passado", "Peça Intacta", "Sala_Final", [peca]),
  inst("inst_6", "Salão de Ymir", "diario", 2, 0, "100", "Diária", "Solo", "Ritual de Coroação", "Marca de Honra", "Salão_de_Ymir", [marcaHonra]),
  inst("inst_12", "Sonho Sombrio", "diario", 2, 0, "120", "Diária", "1+", "-", "Dente de Marfim", "Sonho_Sombrio", [dente], "Novo Oz ainda paga 1.500.000 de experiência base e 500.000 de classe."),
  inst("inst_29", "Templo do Demônio Rei", "diario", 2, 0, "160", "Diária", "1+", "Caverna de Mors", "Prêmio de Esquadrão", "Templo_do_Demônio_Rei", [premio]),
  inst("inst_4", "Torneio de Magia", "diario", 2, 0, "90", "Diária", "Solo", "-", "Moeda Mágica de Geffen", "Torneio_de_Magia", [moedaMag]),
  inst("inst_15", "Torre do Demônio", "diario", 2, 0, "130", "Diária", "1+", "-", "Armas Esconjurantes", "Torre_do_Demônio", [esconj]),
  inst("inst_1", "Vila dos Porings", "diario", 2, 0, "30", "Diária", "1+", "-", "Cebolinha ou Cenourinha", "Vila_dos_Porings", [cebolinha, cenourinha]),

  inst("inst_46", "Arena Noturna", "tres", 3, 0, "210", "3 dias", "1+", "-", "Moeda Noturna de Geffen", "Arena_Noturna", [moedaNoite]),
  inst("inst_41", "Fortaleza Voadora", "tres", 3, 0, "145", "3 dias", "1+", "Salão de Ymir", "Armas Sobrenaturais", "Fortaleza_Voadora", [sobrenatural]),
  inst("inst_44", "Glastheim Infernal", "tres", 3, 0, "170", "3 dias", "1+", "-", "Fragmento Temporal", "Glastheim_Infernal", [fragTemp, diadema, gemaTemp, poderTemp]),
  inst("inst_42", "Glastheim Sombria", "tres", 3, 0, "160", "3 dias", "1+", "Maldição de Glastheim", "Mana Sombria", "Glastheim_Sombria", [manaSomb, mana], "A bROWiki também cita o encanto das Botas Temporais com os auxiliares de Hugin."),
  inst("inst_40", "Laboratório de Wolfchev", "tres", 3, 0, "90", "3 dias", "1+", "Rumores Sérios", "Material biológico", "Laboratório_de_Wolfchev", [biologico]),
  inst("inst_39", "Ninho de Nidhogg", "tres", 3, 0, "70", "3 dias", "1+", "Guardiã de Yggdrasil", "Experiência", "Ninho_de_Nidhogg", [], "A recompensa é experiência."),
  inst("inst_43", "Queda de Glastheim", "tres", 3, 0, "170", "3 dias", "1+", "Edda de Glastheim", "Gema Corrompida", "Queda_de_Glastheim", [gemaCorr]),
  inst("inst_45", "Queda do Aeroplano", "tres", 3, 0, "200", "3 dias", "1+", "-", "Fragmento de Ymir", "Queda_do_Aeroplano", [fragYmir, contas, bota], "A experiência sobe com o tamanho do grupo."),
  inst("inst_47", "Torre da Constelação", "tres", 3, 0, "240", "3 dias", "1+", "-", "Pó de Meteorito", "Torre_da_Constelação", [fragMeteoro, poMeteoro, alma]),
  inst("inst_38", "Torre Submersa", "tres", 3, 0, "40", "3 dias", "1+", "-", "Experiência", "Torre_Submersa", [], "A cada 5 andares, o portal entrega uma recompensa única de experiência."),

  inst("inst_53", "Cripta", "semanal", 4, 0, "60", "Fim de semana", "1+", "-", "Poções de experiência", "Cripta", [pocaoExp, pocaoClasse], "A dificuldade escolhida vai de 60 a 160."),
  inst("inst_55", "Fábrica Infantil", "semanal", 4, 0, "70", "Quinta-feira", "1+", "-", "Moeda Sangrenta", "Fábrica_Infantil", [moedaSang]),
  inst("inst_54", "Glastheim Infantil", "semanal", 4, 0, "65", "Quinta-feira", "1+", "-", "Mana Coagulada", "Glastheim_Infantil", [mana, cristalTemporal]),
  inst("inst_57", "Hospital Abandonado", "semanal", 4, 0, "100", "7 dias", "1+", "Enfermeira em Porto Malaya", "Tatuagem de Bangungot", "Hospital_Abandonado", [tatuBang]),
  inst("inst_58", "Lago de Bakonawa", "semanal", 4, 0, "140", "7 dias", "1+", "Livre-se de Bakonawa", "Tatuagem de Bakonawa", "Lago_de_Bakonawa", [tatuBako]),
  inst("inst_59", "Sarah vs Fenrir", "semanal", 4, 0, "145", "7 dias", "1+", "-", "Fragmento de Gigantes", "Sarah_vs_Fenrir", [gigantes], "Ir até Fenrir não adiciona premiação."),
  inst("inst_56", "Túmulo do Monarca", "semanal", 4, 0, "99", "Sexta-feira", "1+", "-", "Pedra Bruta", "Túmulo_do_Monarca", [pedra], "A dificuldade escolhida vai de 100 a 160."),
]

export const SHARED_DROPS = new Set(
  INSTANCES.flatMap((item) => item.drops.map((itemDrop) => itemDrop.id)).filter(
    (id, _index, all) => all.indexOf(id) !== all.lastIndexOf(id),
  ),
)
