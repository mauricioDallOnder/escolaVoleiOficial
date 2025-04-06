const fs = require('fs');

// Carrega os dados dos alunos e turmas dos arquivos JSON
const alunos = require('./alunos.json');
const dadosTurmas = require('./turmas.json').modalidades;

const mapeamentoTurmas = {
    "SUB07_CAMPO_SABADO_09H30": [
        "ANTHONY DA SILVA MACHADO",
        "Guilherme Zago da Rosa",
        "GUSTAVO DE MORAIS",
        "Lorenzo Lovatto Cislaghi",
        "Miguel Schleder Vasconcelos",
        "Nicolas Moreira",
        "Victor da Silva Gomes",
        "LORENZO TEIXEIRA DA SILVA",
    ],
    "SUB09_CAMPO_SABADO_9H30": [
        "Adrian da Cruz Moraes",
        "Arthur Barros Marques",
        "Arthur de Paula Pavoski",
        "Arthur Toniolo Godoy",
        "Benjamin Menzen Padilha",
        "Bernardo Fogaça de Almeida Manique",
        "Bernardo Gaspari Xavier",
        "Bruno Renato Schmitz Gusmão",
        "Carlos Eduardo Franzen Borges",
        "Gabriel Lemos Dos Passos",
        "Henrique Francisquetti Barêa",
        "João Emanuel De Souza Vieira",
        "JOÃO HENRIQUE CARDOZO GAÚNA",
        "Joaquim Sturmer da Silva",
        "Matheus Venzon Adami",
        "Miguel Ramos Butka",
        "Murilo Altamiranda Kulmann",
        "PEDRO Henrique Canabarro",
        "Pedro Henrique Damin Martins",
        "Theo Dos Santos Freitas",
        "Vicente Pretto",
        "Vitor Da Silva Picoli",
    ],
    "SUB11_CAMPO_SABADO_8H15": [
        "Adrian Ribeiro Rodrigues",
        "Alef Feijó De Oliveira",
        "Arthur de Moraes Bonhenberger",
        "Eduardo Bitencourt Camargo",
        "Eduardo Rodrigues Camassola",
        "Felipe Nunes Godinho",
        "Gabriel Moreira Lima",
        "Gregory Nathan Da Silva Soares",
        "Gustavo Petineli Machado",
        "Jhoniel Jesus Gomez Barros",
        "José Henrique Germann Justin",
        "Kauan Rodrigues Da Silva Lara",
        "Leonardo Isoton Comerlatto",
        "Luan Fernando Moreira",
        "Lucca de castro Fernandes",
        "Luís Gustavo Herbert de Lima",
        "Luís Miguel Morais De Assumpção",
        "Lukas Daniel Borges Gomes",
        "Nicolas Silva de Lima",
        "Pablo Gabriel Knevitz Haccourt",
        "Renato Maciel Silva",
        "Talles Mathias Janes Andrade",
        "Vicenti Kornowski",
        "Victor Pietro Hermann Settin",
    ],
    "SUB13_CAMPO_SABADO_8H15": [
        "Arthur Levandoski Pereira",
        "Carlos Eduardo Barros Marques",
        "Gabriel Fogaça de Almeida Manique",
        "João Bernardo Rohr Carnietto",
        "Lukas Eduardo Santos de Oliveira",
        "Murilo Lemos Dos Passos",
        "Rafael Knevitz",
        "Rafael Machado",
        "Victor Oliveira e Silva",
        "ARTHUR DE ALMEIDA SANTOS",
    ],
    "SUB13_CAMPO_SABADO_10H45": [
        "Daniel Rodrigues Pacheco",
        "Davi Schmeier",
        "Deivid da Silva Noronha",
        "Erik Pavelski Piekatoski",
        "Guilherme Baloco de Almeida",
        "Gustavo De Gasperi Bagatini",
        "Hevelyn Jhanyne Antunes Rodrigues",
        "Israel Duarte Rizzotto",
        "João Bernardo Rohr Carnietto",
        "Nicolas Daniel Nunes Bado",
        "Pedro Henrique Leal Chagas",
        "Pedro Henrique Visentin Dani",
        "Rian Sousa",
        "Victor Carlos Lima De Oliveira",
    ],
    "SUB15_17_CAMPO_SABADO10H45": [
        "Anthony Dos Santos Vasconcelos",
        "Antônio César Vasconcelos Da Silva",
        "Arthur Pauvels",
        "Augusto Herlyn Antunes Rodrigues",
        "Carlos Miguel Mello Germann",
        "Cauã da Silva Indicatti",
        "Cesar Luis Zerpa Piñero",
        "Danny Gabriel Yepez Garcia",
        "Eduardo Daniel Brancher Amaral",
        "Gabriel de Castro Fernandes",
        "Gabriel Schaefer De Anhaia",
        "Gabriel Silva De Moraes",
        "Guilherme Brocardo Rossatto",
        "Henrique Rodrigues Pereira",
        "Juan Thiago Lopes Ribeiro",
        "Lucas Debiasi Hemann",
        "Lucas Oliveira dos Santos",
        "Luís Otávio Rodrigues de Almeida",
        "Matheus Borges",
        "Matheus Stefani dos santos",
        "Mikael Souza Santos",
        "Samuel Jesus Gómez Pino",
        "Samuel Rizzon De Macedo",
        "Victor Gaspari Xavier",
        "Vitor Emanuel Borges da Silva",
        "Vitor Von Mulhen Da Silva",
        "CARLOS EDUARDO FERNANDES FIALHO",
        "Augusto Carrer Cislaghi"
    ],
    "VOLEI_SUB_13_LR_TERCA_18H30": [
        "Alice Camera Bernal",
        "Ana Júlia Jacobsen",
        "Beatriz Fogiato da Silva",
        "Brenda de Oliveira Ferreira",
        "Emilly Pasquali Galbari",
        "Giovana Pelizza de Almeida",
        "Isabela Sotoriva de Carvalho Serafini",
        "Isabelle Duarte Borges Bastian",
        "Juliana Sotoriva de Carvalho Serafini",
        "Letícia Maria Bado",
        "Rafaela Zattera",
        "AILCIA SHÄFER",
        "JOANA CUNHA CORLATTI"
    ],
    "VOLEI_SUB_13_AZ_QUARTA_18H30": [
        "Alice Camera Bernal",
        "ANA JÚLIA JACOBSEN",
        "Brenda de Oliveira Ferreira",
        "GIOVANA PELIZZA DE ALMEIDA",
        "Igor Lisboa da Silva",
        "Isabela Sotoriva de Carvalho Serafini",
        "Isabelle Duarte Borges Bastian",
        "Isabelly Amaral Santos",
        "João Victor Amaral da Silva",
        "Julia Saraiva Gubert",
        "Juliana Sotoriva de Carvalho Serafini",
        "Kamilly oliveira da Rosa",
        "Letícia Maria Bado",
        "Luiza de Camargo Ribeiro",
        "Maitê Gabrielle Pinheiro Tragansin",
        "Rafaela DallAsta Jardim",
        "Sophia Ellen Araújo dos Santos Ramos"
    ],
    "VOLEI_SUB_16_AZ_QUARTA_20H": [
        "Adma Acza Lopes",
        "Anna Helena da Rosa Silva",
        "Camila Godoi Brustolin",
        "Carlos Eduardo Batista de Lima Mari",
        "Elizama Almeida da Silva",
        "Emanuelle Valentina Martins de Mattos",
        "Evelyn Gazolla",
        "Fernanda da Rosa Ávila",
        "Gustavo Rampon Flores",
        "Helena Zilio Severo",
        "Iasmin Rodrigues Dias",
        "Jennifer Colussi Blauth",
        "Julia Moncks Rodrigues",
        "Kauã Oliveira Porto",
        "Laura Casarotto de Moraes",
        "Laura Godoi Wentz",
        "Maria Eduarda da Silva da Rosa",
        "Maria Eduarda Martins Morais",
        "Mariana Flores de Araujo",
        "Mateus Kilder Guedes",
        "Matheus Stefani dos Santos",
        "Nathalia Ribeiro Melara",
        "Vitória Sipp Carvalho Pereira"
    ],
    "VOLEI_SUB_13_NE_QUINTA_18H30": [
        "Alexia Koltz",
        "Ana Clara Servelin",
        "Emily da Silva Camassola",
        "Guilherme Pereira Santos",
        "Heloisa Gassen Lazzari",
        "Henry de Oliveira Campos",
        "Igor Lisboa da Silva",
        "Isabelly Amaral santos",
        "Marco Antônio Trevisol",
        "Nicole Base da Silva Machado",
        "Rafael de Oliveira Schmitt",
        "Samuel Paim Barea",
        "Sophia Ellen Araújo dos Santos Ramos"
    ],
    "VOLEI_SUB_17_NE_QUINTA_20H": [
        "Ana Clara Germann justin",
        "Ana Laura Gomes Rodrigues",
        "Arthur Silva Ramos",
        "Carlos Eduardo Basso",
        "Carlos Eduardo Batista de Lima Mari",
        "Carolina da Silva Grisa",
        "Elizama Almeida da Silva",
        "Érick De Dordi Albino",
        "Evelyn Gazolla",
        "Giovana Lisboa da Silva",
        "Graziele Knob",
        "Gustavo de Oliveira Lopes do Couto",
        "Gustavo Rampon Flores",
        "Iasmin Rodrigues Dias",
        "Jeliel da Luz Garcia",
        "Julia Moncks Rodrigues",
        "Julia Paim Barea",
        "Kauã Oliveira Porto",
        "Luiza Helena Schussler Bizol",
        "Mateus Kilder Guedes",
        "Vitória Heloísa Barchfelde",
        "Nicolas Brando"
    ],
    "VOLEI_SUB_13_FM_SABADO_9H": [
        "Adrielly Córdova Macêdo",
        "Davi Lucca Schiam Londero",
        "Lívia Schiam Londero",
        "Júlia Machado de Lucena",
        "Larissa Decesare",
        "Lorenzo Lauksen Hofmam",
        "Luiza Dambros",
        "Rafael de Oliveira Schmitt",
        "Thaise de Oliveira Branco"
    ],
    "SUB_07_FM_QUINTA_20H": [
        "Arthur Gomes Sene",
        "Bernardo Stuani da Rosa",
        "Davi Lober Panegalli",
        "Guilherme Colussi da Costa",
        "Isaac Ramires da Silva",
        "Lorenzo cruz da Silveira",
        "Luiz Arthur Pereira de Freitas",
        "Martín Maciel Rabe",
        "Miguel Silva de Camargo",
        "Nicolas Moreira",
        "João Paulo da Silva",
        "LORENZO DOMINGUES SCARTÃO",
        "PIETRO FRIZZO BORTOLOTO",
        "MIGUEL ROSSATO PRIGOL"
    ],
    "SUB_09_FM_QUINTA_19H": [
        "Bernardo de Aquino Bielinki",
        "Davi Bacher Lopes",
        "Davi Lucca Schiam Londero",
        "Lívia Schiam Londero",
        "Gabriel da Costa",
        "Ian Gabriel Ferreira",
        "Joaquim Sturmer da Silva",
        "Juan Velasque Bueno",
        "Marcos André Arrieta Guimarães",
        "Nicolas Cardone Almeida",
        "Rodrigo M Santos",
        "Théo Michelon Müller"
    ],
    "SUB_07_09_FM_SABADO_10H": [
        "Arthur Gomes Sene",
        "Bernardo de Aquino Bielinki",
        "Bernardo Decesare",
        "Ian Gabriel Ferreira",
        "Pedro Henrique Ferreira Neto",
        "Rafael Neto dos Reis",
        "Rodrigo M Santos"
    ],
    "SUB_11_FM_TERCA_19H30": [
        "Arthur R Rossetto",
        "Bernardo Constante da Silva",
        "Erick Conceição da Rosa",
        "GABRIEL CAMPOS GARCIA",
        "Guilherme Lourenço dos Santos",
        "Lucca de Castro Fernandes",
        "Matheus Schuster Pinto",
        "Miguel Ramos Calabuig",
        "Thomás Martini Pezzi",
        "Victor Pietro Hermann Settin",
        "Wéllinton Pinto da Silva"
    ],
    "SUB_11_FM_SABADO_11H": [
        "Guilherme Lourenço dos Santos",
        "Kauay Martins Saraiva"
    ],
    "SUB_13_FM_TERCA_18H30": [
        "Anna Clara Turatti",
        "Guilherme Silveira Schneider",
        "Henrique Noronha Maciel",
        "Lucas de Souza Leoni",
        "Lucas Domingues Bandeira",
        "Lucas Vieira Queiroz",
        "Luis Otávio Colombo de Castilhos",
        "Nathan Fernandes Dutra",
        "Vinicius Pereira Souza"
    ],
    "SUB_13_FM_SABADO_11H": [
        "Lucas Vieira Queiroz"
    ],
    "SUB_15_17_FM_TERCA_20H30": [
        "Arthur Pauvels",
        "Bruno Flores Peruzzo",
        "Frederico Boff Frizzo",
        "Gabriel de Castro Fernandes",
        "Gabriel Weinfortner de Jesus",
        "Leonardo Silveira Santos",
        "Rafael Borges Hoffmann"
    ],
    "SUB_07_NE_SEGUNDA_19H": [
        "Arthur Ribeiro Miranda",
        "Eduardo Koltz",
        "Martina de Castilhos",
        "Miguel Rodrigues",
        "Murilo Bitencourt Cavalheiro",
        "Nicolas Misturini Miranda"
    ],
    "SUB_09_NE_TERCA_20H": [
        "Adrian Da Cruz Moraes",
        "Arthur Barros Marques",
        "Bernardo Antonio Pertile Borges",
        "Henrique Francisquetti Barêa",
        "Leonardo Lima Machado",
        "Luiz Gustavo Rodrigues",
        "Matheus Venzon Adami",
        "Miguel de Carvalho",
        "Miguel Menegotto Fonseca",
        "Nicolas Cardone Almeida",
        "Otávio de Oliveira Oliveira",
        "Vicente Hans Dal Magro",
        "Wendell Vieira Endres"
    ],
    "SUB_09_NE_SEXTA_19H": [
        "Adrian Da Cruz Moraes",
        "Arthur Barros Marques",
        "Arthur de Paula dos Santos",
        "Arthur Zenato Scolaro",
        "Bernardo Antonio Pertile Borges",
        "Bernardo Fogaça de Almeida Manique",
        "Bernardo Lima Rodrigues",
        "Cauã Matheus Acorsi Fernandes",
        "Davi Gaio",
        "Leonardo Lima Machado",
        "Luiz Gustavo Rodrigues",
        "Matheus Venzon Adami",
        "Micael Ragnini dos Reis",
        "Miguel de Carvalho",
        "Otávio Chagas",
        "Otávio de Oliveira Oliveira",
        "Vicente Hans Dal Magro"
    ],
    "SUB_11_NE_TERCA_18H": [
        "Arthur Beje Dos Reis",
        "Eduardo Rodrigues Camassola",
        "Felipe Nunes Godinho",
        "José Henrique Germann Justin",
        "Pablo Gabriel Knevitz Haccourt",
        "Pedro dos Santos Custodio",
        "Pietro Silva da Costa",
        "Samuel Paim Barea",
        "Vinícius Gabriel Rodrigues ferrando",
        "Leonardo Amândio Bissani",
        "Vinícius Misturini Miranda"
    ],
    "SUB_11_NE_SEXTA_20H": [
        "Bento Brambilla Bianchi",
        "Eduardo Rodrigues Camassola",
        "Felipe Nunes Godinho",
        "José Henrique Germann Justin",
        "Luan Branco De Oliveira",
        "Miguel da Silva Busnello",
        "Miguel Ramos Calabuig",
        "Pablo Gabriel Knevitz Haccourt",
        "Pedro da Silva Busnello",
        "Pietro Silva da Costa",
        "Theo de Almeida Savionek",
        "Victor Pietro Hermann Settin",
        "Vinícius Gabriel Rodrigues Ferrando",
        "Gabriel Campos Garcia"
    ],
    "SUB_13_NE_SEGUNDA_18H": [
        "Jhonatan Silva Da Costa",
        "Gustavo de Souza Pires",
        "Gabriel Eduardo de Matos",
        "Rafael Machado",
        "Enzo Gabriel Oliveira de Souza",
        "Samuel dos Santos Marques",
        "Alysson Andrei Lima Ribeiro",
        "Antony Silva da Costa",
        "Carlos Eduardo Barros Marques",
        "Cassino Scheffer Dauinheimer",
        "Davi Schmeier",
        "Emanuel Tobias Nunes",
        "Gabriel Spiandorello Lazzarotto",
        "Gustavo de Gasperi Bagatini",
        "Lorenzo Bresolin da Silva",
        "Miguel Rafael dos Santos Pereira",
        "Rafael Knevitz",
        "Rian Sousa",
        "Victor Oliveira e Silva",
        "William Matheus Dutra",
        "Deivd da Silva Noronha"
    ],
    "SUB_13_NE_TERCA_19H": [
        "Alysson Andrei Lima Ribeiro",
        "Antony Silva da Costa",
        "Carlos Eduardo Barros Marques",
        "Daniel Rodrigues Pacheco",
        "Enzo Gabriel Oliveira de Souza",
        "Gabriel Spiandorello Lazzarotto",
        "Gustavo de Gasperi Bagatini",
        "Gustavo de Souza Pires",
        "Israel Duarte Rizzotto",
        "Lukas Eduardo Santos de Oliveira",
        "Nicolas Daniel Nunes Bado",
        "Pedro Henrique Leal Chagas",
        "Rafael Knevitz"
    ],
    "SUB_13_NE_SEXTA_17H": [
        "Carlos Eduardo Barros Marques",
        "Cassino Scheffer Dauinheimer",
        "Deivd da Silva Noronha",
        "Enzo Gabriel Oliveira de Souza",
        "Gabriel Eduardo de Matos",
        "Jhonatan Silva da Costa",
        "Miguel Rafael dos Santos Pereira",
        "Rafael Machado",
        "Samuel dos Santos Marques",
        "William Matheus Dutra"
    ],
    "SUB_15_17_NE_SEGUNDA_20H": [
        "Bruno Flores Peruzzo",
        "Cauã da Silva Indicatti",
        "Davi Vilela Moia Wille",
        "Érick Toledo Godinho",
        "Gabriel Silva De Moraes",
        "Guilherme Brocardo Rossatto",
        "Guilherme Toledo Santos",
        "Henrique Santana Silva",
        "Leonardo Altino de Freitas",
        "Pietro DAvila Mallmann",
        "Tayla Alana Martins Trapaga"
    ],
    "SUB_15_17_NE_SEXTA_18H": [
        "Cauã da Silva Indicatti",
        "Davi Vilela Moia Wille",
        "Érick Toledo Godinho",
        "Guilherme Toledo Santos",
        "Leonardo Altino de Freitas",
        "Tayla Alana Martins Trapaga",
        "Frederico Boff Frizzo"
    ],
    "SUB_07_LR_QUARTA_17H30": [
        "Davi Eduardo Vencato de Freitas",
        "Nicolas Moreira",
        "Pietro Batista de Lima Machado"
    ],
    "SUB_07_LR_SEXTA_19H30": [
        "Enrico Menegat",
        "GUSTAVO DE MORAIS",
        "Joaquim Alves Botelho",
        "Miguel Paim",
        "Pietro Batista de Lima Machado"
    ],
    "SUB_09_LR_SEGUNDA_19H30": [
        "Bruno Renato Schmitz Gusmão",
        "Davi Gaio",
        "João Emanuel de Souza Vieira",
        "João Vitor Silveira de Oliveira",
        "Miguel Ramos Butka",
        "Pedro Gonçalves Antunes",
        "Pedro Ilha Lorandi",
        "HENRIQUE MIGUEL MENDES LAHN",
        "GABRIEL GONÇALVES MACEDO"
    ],
    "SUB_09_LR_QUARTA_18H30": [
        "Anthony de Lima Silveira",
        "Benjamin Menzen Padilha",
        "Felipe Magalhães Bordagorry",
        "Leonardo Cherobin",
        "Lorenzo Nunes Adamski",
        "Lucas Casarotto de Moraes",
        "Lucas Sotoriva de Carvalho Serafini",
        "Luis Henrique Machado Leal",
        "Pedro Henrique Damin Martins",
        "Tiago Casarotto de Moraes",
        "GABRIEL GONÇALVES MACEDO"
    ],
    "SUB_11_LR_SEGUNDA_18H30": [
        "Arthur Marcon da Silva",
        "Bianca Ventura Vieira",
        "Brian Gehdini Merib",
        "Cauã Velho Santos da Silva",
        "Davi lauermann Tondin",
        "Eduardo Rodrigues de Moraes",
        "Enzo Pereira Rodrigues",
        "Felipe Barreto",
        "Guilherme Biazus Soares Bitencourt",
        "Lorenzo Machado Macedo",
        "Luan Fernando Moreira",
        "Luís Gustavo Herbert de Lima",
        "Luís Miguel Morais de Assumpção",
        "Marcelo Sebastian Leal Linares",
        "Miguel Biazus",
        "Murilo Borges da Silva",
        "Nicolas Silva de Lima",
        "Pedro Antônio Sanchotene de Deus",
        "Pedro Henrique Klipel",
        "Pietro Godoi Meurer",
        "Rafael da Silva Grauncke",
        "Rafael Smoktunowicz de Almeida",
        "Vítor Visentin Dani"
    ],
    "SUB_11_LR_SEXTA_18H30": [
        "Arthur Marcon da Silva",
        "Bianca Ventura Vieira",
        "Brian Gehdini Merib",
        "Cauã Velho Santos da Silva",
        "Davi Prux",
        "Eduardo da Silva Bordagorry",
        "Eduardo Rodrigues de Moraes",
        "Guilherme Rech Gobetti",
        "Lorenzo Machado Macedo",
        "Luan Fernando Moreira",
        "Luís Gustavo Herbert de Lima",
        "Luís Miguel Morais de Assumpção",
        "Matheus Bueno Gossler",
        "Miguel de Lima Vargas",
        "Murilo Borges da Silva",
        "Nicolas Silva de Lima",
        "Pedro Henrique Klipel",
        "Pietro Godoi Meurer",
        "Rafael Smoktunowicz de Almeida",
        "Vítor Brancher Amaral"
    ],
    "SUB_13_LR_SEGUNDA_17H30": [
        "Dimas Branco de Sales",
        "Eduardo s Silveira Costa",
        "Enzo Gabriel De Oliveira Lima",
        "Erik Pavelski Piekatoski",
        "Henrique Somacal",
        "Lázaro Stefenon Rita",
        "Pedro Henrique Montemezzo Grisa",
        "Pedro Henrique Visentin Dani",
        "Thomas Luís Kunde Bueno",
        "Victor Carlos Lima de Oliveira",
        "IGOR ANDRES MOREIRA",
        "Arthur Martins De Jesus Neto"
    ],
    "SUB_13_LR_QUARTA_19H30": [
        "Arthur Gomes Nunes",
        "Bryan Preuss das Chagas",
        "Eduardo Soares Cruz",
        "Henrique Somacal",
        "João Pedro da Rocha Ribeiro",
        "Leonardo Fernandes Guerreiro",
        "Lucas Modena Sousa",
        "Luís Felipe Sachet de Souza",
        "Lukas Eduardo Santos de Oliveira",
        "Murilo Trebin Mario",
        "Nicolas Kuijven Pereira",
        "Pedro Henrique Visentin Dani",
        "Ruan Miguel dos Santos Silva",
        "Victor Carlos Lima de Oliveira",
        "Victor Oliveira e Silva"
    ],
    "SUB_13_LR_SEXTA_17H30": [
        "Bryan Preuss das Chagas",
        "Dimas branco de Sales",
        "Eduardo s Silveira Costa",
        "Enzo Gabriel De Oliveira Lima",
        "Erik Pavelski Piekatoski",
        "Lázaro Stefenon Rita",
        "Lucas Daniel da Silva",
        "Murilo Trebin Mario",
        "Nicolas Kuijven Pereira",
        "Pedro Henrique Montemezzo Grisa",
        "Ruan Miguel dos Santos Silva",
        "Thomas Luís Kunde Bueno",
        "Victor Carlos Lima de Oliveira"
    ],
    "SUB_15_17_LR_QUARTA_20H30": [
        "VICTOR MIGUEL FINIMUNDI DA ROSA",
        "Allan Augusto Grolli",
        "Arthur de Ávila Dani",
        "Iuri dos Santos Campanharo",
        "Joao Paulo Dorneles Parnoff",
        "João Vitor Gandini Mendes",
        "Murilo Macedo De Souza",
        "Samuel Rizzon De Macedo",
        "Vitor De Morais Krein",
        "Vitor Vn Mulhen Da Silva",
        "Vitthor Mannoel De Oveira Espíndola"
    ],
    "SUB_15_17_LR_SEXTA_20H30": [
        "Allan Augusto Grolli",
        "Arthur de Ávila Dani",
        "Arthur Marley Petrini Witt Fagundes",
        "Eduardo Daniel Brancher Amaral",
        "Eduardo Luiz Francescon Kochhann",
        "Joao Paulo Dorneles Parnoff",
        "João Vitor Gandini Mendes",
        "Matheus Stefani dos Santos",
        "Murilo Macedo de Souza",
        "VICTOR MIGUEL FINIMUNDI DA ROSA",
        "RAFAEL FAGUNDES Ferreira"
    ],
    "SUB_07_JG_SEGUNDA_20H": [
        "Andrey Gonçalves",
        "Arthur Miguel da Rosa Machado",
        "Bernardo da Silva Leão",
        "Miguel Paim"
    ],
    "SUB_09_JG_QUARTA_20H": [
        "Alice Miranda Perottoni",
        "Bryan Dal Molin Moura",
        "Davy Luan dos Santos Soccol",
        "Gabriel Alexsander Cappelletti Costa",
        "João Emanuel de Souza Vieira",
        "Joaquim Sturmer da Silva",
        "Maria Clara Miranda Costa",
        "Murilo Altamiranda Kulmann",
        "Nicolas Correa da Silva Leão",
        "Rafael Colombo Valentini",
        "Vinícius Valentini Peres",
        "MATHEUS BRUNETTA CONTERATO"
    ],
    "SUB_09_JG_SEXTA_19H": [
        "Bryan Dal Molin Moura",
        "Gabriel Alexsander Cappelletti Costa",
        "Leonardo Gomes Piontkoski",
        "Murilo Altamiranda Kulmann",
        "Nicolas Correa da Silva Leão",
        "Vinícius Valentini Peres"
    ],
    "SUB_11_JG_SEGUNDA_19H": [
        "Arthur Luiz Justen",
        "Bernardo Henrique Cecatto",
        "Bernardo Miguel Endres Zabloski",
        "Érick Pires Borges",
        "Francisco Maciel Balbinot",
        "João Gabriel Menzen Luchini",
        "Lorenzo Corrêa Picollo",
        "Lucas Grazziotin da Silva",
        "Murilo André Camassola Pandolfi",
        "Pedro Antônio Sanchotene de Deus",
        "Yan Scarpin Volpatto",
        "FRANCISCO ARIEL MUELLER DE OLIVEIRA"
    ],
    "SUB_11_JG_QUARTA_19H": [
        "Arthur Luiz Justen",
        "Bernardo Henrique Cecatto",
        "Bernardo Miguel Endres Zabloski",
        "Carlos Eduardo de Souza Tenutis",
        "Érick Pires Borges",
        "Francisco Maciel Balbinot",
        "Hector Barbosa Battocchio",
        "João Gabriel Menzen Luchini",
        "Lorenzo Corrêa Picollo",
        "Lorran Merlini da Silva",
        "Lucas Grazziotin da Silva",
        "Murilo André Camassola Pandolfi",
        "Pedro Antônio Sanchotene de Deus",
        "Yan Scarpin Volpatto",
        "FRANCISCO ARIEL MUELLER DE OLIVEIRA"
    ],
    "SUB_13_JG_SEGUNDA_18H": [
        "Bernardo Padilha Dos Santos",
        "Davi de Gasperi Verona",
        "Diogo Saimon Pertile de Miranda",
        "Gabriel Antonio Concato Machado",
        "Hernan Jeferson dos Santos Lima",
        "Lucas Fernando Santos Zambrano",
        "Pedro Rodrigues Deantoni",
        "Rafael Guerra Cavagnoli",
        "Vitor Storqui Cappeletti"
    ],
    "SUB_13_JG_SEXTA_18H": [
        "Bernardo Padilha Dos Santos",
        "Diogo Saimon Pertile de Miranda",
        "Gabriel Antonio Concato Machado",
        "Hernan Jeferson dos Santos Lima",
        "Lucas de Oliveira",
        "Lucas Fernando Santos Zambrano",
        "Rafael Guerra Cavagnoli",
        "Tiago Debiasi Hemann",
        "Vitor Storqui Cappeletti"
    ],
    "SUB_15_17_JG_QUARTA_18H": [
        "Alberth Ferreira Bremm",
        "Anthony dos Santos Vasconcelos",
        "Bernardo Broilo Perottoni",
        "Eraldo Oliveira Batista Júnior",
        "Ezequiel Oliveira de Azevedo",
        "Gabriel Isoppo",
        "Ithalo Vinícius Torres Nogueira",
        "Lucas Debiasi Hemann",
        "Nikolas Bitencourt Marzullo",
        "Renato Sena Lima",
        "Thiago Luchese",
        "Thomas Luchese"
    ],
    "SUB_15_17_JG_SEXTA_20H": [
        "Alberth Ferreira Bremm",
        "Anthony dos Santos Vasconcelos",
        "Bernardo Broilo Perottoni",
        "Eraldo Oliveira Batista Júnior",
        "Ezequiel Oliveira de Azevedo",
        "Gabriel Isoppo",
        "Ithalo Vinícius Torres Nogueira",
        "Lucas Debiasi Hemann",
        "Nikolas Bitencourt Marzullo",
        "Renato Sena Lima",
        "Thiago Luchese",
        "Thomas Luchese"
    ],
    "SUB_07_AZ_TERCA_19H30": [
        "Davi Eduardo Vencato de Freitas",
        "Eduardo Calvino Pedroso",
        "Enrico Menegat",
        "Guilherme Colussi da Costa",
        "Guilherme Zago da Rosa",
        "Gustavo de Morais",
        "Joaquim Alves Botelho",
        "Lorenzo Lovatto Cislaghi",
        "Miguel Schleder Vasconcelos",
        "Miguel Paim",
        "Nicolas Moreira",
        "Vicente Machado",
        "Victor da Silva Gomes",
        "Vitor Alves Machado",
        "Vitor Machado",
        "JOÃO MIGUEL PELIZZA MARQUES",
        "GAEL DARCI MACHADO SOSTISSO",
        "PIETRO MACHADO DA SILVA"
    ],
    "SUB_07_AZ_QUINTA_17H30": [
        "Davi Eduardo Vencato de Freitas",
        "Victor da Silva Gomes"
    ],
    "SUB_09_AZ_QUARTA_17H30": [
        "Arthur da Silva da Rocha",
        "Gabriel Langaro",
        "Gabriel Lemos dos Passos",
        "Lorenzo de Oliveira",
        "Lorenzo Moraes Soares",
        "Lucas Guindo da Rocha"
    ],
    "SUB_09_AZ_QUINTA_19H30": [
        "Arthur Castilho Velho",
        "Bernardo Fogaça de Almeida Manique",
        "Bruno Renato Schmitz Gusmão",
        "Carlos Eduardo Franzen Borges",
        "João Emanuel de Souza Vieira",
        "Lorenzo de Oliveira",
        "Lorenzo Moraes Soares",
        "Lucas Sotoriva de Carvalho Serafini",
        "Miguel Correa Machado",
        "Miguel Menegotto Fonseca",
        "Miguel Ramos Butka",
        "Pedro Gonçalves Antunes",
        "Vicente Pretto",
        "ANTHONY MOREIRA DOS SANTOS",
        "Miguel Alves Botelho"
    ],
    "SUB_11_AZ_TERCA_17H30": [
        "Alef Feijó de Oliveira",
        "Artur dos Santos Pacheco",
        "Augusto Laureano Palavro",
        "Benjamim Pavão da Costa",
        "Bernardo Guedes Marsile",
        "Davi Borges de Oliveira",
        "Gabriel Moreira Lima",
        "Gabriel Pisoni Brandão",
        "Gustavo Petineli Machado",
        "Henrique Sasset Zanette",
        "Iago de Oliveira Lemos",
        "Luan Branco De Oliveira",
        "Matheus de Ramos Figueiró",
        "Thalles Cavion Borba",
        "Theo dos Santos Rodrigues",
        "Vicenti kornowski",
        "Wesley Moreira da Silva",
        "ARTHUR DE ALMEIDA SANTOS"
    ],
    "SUB_11_AZ_QUINTA_18H30": [
        "Alef Feijó de Oliveira",
        "Bernardo Guedes Marsile",
        "Davi Borges de Oliveira",
        "Davi lauermann Tondin",
        "Enzo Pereira Rodrigues",
        "Felipe Barreto",
        "Gabriel Moreira Lima",
        "Gabriel Pisoni Brandão",
        "Gustavo Petineli Machado",
        "Henrique Sasset Zanette",
        "Iago de Oliveira Lemos",
        "Jhonatan Ferreira Nunes",
        "Kauã Rodrigues Nadalon",
        "Kauan Rodrigues da Silva Lara",
        "Leonardo Amândio Bissani",
        "Luis Henrique De Souza Nunes",
        "Matheus de Ramos Figueiró",
        "Pedro Antônio Sanchotene de Deus",
        "Talles Mathias Janes Andrade",
        "Thalles Cavion Borba",
        "Vítor visentin Dani",
        "Wesley Moreira da Silva"
    ],
    "SUB_11_AZ_SEXTA_19H30": [
        "Eduardo Bitencourt Camargo",
        "Jhonatan Ferreira Nunes",
        "Kauã Rodrigues Nadalon",
        "Kauan Rodrigues da Silva Lara",
        "Luis Henrique De Souza Nunes",
        "Lukas Daniel Borges Gomes",
        "Talles Mathias Janes Andrade",
        "Vicenti Kornowski",
        "ARTHUR DE ALMEIDA SANTOS"
    ],
    "SUB_13_AZ_TERCA_18H30": [
        "Arthur Kerber",
        "Arthur Samuel Slongo",
        "Caio Langaro",
        "Dalessandro Arenhardt Machado",
        "Gabriel Colle",
        "Gabriel Fogaça de Almeida Manique",
        "Guilherme Balico de Almeida",
        "João Bernardo Rohr Carnietto",
        "João Pedro da Rocha Ribeiro",
        "Lucas Zuanazzi",
        "Miguel do Nascimento Blume",
        "Rafael Bassanesi Neivel",
        "Vinicius Grassi"
    ],
    "SUB_13_AZ_QUINTA_20H30": [
        "Arthur Levandoski Pereira",
        "Arthur Rodrigues de Souza",
        "Dalessandro Arenhardt Machado",
        "Guilherme Baloco de Almeida",
        "Guilherme Stanki da Silva",
        "Gustavo Luis Bianchi",
        "Israel Duarte Rizzotto",
        "João Bernardo Rohr Carnietto",
        "Lucas Zuanazzi",
        "Marcelo Ávila",
        "Rafael Rankrappes dos Santos",
        "Diulia Victoria da Silva Ferreira"
    ],
    "SUB_13_AZ_SEXTA_17H30": [
        "Arthur Kerber",
        "Arthur Levandoski Pereira",
        "Arthur Samuel Slongo",
        "Daniel Rodrigues Pacheco",
        "Gabriel Colle",
        "Gabriel Fogaça de Almeida Manique",
        "Gustavo Luis Bianchi",
        "Murilo Lemos dos Passos",
        "Nicolas Rhaikonem Maltauro",
        "Rafael Bassanesi Neivel",
        "Ryan Hendrio do Carmo Silva",
        "Valdecir da Rosa Junior",
        "Vinicius Grassi",
        "FELIPE DA SILVA NERES"
    ],
    "SUB_15_17_AZ_TERCA_20H30": [
        "Antônio César Vasconcelos Da Silva",
        "Cristhian Telles de Castro",
        "Diulia Victoria da Silva Ferreira",
        "Estefany Moreira da Silva",
        "Gabriel de Carvalho",
        "Guilherme da Silva Guimarães",
        "Lucas de Paula dos Santos",
        "Lucas Oliveira dos Santos",
        "Luís Otávio Rodrigues de Almeida",
        "Miguel Rankrappes dos Santos",
        "Nycolas Otávio Lenhardt Rodrigues",
        "Vitor Arenhardt Montemesso",
        "Vitor de Morais Krein",
        "Rodrigo Gauer dos Santos"
    ],
    "SUB_15_17_AZ_SEXTA_18H30": [
        "Antônio César Vasconcelos Da Silva",
        "Cristhian Telles de Castro",
        "Estefany Moreira da Silva",
        "Gabriel de Carvalho",
        "Gabriel Silva de Moraes",
        "Guilherme da Silva Guimarães",
        "Henrique Schmit Freski",
        "Lucas Oliveira dos Santos",
        "Luís Otávio Rodrigues de Almeida",
        "Mikael Souza Santos",
        "Nycolas Otávio Lenhardt Rodrigues",
        "Samuel Rizzon de Macedo",
        "Victor Gaspari Xavier",
        "Vinicius Dalberto dos Santos",
        "Vitor Arenhardt Montemesso",
        "Rodrigo Gauer dos Santos"
    ]
};


