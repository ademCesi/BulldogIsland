import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 500,
    backgroundColor: '#3498db',
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);
let os1Ramasser = false
let os2Ramasser = false
let moov = true
let attenteReponse = false

function preload() {
    this.load.image('background', './assets/orig.png'); // Image de fond
    this.load.image('foreground', './assets/orig2.png'); // Image de premier plan
    this.load.image('mouvement1', './assets/bulldog-marche1.png'); // Image 1
    this.load.image('mouvement2', './assets/bulldog-marche2.png'); // Image 2

    this.load.image('prof1', './assets/bulldog-prof.png'); // Image 1
    this.load.image('prof2', './assets/bulldog-prof2.png'); // Image 2
    this.load.image('prof3', './assets/bulldog-prof3.png'); // Image 2

    this.load.image('os', './assets/os.png');

    this.load.image('parchemin', './assets/parchemin.png');

    this.load.image('inactif', './assets/bulldog-assis.png'); // Image pour l'inactivité

    this.load.audio('dialogue1', './assets/audio/Wafthisdiscussionsimpl.mp3'); // Charger l'audio de fond
    this.load.audio('dialogue2', './assets/audio/Wafthisdiscussiionsimple2.mp3'); // Charger un effet sonore
    this.load.audio('bg', './assets/audio/bg.mp3'); // Charger un effet sonore

}

function create() {
    // Afficher l'image de fond
    this.background = this.add.image(0, 0, 'background');
    this.background.setOrigin(0, 0);
    this.background.setDisplaySize(this.scale.width, this.scale.height);

    this.os1 = this.add.sprite(this.scale.width - 400, this.scale.height - 70, 'os');
    this.os2 = this.add.sprite(400, this.scale.height - 70, 'os');
    this.os3 = this.add.sprite(this.scale.width - 110, 35, 'os');

    // Ajouter le sprite initial au centre avec l'image 'mouvement1'
    this.player = this.add.sprite(250, this.scale.height - 70, 'mouvement1');

    // Ajouter le sprite initial au centre avec l'image 'mouvement1'
    this.prof = this.add.sprite(this.scale.width - 180, this.scale.height - 70, 'prof1');

    // Agrandir le sprite 'mouvement1' de 2 fois sa taille d'origine
    this.player.setScale(2);
    this.prof.setScale(2);
    this.os1.setScale(0.5);
    this.os2.setScale(0.5);

    // Variable pour suivre l'image actuelle du sprite
    this.currentTexture = 'mouvement1';
    this.profTexture = 'prof1';

    // Définir les touches ZQSD
    this.keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.Z,    // Z pour haut
        down: Phaser.Input.Keyboard.KeyCodes.S,  // S pour bas
        left: Phaser.Input.Keyboard.KeyCodes.Q,  // Q pour gauche
        right: Phaser.Input.Keyboard.KeyCodes.D,  // D pour droite
        enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
        touche1: Phaser.Input.Keyboard.KeyCodes.A, 
        touche2: Phaser.Input.Keyboard.KeyCodes.B, 
        touche3: Phaser.Input.Keyboard.KeyCodes.C, 

    });

    console.log(this.keys);

    this.frontBackground = this.add.image(0, 0, 'foreground'); // Ajouter une image au premier plan
    this.frontBackground.setOrigin(0, 0);
    this.frontBackground.setDisplaySize(this.scale.width, this.scale.height);

    this.parchemin = this.add.sprite(520, 120, 'parchemin');
    this.parchemin.setScale(4)
    this.parchemin.visible = false;

    // Initialiser le dernier changement de texture
    this.lastTextureChange = 0; // Timestamp

    // Ajout : Initialiser le temps du dernier appui sur une touche
    this.lastKeyPressTime = 0;
    this.lastEnterPress = 0;
    this.inactivityDuration = 100; // Temps en millisecondes avant inactivité (3 secondes)

    this.time.addEvent({
        delay: 800, // 1 seconde
        callback: this.toggleTextureProf, // Appeler la méthode
        callbackScope: this, // S'assurer que `this` fait référence à la scène
        loop: true // L'événement se répète indéfiniment
    });

    this.compteuros = 0; // Initialiser le score
    this.nbdialogue = 0; // Initialiser le score
    this.textHistoire = ''

    // Ajouter le texte du score
    this.scoreText = this.add.text( this.scale.width - 76, 16, ` x ${this.compteuros}`, {
        font: '32px Arial',
        fill: '#000000'
    });

    // Ajouter l'audio de fond
    this.dialogue1 = this.sound.add('dialogue2', {
        loop: false, // Lecture en boucle
        volume: 1 // Réduction du volume à 50%
    });

    this.bg = this.sound.add('bg', {
        loop: true, // Lecture en boucle
        volume: 0.1 // Réduction du volume à 50%
    });
    this.bg.play();

    this.textHistoire = this.add.text( 160 , 80, `${this.textHistoire}`, {
        font: '16px Arial',
        fill: '#000000',
        wordWrap: {
            width: 740, // Limite de largeur en pixels
            useAdvancedWrap: true // Utilise le retour à la ligne avancé pour gérer les espaces
        }
    });
}



