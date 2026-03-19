import { LoreGame } from './Game.js';
import { PESO_SEME } from './Card.js';

let game, difficolta;

// Espone la funzione globalmente per il pulsante HTML
window.iniziaPartitaVera = function() {
    const n = parseInt(document.getElementById('select-players').value);
    difficolta = document.getElementById('select-difficulty').value;
    game = new LoreGame(n);
    document.getElementById('setup-menu').style.display = "none";
    document.getElementById('game-area').style.display = "block";
    avviaNuovoGiro();
};

function avviaNuovoGiro() {
    game.distribuisci(); //
    aggiornaUI();
    procediLogica();
}

function procediLogica() {
    if (!game || !game.players[game.turnoAttuale]) return;
    let p = game.players[game.turnoAttuale];
    aggiornaUI();

    if (game.fase === "scommesse") {
        if (!p.isHuman) {
            setTimeout(() => {
                let qta = game.sequenzaTurni[game.indiceGiro];
                let s = calcolaScommessaIA(p, qta);
                // Vincolo Mazziere (Regola 19)
                if (game.turnoAttuale === game.indiceMazziere) {
                    if (game.sommaScommesse + s === qta) s = (s === 0) ? 1 : s - 1;
                }
                p.dichiarazione = s; 
                game.sommaScommesse += s; 
                passaTurno();
            }, 600);
        }
    } else if (game.fase === "gioco" && !p.isHuman) {
        setTimeout(() => {
            let manoV = p.mano.filter(c => !c.giocata);
            let cS = calcolaGiocataIA(p, manoV);
            giocaCartaLogica(game.turnoAttuale, p.mano.indexOf(cS));
        }, 800);
    }
}

function calcolaScommessaIA(p, qta) {
    if (difficolta === "easy") return Math.floor(Math.random() * (Math.floor(qta/2) + 1));
    if (qta === 1) {
        // Regola 9 (La Fronte): vede carta umano
        let cartaUmano = game.players[0].mano[0];
        if (difficolta === "hard") {
            let maxAltri = Math.max(...game.players.filter(x => x !== p).map(x => x.mano[0].forza));
            return (maxAltri > 400) ? 0 : 1;
        }
        return (cartaUmano.forza < 300) ? 1 : 0;
    }
    let forti = p.mano.filter(c => c.forza > 400).length;
    return Math.min(forti, Math.floor(qta/2) + 1);
}

function calcolaGiocataIA(p, mano) {
    let deveVincere = p.preseFatte < p.dichiarazione;
    if (game.tavolo.length > 0) {
        let semeMano = game.tavolo[0].card.seme;
        let seguono = mano.filter(c => c.seme === semeMano);
        if (seguono.length > 0) {
            seguono.sort((a,b) => b.forza - a.forza);
            return deveVincere ? seguono[0] : seguono[seguono.length-1];
        }
    }
    mano.sort((a,b) => b.forza - a.forza);
    return deveVincere ? mano[0] : mano[mano.length-1];
}

function passaTurno() {
    let tuttiScommesso = game.players.every(pl => pl.dichiarazione !== "-");
    if (tuttiScommesso) {
        game.fase = "gioco";
        game.turnoAttuale = (game.indiceMazziere + 1) % game.players.length;
    } else {
        game.turnoAttuale = (game.turnoAttuale + 1) % game.players.length;
    }
    procediLogica();
}

window.inviaDichiarazione = function() {
    let input = document.getElementById('bet-input');
    let v = parseInt(input.value);
    let qta = game.sequenzaTurni[game.indiceGiro];
    if (isNaN(v) || v < 0 || v > qta) return alert("Scommessa non valida!");
    if (game.turnoAttuale === game.indiceMazziere && (game.sommaScommesse + v === qta)) {
        return alert("Mazziere! Somma proibita.");
    }
    game.players[0].dichiarazione = v;
    game.sommaScommesse += v;
    passaTurno();
};

