const rooms = {
  woonkamer: {
    title: 'Woonkamer',
    yaw: -44,
    pitch: -6,
    exits: [
      { room: 'keuken', text: 'Naar de keuken', pitch: -9, yaw: -7 }
    ]
  },
  keuken: {
    title: 'Keuken',
    yaw: 0,
    pitch: -8,
    exits: [
      { room: 'woonkamer', text: 'Naar de woonkamer', pitch: -10, yaw: 42, targetYaw: -112, targetPitch: -5 }
    ]
  }
};

const sceneId = (room, mode) => `${room}-${mode}`;
const scenes = {};
for (const [room, { yaw, pitch, exits }] of Object.entries(rooms)) {
  for (const mode of ['foto', 'model']) {
    scenes[sceneId(room, mode)] = {
      yaw,
      pitch,
      panorama: `panorama/${room}${mode === 'foto' ? '-fotorealistisch.png' : '.jpg'}`,
      hotSpots: exits.map(({ room: destination, ...hotSpot }) => ({
        ...hotSpot,
        type: 'scene',
        sceneId: sceneId(destination, mode)
      }))
    };
  }
}

const roomButtons = document.querySelectorAll('button[data-room]');
const modeButtons = document.querySelectorAll('button[data-mode]');
const heading = document.getElementById('room-name');
const status = document.getElementById('loading');

const viewer = pannellum.viewer('panorama', {
  default: {
    firstScene: sceneId('woonkamer', 'foto'),
    type: 'equirectangular',
    autoLoad: true,
    sceneFadeDuration: 320,
    hfov: 87,
    minHfov: 55,
    maxHfov: 105,
    showControls: true,
    mouseZoom: true,
    strings: {
      loadButtonLabel: 'Panorama laden',
      loadingLabel: 'Laden…',
      toggleFullscreen: 'Volledig scherm',
      zoomIn: 'Inzoomen',
      zoomOut: 'Uitzoomen'
    }
  },
  scenes
});

viewer.on('scenechange', (id) => {
  const [room, mode] = id.split('-');
  heading.textContent = rooms[room].title;
  for (const button of roomButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.room === room));
  }
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  }
});

viewer.on('load', () => {
  status.hidden = true;
});
viewer.on('error', () => {
  status.textContent = 'Het panorama kon niet worden geladen.';
  status.hidden = false;
});
for (const button of roomButtons) {
  button.addEventListener('click', () => {
    const [room, mode] = viewer.getScene().split('-');
    if (button.dataset.room !== room) viewer.loadScene(sceneId(button.dataset.room, mode));
  });
}
for (const button of modeButtons) {
  button.addEventListener('click', () => {
    const [room, mode] = viewer.getScene().split('-');
    if (button.dataset.mode !== mode) {
      viewer.loadScene(sceneId(room, button.dataset.mode), viewer.getPitch(), viewer.getYaw(), viewer.getHfov());
    }
  });
}
