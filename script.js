/* --- CONFIGURAZIONE LOGICA --- */
const SEMI = ["Coppe", "Ori", "Bastoni", "Spade"];
const VALORI = ["Asso", "2", "3", "4", "5", "6", "7", "Fante", "Cavallo", "Re"];
const pesoSeme = { "Ori": 400, "Spade": 300, "Coppe": 200, "Bastoni": 100 };
const pesoValore = { "Asso": 12, "3": 11, "Re": 10, "Cavallo": 9, "Fante": 8, "7": 7, "6": 6, "5": 5, "4": 4, "2": 3 };

let punteggiGlobali = [], preseEffettuateGiro = [], dichiarazioniGiro = [];
let numeroGiocatori = 5, indiceMazziere = 0, indiceTurnoAttuale = 0;
let sequenzaTurni = [], maniGiocatori = [], carteInTavolaAttuali = [];
let faseDichiarazione = true, sommaDichiarazioniGlobali = 0, turnoGiocatore = 0;

/* --- AVVIO PARTITA --- */
window.iniziaPartitaVera = function() {
  numeroGiocatori = parseInt(document.getElementById('select-players').value);
  punteggiGlobali = new Array(numeroGiocatori).fill(0);
  document.getElementById('setup-menu').style.display = "none";
  document.getElementById('game-area').style.display = "block";
  indiceMazziere = Math.floor(Math.random() * numeroGiocatori);
  generaSequenza();
  nuovaMano(true);
}

function generaSequenza() {
  let max = Math.floor(40 / numeroGiocatori);
  sequenzaTurni = [];
  for (let i = 2; i <= max; i++) sequenzaTurni.push(i);
  for (let i = max - 1; i >= 2; i--) sequenzaTurni.push(i);
  sequenzaTurni.push(1);
}

function nuovaMano(isFirst = false) {
  if(!isFirst) { indiceTurnoAttuale++; indiceMazziere = (indiceMazziere + 1) % numeroGiocatori; }
  if (indiceTurnoAttuale >= sequenzaTurni.length) { 
    alert("Partita Terminata! Classifica finale nei punteggi.");
    return; 
  }
  
  let qta = sequenzaTurni[indiceTurnoAttuale];
  preseEffettuateGiro = new Array(numeroGiocatori).fill(0);
  dichiarazioniGiro = new Array(numeroGiocatori).fill("-");
  sommaDichiarazioniGlobali = 0;
  carteInTavolaAttuali = [];
  
  distribuisci(qta);
  renderizzaMano();
  avviaDichiarazioni();
}

function distribuisci(qta) {
  let mazzo = [];
  SEMI.forEach(s => VALORI.forEach(v => mazzo.push({
    valore: v, 
    seme: s, 
    forza: (pesoSeme[s] || 0) + (pesoValore[v] || 0), 
    giocata: false
  })));
  mazzo.sort(() => Math.random() - 0.5);
  maniGiocatori = Array.from({length: numeroGiocatori}, () => []);
  for(let i=0; i<qta; i++) for(let g=0; g<numeroGiocatori; g++) maniGiocatori[g].push(mazzo.pop());
}

/* --- GRAFICA CARTE --- */
function creaElementoCarta(c, nascosta = false) {
  let div = document.createElement('div');
  div.className = nascosta ? "card card-back" : `card seme-${c.seme} val-${c.valore}`;
  return div;
}

function renderizzaMano() {
  const area = document.getElementById('my-hand');
  const scoreArea = document.getElementById('score-list');
  area.innerHTML = "";
  
  scoreArea.innerHTML = punteggiGlobali.map((p, i) => {
    let mMark = (i === indiceMazziere) ? " 🃏" : "";
    let pres = (faseDichiarazione) ? "" : ` (Presi: ${preseEffettuateGiro[i]}/${dichiarazioniGiro[i]})`;
    return `<div>${i===0?'Tu':('CPU'+i)}${mMark}: <b>${p}</b>${pres}</div>`;
  }).join("");
  
  document.getElementById('prese-fatte').innerText = preseEffettuateGiro[0];

  maniGiocatori[0].forEach((c, idx) => {
    if(!c.giocata) {
      let div = creaElementoCarta(c, false); 
      div.onclick = () => giocaCarta(idx);
      area.appendChild(div);
    }
  });
}

