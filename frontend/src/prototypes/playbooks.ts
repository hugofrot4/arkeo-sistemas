/**
 * Playbooks de conteúdo por tipo de negócio.
 *
 * Estes textos são a parte do sistema que carrega conhecimento de ofício: o
 * que o cliente final daquele ramo quer saber, o que trava a decisão dele, e
 * o que soa falso quando escrito por quem nunca vendeu para aquele público.
 * Entram inteiros no prompt que você roda no Claude Code.
 *
 * Mudar um playbook muda a qualidade de todos os protótipos daquele ramo —
 * é o lugar certo para acumular o que a operação for aprendendo.
 */

import type { TemplateId } from "./types";

export interface Playbook {
  label: string;
  /** Quem está do outro lado da tela, e em que situação. */
  audience: string;
  /** O que efetivamente faz essa pessoa decidir. */
  decisionDriver: string;
  /** O que trava a decisão — é o que a FAQ tem que responder. */
  objections: string[];
  /** O trabalho de cada bloco neste ramo. */
  sections: {
    hero: string;
    services: string;
    about: string;
    proof: string;
    faq: string;
    location: string;
  };
  palette: string;
  avoid: string[];
  /** O que costuma faltar e vira `placeholders` na página. */
  placeholderHints: string[];
}

export const PLAYBOOKS: Record<TemplateId, Playbook> = {
  clinica: {
    label: "Saúde e bem-estar",
    audience:
      "Alguém com dor, medo ou uma dúvida que já adiou. Costuma pesquisar do celular, muitas vezes à noite, depois de ter tentado descobrir sozinho o que tem.",
    decisionDriver:
      "Sensação de estar em boas mãos, somada à facilidade de marcar. Ninguém escolhe clínica por preço quando está com medo — escolhe por confiança e por conseguir falar com alguém hoje.",
    objections: [
      "Vai doer?",
      "Atendem o meu caso especificamente?",
      "Quanto tempo leva o tratamento?",
      "Preciso de encaminhamento ou exame antes?",
      "Como faço para marcar e qual a espera?",
    ],
    sections: {
      hero:
        "Nomeie o problema que a pessoa tem, não a especialidade que a clínica tem. 'Dor de dente que não passa' funciona; 'Odontologia de excelência' não diz nada a quem está com dor.",
      services:
        "Cada item deve deixar claro para QUEM serve e em que situação se procura. Descreva o atendimento, não a técnica: quem busca não sabe o nome do procedimento.",
      about:
        "Explique como é ser atendido ali — o ritmo, o cuidado, o que acontece na primeira consulta. É o bloco que reduz medo.",
      proof:
        "Fale sobre a relação com os pacientes de forma verificável e sóbria. Sem adjetivo superlativo.",
      faq: "Responda as objeções acima com honestidade, incluindo 'depende do caso' quando for verdade. Vaguidão aqui aumenta a ansiedade em vez de reduzir.",
      location:
        "Como chegar e como marcar. Quem está com dor precisa disso em uma leitura.",
    },
    palette:
      "Tons frios e claros — azul, verde-água, teal — transmitem limpeza e calma, que é o oposto do que a pessoa está sentindo. Evite vermelho saturado (associação direta a sangue e urgência) e evite branco puro em tudo, que deixa a página fria e sem identidade.",
    avoid: [
      "sorriso dos sonhos, sorriso perfeito",
      "transformamos vidas, mudamos histórias",
      "excelência em odontologia/fisioterapia",
      "tecnologia de ponta (sem dizer qual, é ruído)",
      "atendimento humanizado usado como slogan em vez de descrição",
    ],
    placeholderHints: [
      "fotos do consultório",
      "convênios atendidos",
      "horário de atendimento",
      "equipe e registros profissionais",
    ],
  },

  juridico: {
    label: "Serviço profissional",
    audience:
      "Alguém com um problema que tem consequência — um prazo, uma dívida, uma disputa, uma compra grande. Já pesquisou o assunto e chega com meio entendimento e bastante receio de ser passado para trás.",
    decisionDriver:
      "Sinal de competência e de que vai ser bem atendido. A pessoa não sabe julgar a qualidade técnica, então julga pela clareza com que o serviço é explicado.",
    objections: [
      "Vocês cuidam exatamente do meu tipo de caso?",
      "Como funciona a primeira conversa e ela custa alguma coisa?",
      "Quanto tempo isso costuma levar?",
      "O que eu preciso separar de documento?",
      "Vou falar com quem, e com que frequência recebo notícia?",
    ],
    sections: {
      hero:
        "Nomeie a situação concreta em que a pessoa está, não a área do direito. 'Recebeu uma cobrança que não reconhece' funciona; 'Advocacia cível e empresarial' só serve para quem já é da área.",
      services:
        "Liste por situação do cliente, não por nomenclatura técnica. Cada item explica quando procurar e o que acontece a partir daí.",
      about:
        "Como o escritório trabalha: forma de contato, ritmo de retorno, como o cliente fica sabendo do andamento. Previsibilidade é o produto.",
      proof:
        "Sobriedade. Descreva a postura de trabalho, sem superlativo e sem qualquer sugestão de desfecho.",
      faq: "Explique o processo em linguagem comum. É aqui que se ganha a confiança de quem não entende do assunto.",
      location: "Onde fica, como agendar, se atende a distância.",
    },
    palette:
      "Escuros profundos com um acento sóbrio — azul-marinho, grafite, verde-escuro, com detalhe em dourado fosco ou azul aço. Institucional sem ser sombrio. Evite preto puro, que fica pesado, e evite cores vibrantes, que quebram a percepção de seriedade.",
    avoid: [
      "seus direitos em boas mãos",
      "combatividade, luta pelos seus direitos",
      "referência no mercado, escritório de excelência",
      "soluções jurídicas sob medida",
      "qualquer coisa que sugira desfecho ou chance de ganho",
    ],
    placeholderHints: [
      "áreas de atuação confirmadas",
      "equipe e inscrições profissionais",
      "endereço completo do escritório",
      "canais e horários de atendimento",
    ],
  },

  food: {
    label: "Alimentação",
    audience:
      "Alguém decidindo onde comer agora, ou planejando um encontro para os próximos dias. Está com fome ou com pressa, quase sempre no celular.",
    decisionDriver:
      "Vontade de comer aquilo, somada à conveniência: perto, aberto, dá para pedir. A decisão leva segundos.",
    objections: [
      "Está aberto agora?",
      "Faz entrega, e para o meu bairro?",
      "Tem opção vegetariana, sem glúten, sem lactose?",
      "Precisa reservar?",
      "Tem estacionamento?",
    ],
    sections: {
      hero:
        "Descreva a comida de um jeito que dê vontade, ancorado no que o lugar realmente é. Concreto vence adjetivo: um prato específico funciona melhor que 'sabor inesquecível'.",
      services:
        "É o cardápio. Cada item com nome do prato e uma descrição curta do que vem nele. Sem preço — o preço muda e não temos o valor real.",
      about:
        "A história curta do lugar: o que fazem, como fazem, o que dá orgulho. Sem romantizar.",
      proof: "O que as pessoas costumam voltar para comer, dito com sobriedade.",
      faq: "Entrega, reserva, restrição alimentar, estacionamento. São as perguntas reais.",
      location:
        "Endereço e referência de localização. Em restaurante, 'onde fica' pesa tanto quanto 'o que serve'.",
    },
    palette:
      "Tons quentes — terracota, mostarda, vinho, verde-oliva. É prática consolidada em comunicação de alimentação: cor quente estimula apetite. Evite azul, que faz o oposto, e evite paleta pastel, que tira o apetite da foto que não temos.",
    avoid: [
      "sabor inesquecível, explosão de sabores",
      "os melhores da cidade",
      "ingredientes selecionados (todo mundo diz)",
      "ambiente aconchegante usado sem descrever nada",
    ],
    placeholderHints: [
      "fotos dos pratos",
      "cardápio completo com preços",
      "horário de funcionamento",
      "área de entrega",
    ],
  },

  beleza: {
    label: "Beleza e estética",
    audience:
      "Alguém escolhendo em quem confiar a própria aparência. Já foi mal atendido antes e está atento a sinais de cuidado — inclusive no site, que lê como amostra do gosto do lugar.",
    decisionDriver:
      "Confiança no resultado estético e facilidade de agendar. Aqui o próprio design da página é argumento: um site desleixado sugere um serviço desleixado.",
    objections: [
      "Atendem o meu tipo de cabelo, pele ou unha?",
      "Quanto tempo demora o procedimento?",
      "Precisa marcar ou atendem por ordem de chegada?",
      "Dá para fazer mais de um serviço na mesma visita?",
    ],
    sections: {
      hero:
        "Diga o que a pessoa sai levando dali, em linguagem de resultado sensorial, não de técnica.",
      services:
        "Por serviço, com duração aproximada quando fizer sentido dizer 'varia'. Sem preço.",
      about:
        "O clima do lugar e o cuidado no atendimento. Este bloco é onde o gosto do negócio aparece.",
      proof: "A relação com as clientes, descrita com discrição.",
      faq: "Agendamento, duração, cuidados antes e depois.",
      location: "Onde fica e como agendar.",
    },
    palette:
      "Neutros quentes de base — areia, off-white, nude, carvão — com um acento saturado só. Elegância aqui vem de contenção e de espaço em branco, não de acumular cor. Evite rosa-choque e dourado brilhante, que envelheceram mal e viraram sinal de template genérico.",
    avoid: [
      "realce sua beleza natural",
      "autoestima renovada, sinta-se especial",
      "profissionais altamente qualificados",
      "seu momento de cuidar de você",
    ],
    placeholderHints: [
      "fotos dos trabalhos",
      "tabela de serviços e preços",
      "horário de funcionamento",
      "link de agendamento",
    ],
  },

  "servico-local": {
    label: "Serviço local",
    audience:
      "Alguém com um problema prático acontecendo agora — carro parado, portão travado, mudança marcada. Não quer ler nada: quer um número e a confirmação de que atendem ali.",
    decisionDriver:
      "Velocidade e proximidade. Quem responde primeiro e atende naquele bairro leva o serviço.",
    objections: [
      "Atendem no meu bairro?",
      "Conseguem vir hoje?",
      "Vocês cobram a visita?",
      "Fazem esse tipo de serviço específico?",
    ],
    sections: {
      hero:
        "O serviço e a região, em uma frase. O telefone tem que estar visível sem rolar a página.",
      services:
        "Lista objetiva do que fazem. Item curto, sem enfeite: a pessoa está escaneando para achar o dela.",
      about:
        "Como funciona o atendimento — orçamento, prazo, forma de chamar. Nada de história institucional.",
      proof: "A relação com os clientes da região, sem superlativo.",
      faq: "Área atendida, prazo, urgência, orçamento.",
      location: "Onde ficam e até onde atendem.",
    },
    palette:
      "Alto contraste e cor funcional — azul forte, laranja, verde-escuro. Legibilidade sob sol, na rua, com pressa, vale mais que sofisticação. Evite paleta clara de baixo contraste.",
    avoid: [
      "soluções completas",
      "qualidade e compromisso",
      "seu problema é o nosso problema",
      "anos de tradição (não sabemos quantos)",
    ],
    placeholderHints: [
      "área de atendimento",
      "horário e plantão",
      "formas de pagamento",
      "fotos dos serviços",
    ],
  },
};

