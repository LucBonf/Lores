export class Player {
    constructor(id, nome, isHuman = false) {
        this.id = id;
        this.nome = nome;
        this.isHuman = isHuman;
        this.mano = [];
        this.punti = 0;
        this.dichiarazione = "-";
        this.preseFatte = 0;
    }
    resetGiro() {
        this.mano = [];
        this.dichiarazione = "-";
        this.preseFatte = 0;
    }
}