/* --- LOGICA SCOMMESSE (DICHIARAZIONI) --- */
function avviaDichiarazioni() {
  faseDichiarazione = true;
  document.getElementById('current-sum').innerText = "0";
  aggiornaStatusDichiarazione();
  procediDichiarazione((indiceMazziere + 1) % numeroGiocatori);
}

function aggiornaStatusDichiarazione() {
  let status = "Scommesse: ";
  for(let i=0; i<numeroGiocatori; i++) {
    let mMark = (i === indiceMazziere) ? "(M)" : "";
    status += `[${i===0?'Tu':('CPU'+i)}${mMark}: ${dichiarazioniGiro[i]}] `;
  }
  document.getElementById('status-text').innerText = status;
}

function procediDichiarazione(t) {
  if (t === 0) {
    document.getElementById('input-area').style.display = "inline";
    if(indiceMazziere === 0) {
      let qtaMano = sequenzaTurni[indiceTurnoAttuale];
      let proibito = qtaMano - sommaDichiarazioniGlobali;
      console.log("Sei mazziere, non puoi dire: " + proibito);
    }
  } else {
    document.getElementById('input-area').style.display = "none";
    setTimeout(() => {
      let qtaMano = sequenzaTurni[indiceTurnoAttuale];
      let valAt = 0;
      maniGiocatori[t].forEach(c => {
        if(c.seme === "Ori") valAt += (pesoValore[c.valore]>=11?1:0.6);
        else if(c.seme === "Spade") valAt += (pesoValore[c.valore]>=11?0.5:0.2);
        else valAt += (pesoValore[c.valore]>=11?0.2:0);
      });
      
      let scommessa = Math.min(Math.round(valAt), qtaMano);
      if (t === indiceMazziere) {
        let proibito = qtaMano - sommaDichiarazioniGlobali;
        if (scommessa === proibito) scommessa = scommessa === 0 ? 1 : scommessa - 1;
      }
      
      dichiarazioniGiro[t] = scommessa;
      sommaDichiarazioniGlobali += scommessa;
      document.getElementById('current-sum').innerText = sommaDichiarazioniGlobali;
      aggiornaStatusDichiarazione();
      
      let prossimo = (t + 1) % numeroGiocatori;
      if (dichiarazioniGiro.includes("-")) procediDichiarazione(prossimo);
      else avviaGioco();
    }, 600);
  }
}

window.inviaDichiarazione = function() {
  let input = document.getElementById('bet-input');
  let v = parseInt(input.value);
  let qtaMano = sequenzaTurni[indiceTurnoAttuale];

  if (isNaN(v) || v < 0 || v > qtaMano) {
    return alert("Inserisci un numero valido tra 0 e " + qtaMano);
  }
  
  if (indiceMazziere === 0 && (sommaDichiarazioniGlobali + v) === qtaMano) {
    return alert("Mazziere! La somma non può fare " + qtaMano + ". Cambia scommessa.");
  }

  dichiarazioniGiro[0] = v;
  sommaDichiarazioniGlobali += v;
  document.getElementById('current-sum').innerText = sommaDichiarazioniGlobali;
  aggiornaStatusDichiarazione();
  
  if (dichiarazioniGiro.includes("-")) procediDichiarazione(1);
  else avviaGioco();
}

/* --- LOGICA DI GIOCO --- */
function avviaGioco() {
  faseDichiarazione = false;
  document.getElementById('input-area').style.display = "none";
  renderizzaMano(); 
  turnoGiocatore = (indiceMazziere + 1) % numeroGiocatori;
  if (turnoGiocatore !== 0) setTimeout(eseguiMossaCPU, 600);
}

