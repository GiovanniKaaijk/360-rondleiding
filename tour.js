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

const sceneId = (room, mode, time) => `${room}-${mode}-${time}`;
const scenes = {};
for (const [room, { yaw, pitch, exits }] of Object.entries(rooms)) {
  for (const mode of ['foto', 'model']) {
    for (const time of ['dag', 'avond']) {
      const evening = time === 'avond' ? '-avond' : '';
      const photo = mode === 'foto' ? '-fotorealistisch' : '';
      scenes[sceneId(room, mode, time)] = {
        yaw,
        pitch,
        panorama: `panorama/${room}${evening}${photo}.jpg`,
        hotSpots: exits.map(({ room: destination, ...hotSpot }) => ({
          ...hotSpot,
          type: 'scene',
          sceneId: sceneId(destination, mode, time)
        }))
      };
    }
  }
}

const controls = [
  ['room', document.querySelectorAll('button[data-room]')],
  ['mode', document.querySelectorAll('button[data-mode]')],
  ['time', document.querySelectorAll('button[data-time]')]
];
const heading = document.getElementById('room-name');
const status = document.getElementById('loading');

const viewer = pannellum.viewer('panorama', {
  default: {
    firstScene: sceneId('woonkamer', 'foto', 'dag'),
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

function sceneState(id) {
  const [room, mode, time] = id.split('-');
  return { room, mode, time };
}

viewer.on('scenechange', (id) => {
  const state = sceneState(id);
  heading.textContent = rooms[state.room].title;
  for (const [field, buttons] of controls) {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset[field] === state[field]));
    }
  }
});

viewer.on('load', () => {
  status.hidden = true;
});
viewer.on('error', () => {
  status.textContent = 'Het panorama kon niet worden geladen.';
  status.hidden = false;
});
for (const [field, buttons] of controls) {
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const state = sceneState(viewer.getScene());
      const value = button.dataset[field];
      if (state[field] === value) return;
      state[field] = value;
      const destination = sceneId(state.room, state.mode, state.time);
      if (field === 'room') {
        viewer.loadScene(destination);
      } else {
        viewer.loadScene(destination, viewer.getPitch(), viewer.getYaw(), viewer.getHfov());
      }
    });
  }
}