/**
 * Restrições de publicidade por profissão regulamentada.
 *
 * Vale por NICHO, não por template: o mesmo template atende advogado e
 * arquiteto, e só o primeiro responde a regra de publicidade da OAB.
 *
 * São restrições conhecidas dos códigos de publicidade dessas categorias, aqui
 * como limite de redação — o que o protótipo não vai afirmar. Antes de o site
 * definitivo ir ao ar, quem confirma o enquadramento é o próprio profissional
 * com o conselho dele.
 */
export const NICHE_COMPLIANCE: Record<string, string[]> = {
  lawyer: [
    "Publicidade de advocacia é informativa e discreta por norma da categoria. Nada de tom mercantil ou de captação.",
    "Não sugira, prometa ou insinue resultado, chance de êxito ou rapidez de decisão judicial.",
    "Sem depoimento de cliente, sem caso concreto, sem nome de parte.",
    "Sem preço, honorário, parcelamento, promoção ou 'consulta grátis'.",
    "Sem superlativo de posicionamento: 'o melhor', 'líder', 'número 1', 'especialista' como título.",
    "O CTA convida a uma conversa, não vende: 'falar com o escritório', nunca 'contrate agora'.",
  ],
  dentist: [
    "Publicidade odontológica é regulada: nada de prometer ou sugerir resultado.",
    "Sem imagem ou menção de antes e depois.",
    "Sem preço, promoção, desconto, cortesia ou parcelamento.",
    "Sem depoimento de paciente.",
    "Sem sensacionalismo e sem superlativo ('o melhor', 'o mais moderno').",
  ],
  doctor: [
    "Publicidade médica é regulada: nada de prometer ou sugerir resultado.",
    "Sem imagem ou menção de antes e depois.",
    "Sem preço, promoção, desconto ou parcelamento.",
    "Sem depoimento de paciente.",
    "Sem autopromoção sensacionalista ou comparação com outros profissionais.",
  ],
  physiotherapist: [
    "Publicidade de fisioterapia segue o código da categoria: não prometa cura, prazo de recuperação nem resultado.",
    "Sem antes e depois, sem depoimento de paciente, sem preço ou promoção.",
  ],
  veterinary_care: [
    "Publicidade veterinária segue o código da categoria: sem promessa de cura ou resultado.",
    "Sem preço, promoção ou depoimento de tutor.",
  ],
  accounting: [
    "Publicidade contábil é sóbria por código da categoria: sem promessa de economia de imposto, de resultado ou de valores.",
    "Sem preço e sem comparação com concorrente.",
  ],
};

export function complianceFor(niche: string): string[] {
  return NICHE_COMPLIANCE[niche] ?? [];
}

/**
 * Nicho da Places API → template. A IA também escolhe um template, mas este
 * mapa é o padrão e a rede de segurança: se o modelo devolver um id que não
 * existe, cai aqui em vez de quebrar a página.
 */
const NICHE_TEMPLATE: Record<string, TemplateId> = {
  dentist: "clinica",
  physiotherapist: "clinica",
  veterinary_care: "clinica",
  doctor: "clinica",
  lawyer: "juridico",
  accounting: "juridico",
  architect: "juridico",
  insurance_agency: "juridico",
  real_estate_agency: "juridico",
  restaurant: "food",
  cafe: "food",
  bakery: "food",
  beauty_salon: "beleza",
  hair_salon: "beleza",
  spa: "beleza",
  gym: "servico-local",
  car_repair: "servico-local",
  pet_store: "servico-local",
};

export function templateForNiche(niche: string): TemplateId {
  return NICHE_TEMPLATE[niche] ?? "servico-local";
}