function update(time) {
    const speed = 200; // Vitesse de déplacement
    const changeInterval = 500; // Intervalle en millisecondes entre les changements de texture
    const enterPressInterval = 500; // Délai minimum entre deux appuis sur Entrée (en ms)

    let isKeyPressed = false;

    // Gestion de la touche Entrée pour les dialogues
    if (this.keys.enter.isDown && !moov && time - this.lastEnterPress >= enterPressInterval && !attenteReponse) {
        this.lastEnterPress = time; // Mettre à jour le dernier appui sur Entrée
        this.nextText(); // Passer au dialogue suivant
    }

    // Gestion des réponses aux questions (A, B, C)
    if (attenteReponse) {
        if (this.keys.touche1.isDown) {
            console.log("Réponse A détectée");
            this.setTextNegatif(); // Affiche une réponse négative
            attenteReponse = false; // Désactive l'attente
        }

        if (this.keys.touche2.isDown) {
            console.log("Réponse B détectée");
            this.setTextPositif(); // Affiche une réponse positive
            attenteReponse = false; // Désactive l'attente
        }

        if (this.keys.touche3.isDown) {
            console.log("Réponse C détectée");
            this.setTextNegatif(); // Affiche une réponse négative
            attenteReponse = false; // Désactive l'attente
        }
    }

    // Gestion de la fermeture du dialogue
    if (this.keys.enter.isDown && !moov && !attenteReponse && this.textHistoire.text === "") {
        console.log("Fermeture du dialogue");
        this.textHistoire.setText(""); // Vide le texte
        moov = true; // Permet au joueur de bouger à nouveau
        this.parchemin.visible = false; // Cache le parchemin
    }

    // Déplacer vers la gauche
    if (this.keys.left.isDown && moov) {
        this.player.x = Math.max(this.player.x - speed * (1 / 60), 250);
        this.player.setFlipX(false); // Inverser horizontalement pour regarder à gauche
        isKeyPressed = true;
        if (time - this.lastTextureChange >= changeInterval) {
            this.lastTextureChange = time;
            this.toggleTexture();
        }
    }

    // Déplacer vers la droite
    if (this.keys.right.isDown && moov) {
        if (this.player.x >= this.scale.width - 250) {
            this.setText();
            moov = false;
        }
        if (this.player.x >= this.scale.width - 400 && !os1Ramasser) {
            this.os1.destroy();
            this.increaseScore();
            os1Ramasser = true;
        }
        if (this.player.x >= 400 && !os2Ramasser) {
            this.os2.destroy();
            this.increaseScore();
            os2Ramasser = true;
        }

        this.player.x = Math.min(this.player.x + speed * (1 / 60), this.scale.width - 250);
        this.player.setFlipX(true); // Remettre l'orientation normale pour regarder à droite
        isKeyPressed = true;
        if (time - this.lastTextureChange >= changeInterval) {
            this.lastTextureChange = time;
            this.toggleTexture();
        }
    }

    // Ajout : Mettre à jour le dernier temps d'activité si une touche est pressée
    if (isKeyPressed) {
        this.lastKeyPressTime = time;
    }

    // Ajout : Changer de sprite après 3 secondes d'inactivité
    if (time - this.lastKeyPressTime >= this.inactivityDuration) {
        this.setInactiveTexture();
    }
}



Phaser.Scene.prototype.toggleTexture = function () {
    const nextTexture = this.currentTexture === 'mouvement1' ? 'mouvement2' : 'mouvement1';
    this.player.setTexture(nextTexture);
    this.currentTexture = nextTexture;
};

