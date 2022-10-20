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
            position: { x: 0, y: 1.3, z: 0 }
        }

        socket.emit('add', player);
    } else {
        location.href = './index.html';
    }
}

function createPlayer(id, name, color, position) {
    // cria o texto do nome do user
    const playerText = document.createElement('a-text');
    const playerTextAttr = document.createAttribute('position');
    playerTextAttr.value = `-0.033 0.9 -0.032`;
    playerText.setAttributeNode(playerTextAttr);
    playerText.setAttribute('value', name);
    playerText.setAttribute('color', 'white');
    playerText.setAttribute('side', 'double');
    playerText.setAttribute('align', 'center');
    
    //cria o quadrado do user
    const playerBox = document.createElement('a-box');
    playerBox.setAttribute('color', color);
    playerBox.appendChild(playerText);

    // cria a camera do user
    const playerCamera = document.createElement('a-camera');
    const playerPosition = document.createAttribute('position');
    playerPosition.value = `${position.x} ${position.y} ${position.z}`
    playerCamera.setAttribute('do-something-once-loaded', '');
    playerCamera.setAttributeNode(playerPosition);
    playerCamera.setAttribute('extended-wasd-controls', 'flyEnabled: true; inputType: joystick;');
    playerCamera.setAttribute('id', 'camera');
    playerCamera.appendChild(playerBox);

    const component = playerCamera.components["extended-wasd-controls"];
    const joystick = new Joystick("stick1", 64, 8);
    console.log("controls initialized: ", component, joystick);
    createControls(component, joystick);

    // Cria a entity do user
    const playerEntity = document.createElement('a-entity');
    playerEntity.setAttribute('id', id);
    playerEntity.setAttribute('player-move', "controllerListenerId: #controller-data; navigationMeshClass: environmentGround;");
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

function createControls(component, joystick) {
    console.log('CONTROL')
    AFRAME.registerComponent('screen-controls', {
        tick: function (time, deltaTime) {
            component.movePercent.x = joystick.value.x ;
            component.movePercent.z = -joystick.value.y;
        }
    });
}

socket.on('newPlayer', (playerinfo) => {
    const mapa = document.getElementById('mapa');
    const newPlayer = playerinfo.player;
    const $player = createPlayer(newPlayer.id, newPlayer.name, newPlayer.color, newPlayer.position);
    mapa.appendChild($player);
    document.getElementById('uiDiv').style.display = 'block';

    //monta todos os players que já estão online
    playerinfo.players.forEach(p => {
        const $OtherPlayer = createOtherPlayer(p.id, p.name, p.color, p.position);
        mapa.appendChild($OtherPlayer);
    });
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