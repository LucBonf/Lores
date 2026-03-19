import { Card, SEMI, VALORI, PESO_SEME } from './Card.js';
import { Player } from './Player.js';

export class LoreGame {
    constructor(numPlayers) {
        this.players = Array.from({length: numPlayers}, (_, i) => 
            new Player(i, i === 0 ? "Tu" : `CPU ${i}`, i === 0)
        );
        this.indiceMazziere = Math.floor(Math.random() * numPlayers);
        this.maxCarte = Math.floor(40 / numPlayers);
        this.sequenzaTurni = this.generaSequenza();
        this.indiceGiro = 0;
        this.tavolo = [];
        this.fase = "scommesse"; 
        this.turnoAttuale = 0;
        this.sommaScommesse = 0;
    }

    generaSequenza() {
        let seq = [];
        for (let i = 2; i <= this.maxCarte; i++) seq.push(i);
        for (let i = this.maxCarte - 1; i >= 2; i--) seq.push(i);
        seq.push(1);
        return seq;
    }

    distribuisci() {
        let mazzo = [];
        SEMI.forEach(s => VALORI.forEach(v => mazzo.push(new Card(v, s))));
        mazzo.sort(() => Math.random() - 0.5);
        let qta = this.sequenzaTurni[this.indiceGiro];
        this.players.forEach(p => {
            p.resetGiro();
            for (let i = 0; i < qta; i++) p.mano.push(mazzo.pop());
        });
        this.fase = "scommesse";
        this.turnoAttuale = (this.indiceMazziere + 1) % this.players.length;
        this.sommaScommesse = 0;
        this.tavolo = [];
    }

    calcolaVincitorePresa() {
        return this.tavolo.reduce((migliore, attuale) => {
            let a = attuale.card;
            let m = migliore.card;
            if (a.seme === m.seme) return (a.forza > m.forza) ? attuale : migliore;
            return (PESO_SEME[a.seme] > PESO_SEME[m.seme]) ? attuale : migliore;
        });
    }
}