function normalizarNome(nome) {
    return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function gerarDiasDoMes(ano, mes, diaDaSemana) {
    let datas = [];
    let data = new Date(ano, mes, 1);
    while (data.getDay() !== diaDaSemana) {
        data.setDate(data.getDate() + 1);
    }
    while (data.getMonth() === mes) {
        let diaFormatado = `${data.getDate()}-${mes + 1}-${ano}`;
        datas.push(diaFormatado);
        data.setDate(data.getDate() + 7);
    }
    return datas;
}

function adicionarPresencas(turmas) {
    const diaDaSemana = {
        "SEGUNDA": 1,
        "TERCA": 2,
        "QUARTA": 3,
        "QUINTA": 4,
        "SEXTA": 5,
        "SABADO": 6,
        "DOMINGO": 0
    };

    turmas.forEach(turma => {
        Object.keys(diaDaSemana).forEach(dia => {
            if (turma.nome_da_turma.includes(dia.toUpperCase())) {
                let presencas = {};
                for (let mes = 0; mes < 12; mes++) {
                    let nomeMes = new Date(2024, mes, 1).toLocaleString('pt-BR', { month: 'long' });
                    presencas[nomeMes] = {};
                    let dias = gerarDiasDoMes(2024, mes, diaDaSemana[dia]);
                    dias.forEach(data => {
                        presencas[nomeMes][data] = false;
                    });
                }
                turma.alunos = turma.alunos.map(aluno => ({ ...aluno, presencas }));
            }
        });
    });
}

function associarAlunosATurmas(alunos, dadosTurmas, mapeamento) {
    Object.keys(dadosTurmas).forEach(modalidade => {
        dadosTurmas[modalidade].turmas.forEach(turma => {
            turma.alunos = alunos.filter(aluno => 
                mapeamento[turma.nome_da_turma] &&
                mapeamento[turma.nome_da_turma].includes(normalizarNome(aluno.nome))
            );
            turma.capacidade_atual_da_turma = turma.alunos.length;
        });
    });
}

// Normaliza os nomes no mapeamento de turmas
Object.keys(mapeamentoTurmas).forEach(turma => {
    mapeamentoTurmas[turma] = mapeamentoTurmas[turma].map(normalizarNome);
});

// Associa alunos às turmas antes de adicionar as presenças
associarAlunosATurmas(alunos, dadosTurmas, mapeamentoTurmas);

// Adiciona presenças a todas as turmas
Object.keys(dadosTurmas).forEach(modalidade => {
    adicionarPresencas(dadosTurmas[modalidade].turmas);
});

// Grava o resultado em um novo arquivo JSON
fs.writeFile('turmasComAlunos.json', JSON.stringify(dadosTurmas, null, 2), err => {
    if (err) {
        console.error('Erro ao salvar o arquivo:', err);
        return;
    }
    console.log('Arquivo salvo com sucesso!');
});