Phaser.Scene.prototype.toggleTextureProf = function () {
    console.log("test", this.profTexture)
    const nextTexture = this.profTexture === 'prof1' ? 'prof2' : (this.profTexture === 'prof2' ? 'prof3' : 'prof1');
    this.prof.setTexture(nextTexture);
    this.profTexture = nextTexture;
};

// Fonction pour changer le sprite en état d'inactivité
Phaser.Scene.prototype.setInactiveTexture = function () {
    if (this.currentTexture !== 'inactif') {
        this.player.setTexture('inactif');
        this.currentTexture = 'inactif';
    }
};

Phaser.Scene.prototype.setText = function () {
    this.dialogue1.play();
    this.parchemin.visible = true;
    this.textHistoire.setText(`Le cœur humain est une pompe essentielle qui maintient la vie en faisant circuler le sang à travers tout le corps. Ce réseau complexe de vaisseaux sanguins transporte l'oxygène et les nutriments nécessaires aux organes, tout en éliminant les déchets. Le rythme régulier du cœur assure une distribution efficace, permettant à chaque cellule de fonctionner correctement.`);
};

Phaser.Scene.prototype.nextText = function () {
    let chap1 = [
        "De la même manière, les courants marins jouent un rôle vital pour la planète en agissant comme un système de transport global. Ils redistribuent la chaleur, les nutriments, et même le carbone, reliant les régions du monde comme les vaisseaux sanguins relient les organes.",
        "La pompe thermohaline, un élément clé des courants marins, fonctionne grâce aux différences de température et de salinité entre les eaux chaudes et froides. Ce mécanisme agit comme un battement cardiaque terrestre, créant un mouvement constant d’échanges entre les couches superficielles et profondes des océans.",
        "Ce processus contribue non seulement à la régulation du climat global, mais il soutient également des écosystèmes marins diversifiés en apportant des nutriments essentiels aux zones qui en manquent.",
        "Ainsi, tout comme une défaillance du cœur peut entraîner un déséquilibre ou une maladie dans le corps humain, des perturbations dans les courants marins ou dans la pompe thermohaline, telles que celles causées par le réchauffement climatique, peuvent bouleverser les écosystèmes marins et altérer les conditions climatiques mondiales.",
        "Cette analogie souligne à quel point le bon fonctionnement de ces deux systèmes est crucial pour la vie qu’ils soutiennent.",
        "Pourquoi les courants marins sont-ils comparés au système circulatoire humain ?\na) Parce qu’ils fonctionnent avec de l’électricité, comme les impulsions nerveuses.\nb) Parce qu’ils transportent la chaleur et les nutriments à travers la planète.\nc) Parce qu’ils battent au même rythme que le cœur humain.\n"
    ];

    // Vérifie si on n'est pas encore au dernier texte
    if (this.nbdialogue < chap1.length - 1 && !attenteReponse) {
        this.textHistoire.setText(chap1[this.nbdialogue]); // Affiche le texte actuel
        this.nbdialogue += 1; // Passe au texte suivant
    }
    // Si on est au dernier texte, active l'attente de réponse
    else if (this.nbdialogue === chap1.length - 1 && !attenteReponse) {
        this.textHistoire.setText(chap1[this.nbdialogue]); // Affiche la question
        attenteReponse = true; // Active l'attente d'une réponse
    }
    // Si une réponse a été donnée, ferme le dialogue avec Entrée
    else if (!attenteReponse && this.nbdialogue >= chap1.length) {
        this.textHistoire.setText(""); // Vide le texte
        moov = true; // Permet au joueur de bouger à nouveau
        this.parchemin.visible = false; // Cache le parchemin
        this.nbdialogue = 0; // Réinitialise le compteur de dialogues
    }
};

Phaser.Scene.prototype.increaseNbdialogue = function () {
    console.log("adem")
    this.nbdialogue += 1;
};

Phaser.Scene.prototype.increaseScore = function () {
    this.compteuros += 1; // Incrémenter le score
    this.scoreText.setText(` x ${this.compteuros}`); // Mettre à jour le texte affiché
};

Phaser.Scene.prototype.setTextPositif = function () {
    this.dialogue1.play();
    this.textHistoire.setText(`Good`);
    attenteReponse = false
};

Phaser.Scene.prototype.setTextNegatif = function () {
    this.dialogue1.play();
    this.textHistoire.setText(`Nul a chier`);
    attenteReponse = false
};