window.giocaCartaLogica = function(pIdx, cIdx) {
    if (game.fase !== "gioco" || game.turnoAttuale !== pIdx) return;
    let p = game.players[pIdx], c = p.mano[cIdx];
    if (c.giocata) return;
    if (game.tavolo.length > 0 && c.seme !== game.tavolo[0].card.seme && p.mano.some(x => !x.giocata && x.seme === game.tavolo[0].card.seme)) {
        if (p.isHuman) alert("Segui il seme!");
        return;
    }
    c.giocata = true; 
    game.tavolo.push({playerId: pIdx, card: c}); 
    aggiornaUI();
    if (game.tavolo.length === game.players.length) setTimeout(risolviPresa, 1000);
    else { game.turnoAttuale = (game.turnoAttuale + 1) % game.players.length; procediLogica(); }
};

function risolviPresa() {
    let v = game.calcolaVincitorePresa(); 
    alert("Presa di: " + game.players[v.playerId].nome);
    game.players[v.playerId].preseFatte++; 
    game.tavolo = []; 
    game.turnoAttuale = v.playerId;
    if (game.players[0].mano.every(c => c.giocata)) setTimeout(calcolaPuntiGiro, 500); 
    else procediLogica();
}

function calcolaPuntiGiro() {
    game.players.forEach(p => p.punti += p.preseFatte + (p.preseFatte === p.dichiarazione ? 8 : 0));
    game.indiceGiro++;
    if (game.indiceGiro >= game.sequenzaTurni.length) {
        let c = [...game.players].sort((a,b) => b.punti - a.punti);
        alert("FINALE:\n" + c.map((p,i)=>`${i+1}. ${p.nome}: ${p.punti}pt`).join("\n"));
        document.getElementById('game-area').style.display = "none";
        document.getElementById('setup-menu').style.display = "block";
    } else { 
        game.indiceMazziere = (game.indiceMazziere + 1) % game.players.length; 
        avviaNuovoGiro(); 
    }
}

function aggiornaUI() {
    if (!game) return;
    const q = game.sequenzaTurni[game.indiceGiro];
    const isT = (game.turnoAttuale === 0);
    document.getElementById('game-table').className = isT ? "your-turn" : "";
    document.getElementById('input-area').style.display = (game.fase === "scommesse" && isT) ? "inline" : "none";
    document.getElementById('turn-indicator').innerText = isT ? (game.fase === "scommesse" ? "SCOMMETTI" : "TOCCA A TE") : "ATTENDI...";
    document.getElementById('score-list').innerHTML = game.players.map(p => {
        let f = (q === 1 && !p.isHuman && !p.mano[0].giocata) ? `<div class="card mini seme-${p.mano[0].seme} val-${p.mano[0].valore}"></div>` : "";
        let m = (game.players.indexOf(p) === game.indiceMazziere) ? "🃏" : "";
        return `<div class="opponent-row"><b>${p.nome}${m}</b>: ${p.punti}<br>Obj: ${p.dichiarazione} ${f}</div>`;
    }).join("");
    document.getElementById('played-cards').innerHTML = game.tavolo.map(t => `<div class="card seme-${t.card.seme} val-${t.card.valore}"></div>`).join("");
    const hA = document.getElementById('my-hand'); hA.innerHTML = "";
    game.players[0].mano.forEach((c, idx) => {
        if (!c.giocata) {
            let d = document.createElement('div'); 
            d.className = (q === 1) ? "card card-back" : `card seme-${c.seme} val-${c.valore}`;
            d.onclick = () => giocaCartaLogica(0, idx); 
            hA.appendChild(d);
        }
    });
    document.getElementById('status-text').innerText = `Fase: ${game.fase.toUpperCase()} | Sum: ${game.sommaScommesse}`;
    document.getElementById('prese-fatte').innerText = game.players[0].preseFatte;
    document.getElementById('current-sum').innerText = game.sommaScommesse;
}