// const socket = io('https://projeto-metaverso.herokuapp.com/');
const socket = io('http://localhost:3000');
let playerID = "";

// executar para limpar a lista de players n jogaveis do server
const playerToRemove = sessionStorage.getItem('remove-player');
if (playerToRemove) {
    socket.emit('remove', playerToRemove);
}

const hexaRange = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];


// função para saber onde que o jogador está
AFRAME.registerComponent("trackplayer", {
    tick: function () {
        socket.emit('move', {
            id: playerID,
            position: this.el.object3D.position
        });
    }
});

// função faz o set do evento tick no jogador
AFRAME.registerComponent("do-something-once-loaded", {
    init: function () {
        this.el.setAttribute('trackplayer', '');
    }
});


function startPlayer() {
    const playerName = sessionStorage.getItem('username');

    sessionStorage.removeItem('username');
    playerID = playerName.toLocaleLowerCase().replaceAll(' ', '_');

    sessionStorage.setItem('remove-player', playerID);

    if (playerName) {
        const player = {
            id: playerID,
            name: playerName,
            color: getColor(),
            position: { x: 0, y: 0, z: 0 }
        }

        socket.emit('add', player);
    } else {
        location.href = './index.html';
    }
}

function createPlayer(id, name, color, position) {
    const playerEntity = document.createElement('a-entity');
    const playerCamera = document.createElement('a-camera');
    const playerBox = document.createElement('a-box');
    const playerText = document.createElement('a-text');

    const playerTextAttr = document.createAttribute('position');
    playerTextAttr.value = `-0.033 0.9 -0.032`;
    playerText.setAttributeNode(playerTextAttr);
    playerText.setAttribute('value', name);
    playerText.setAttribute('color', 'white');
    playerText.setAttribute('side', 'double');
    playerText.setAttribute('align', 'center');



    playerEntity.setAttribute('id', id);
    playerEntity.setAttribute('player-move', "controllerListenerId: #controller-data; navigationMeshClass: environmentGround;");

    playerBox.setAttribute('color', color);
    playerBox.appendChild(playerText)
    playerCamera.appendChild(playerBox);

    const playerPosition = document.createAttribute('position');
    playerPosition.value = `${position.x} ${position.y} ${position.z}`
    playerCamera.setAttribute('do-something-once-loaded', '');
    playerCamera.setAttributeNode(playerPosition);
    playerCamera.setAttribute('extended-wasd-controls', 'flyEnabled: true; inputType: joystick;')
    
    playerCamera.setAttribute('id', 'camera')


    playerEntity.appendChild(playerCamera);

    return playerEntity;
}

function createOtherPlayer(id, name, color, position) {
    const playerBox = document.createElement('a-box');
    playerBox.setAttribute('id', id);
    playerBox.setAttribute('color', color);
    playerBox.setAttribute('position', position);

    const playerText = document.createElement('a-text');
    playerText.setAttribute('value', name)
    playerText.setAttribute('color', 'white')
    const playerTextAttr = document.createAttribute('position');
    playerTextAttr.value = `-0.033 0.9 -0.032`;
    playerText.setAttributeNode(playerTextAttr);
    playerText.setAttribute('side', 'double');
    playerText.setAttribute('align', 'center');

    playerBox.appendChild(playerText)

    const playerPosition = document.createAttribute('position');
    playerPosition.value = `${position.x} ${position.y} ${position.z}`;
    playerBox.setAttributeNode(playerPosition);

    return playerBox;
}

function getColor() {
    const a = hexaRange[Math.floor((Math.random() * 15) + 1)],
        b = hexaRange[Math.floor((Math.random() * 15) + 1)],
        c = hexaRange[Math.floor((Math.random() * 15) + 1)],
        d = hexaRange[Math.floor((Math.random() * 15) + 1)],
        e = hexaRange[Math.floor((Math.random() * 15) + 1)],
        f = hexaRange[Math.floor((Math.random() * 15) + 1)];
    return `#${a}${b}${c}${d}${e}${f}`;
}


function createControls() {
    console.log('CONTROL')
    setTimeout(() => {
        AFRAME.registerComponent('screen-controls', {
            init: function () {
                this.component = document.getElementById("camera").components["extended-wasd-controls"];
                this.joystick1 = new Joystick("stick1", 64, 8);
                console.log("controls initialized");
                document.getElementById('uiDiv').style.display = 'block';
            },
        
            tick: function (time, deltaTime) {
                this.component.movePercent.x = this.joystick1.value.x ;
                this.component.movePercent.z = -this.joystick1.value.y;
        
            }
        });
    }, 100)
}

socket.on('newPlayer', (playerinfo) => {
    const mapa = document.getElementById('mapa');
    const newPlayer = playerinfo.player;
    const $player = createPlayer(newPlayer.id, newPlayer.name, newPlayer.color, newPlayer.position);
    mapa.appendChild($player);

    //monta todos os players que já estão online
    playerinfo.players.forEach(p => {
        const $OtherPlayer = createOtherPlayer(p.id, p.name, p.color, p.position);
        mapa.appendChild($OtherPlayer);
    });

    createControls();
});

socket.on('somePlayerAdded', (player) => {
    const mapa = document.getElementById('mapa');
    const $player = createOtherPlayer(player.id, player.name, player.color, player.position);
    mapa.appendChild($player);
});


socket.on('somePlayerRemoved', (playersToRemove) => {
    const oldPlayer = document.getElementById(playersToRemove);
    if (oldPlayer) {
        console.log('playersToRemove: ', playersToRemove);
        document.getElementById(playersToRemove).remove();
    }
});


socket.on('playerMove', (player) => {
    const playerPosition = document.createAttribute('position');
    playerPosition.value = `${player.position.x} ${player.position.y} ${player.position.z}`;
    document.getElementById(player.id)?.setAttributeNode(playerPosition);
});