function giocaCarta(idx) {
  if(faseDichiarazione || turnoGiocatore !== 0) return;
  let c = maniGiocatori[0][idx];
  
  if(carteInTavolaAttuali.length > 0) {
    let semeMano = carteInTavolaAttuali[0].carta.seme;
    if(c.seme !== semeMano && maniGiocatori[0].some(x => !x.giocata && x.seme === semeMano)) {
      return alert("Devi rispondere a " + semeMano + "!");
    }
  }
  
  c.giocata = true;
  carteInTavolaAttuali.push({id:0, carta:c});
  renderizzaMano();
  aggiornaTavolo();
}

function eseguiMossaCPU() {
  let mano = maniGiocatori[turnoGiocatore].filter(c => !c.giocata);
  let devoVincere = (preseEffettuateGiro[turnoGiocatore] < dichiarazioniGiro[turnoGiocatore]);
  let cartaScelta;

  if(carteInTavolaAttuali.length > 0) {
    let semeMano = carteInTavolaAttuali[0].carta.seme;
    let valide = mano.filter(c => c.seme === semeMano);
    if(valide.length > 0) {
      valide.sort((a,b) => b.forza - a.forza);
      cartaScelta = devoVincere ? valide[0] : valide[valide.length-1];
    } else {
      let ori = mano.filter(c => c.seme === "Ori");
      if(devoVincere && ori.length > 0) { 
        ori.sort((a,b) => b.forza - a.forza); 
        cartaScelta = ori[0]; 
      } else { 
        mano.sort((a,b) => a.forza - b.forza); 
        cartaScelta = mano[0]; 
      }
    }
  } else {
    mano.sort((a,b) => b.forza - a.forza);
    cartaScelta = devoVincere ? mano[0] : mano[mano.length-1];
  }
  
  cartaScelta.giocata = true;
  carteInTavolaAttuali.push({id:turnoGiocatore, carta:cartaScelta});
  aggiornaTavolo();
}

function aggiornaTavolo() {
  const tavola = document.getElementById('played-cards');
  tavola.innerHTML = "";
  carteInTavolaAttuali.forEach(x => tavola.appendChild(creaElementoCarta(x.carta)));
  
  if(carteInTavolaAttuali.length < numeroGiocatori) {
    turnoGiocatore = (turnoGiocatore + 1) % numeroGiocatori;
    if(turnoGiocatore !== 0) setTimeout(eseguiMossaCPU, 800);
  } else { 
    setTimeout(risolviPresa, 1200); 
  }
}

function risolviPresa() {
  let vincitore = carteInTavolaAttuali.reduce((migliore, attuale) => {
    let a = attuale.carta;
    let m = migliore.carta;
    if (a.seme === m.seme) return (a.forza > m.forza) ? attuale : migliore;
    if (pesoSeme[a.seme] > pesoSeme[m.seme]) return attuale;
    return migliore;
  });

  preseEffettuateGiro[vincitore.id]++;
  alert("Presa di: " + (vincitore.id === 0 ? "TE" : "CPU " + vincitore.id));
  
  turnoGiocatore = vincitore.id;
  carteInTavolaAttuali = [];
  document.getElementById('played-cards').innerHTML = "";
  renderizzaMano();

  if(maniGiocatori[0].every(c => c.giocata)) {
    setTimeout(calcolaPuntiMano, 500);
  } else {
    if(turnoGiocatore !== 0) setTimeout(eseguiMossaCPU, 600);
  }
}

function calcolaPuntiMano() {
  let report = "Fine Giro!\n";
  for(let i=0; i<numeroGiocatori; i++) {
    let nome = (i===0?"Tu":"CPU"+i);
    let obiettivo = dichiarazioniGiro[i];
    let fatte = preseEffettuateGiro[i];
    let puntiGuadagnati = 0;
    
    if(fatte === obiettivo) {
      puntiGuadagnati = fatte + 8;
      report += `${nome}: Preso! (+${puntiGuadagnati})\n`;
    } else {
      puntiGuadagnati = fatte;
      report += `${nome}: Sballato! (+${puntiGuadagnati})\n`;
    }
    punteggiGlobali[i] += puntiGuadagnati;
  }
  alert(report);
  nuovaMano();
}