const rooms = {
  binnenkomst: {
    title: 'Binnenkomst',
    yaw: 0,
    pitch: -7,
    hfov: 118,
    exits: [
      { room: 'keuken', text: 'Links naar de keuken', pitch: -11, yaw: -49 },
      { room: 'woonkamer', text: 'Rechts naar de woonkamer', pitch: -11, yaw: 49 }
    ]
  },
  woonkamer: {
    title: 'Woonkamer',
    yaw: 44,
    pitch: -6,
    exits: [
      { room: 'keuken', text: 'Naar de keuken', pitch: -9, yaw: 7 }
    ]
  },
  keuken: {
    title: 'Keuken',
    yaw: -5,
    pitch: 8,
    hfov: 95,
    exits: [
      { room: 'woonkamer', text: 'Naar de woonkamer', pitch: -10, yaw: -42, targetYaw: 112, targetPitch: -5 }
    ]
  },
  badkamer: { title: 'Badkamer', floor: 'EERSTE VERDIEPING', yaw: 0, pitch: -12, hfov: 99, exits: [] }
};

const initialState = { room: 'binnenkomst', mode: 'foto', time: 'dag', sofa: 'naturel', ceiling: 'standaard', tile: 'beige' };
const sceneId = ({ room, mode, time, sofa, ceiling, tile }) => `${room}-${mode}-${time}-${sofa}-${ceiling}-${tile}`;

function panoramaPath({ room, mode, time, sofa, ceiling, tile }) {
  const photo = mode === 'foto' ? '-fotorealistisch' : '';
  if (room === 'badkamer') return `panorama/badkamer-${tile}-360${photo}.jpg?v=7`;
  const name = {
    binnenkomst: 'binnenkomst',
    woonkamer: sofa === 'taupe' ? 'woonkamer-haard-taupe' : 'woonkamer-haard',
    keuken: ceiling === 'verlaagd' ? 'keuken-verlaagd' : 'keuken'
  }[room];
  const evening = time === 'avond' ? '-avond' : '';
  return `panorama/${name}${evening}${photo}.jpg?v=5`;
}

const scenes = {};
const settings = {
  mode: ['foto', 'model'],
  time: ['dag', 'avond'],
  sofa: ['naturel', 'taupe'],
  ceiling: ['standaard', 'verlaagd'],
  tile: ['beige', 'ivory']
};
const choices = Object.entries(settings).reduce((states, [field, values]) =>
  states.flatMap(state => values.map(value => ({ ...state, [field]: value }))), [{}]);
for (const [room, view] of Object.entries(rooms)) {
  for (const choice of choices) {
    const state = { ...choice, room };
    scenes[sceneId(state)] = {
      yaw: view.yaw,
      pitch: view.pitch,
      ...(view.hfov ? { hfov: view.hfov } : {}),
      panorama: panoramaPath(state),
      hotSpots: view.exits.map(({ room: destination, ...hotSpot }) => ({
        ...hotSpot,
        type: 'scene',
        sceneId: sceneId({ ...state, room: destination })
      }))
    };
  }
}

const controls = ['room', ...Object.keys(settings)].map(field => [
  field, document.querySelectorAll(`button[data-${field}]`)
]);
const roomOptions = document.querySelectorAll('[data-for-room]');
const houseFloor = document.getElementById('house-floor');
const timeControls = document.querySelector('.time-mode');
const heading = document.getElementById('room-name');
const status = document.getElementById('loading');

const viewer = pannellum.viewer('panorama', {
  default: {
    firstScene: sceneId(initialState),
    type: 'equirectangular',
    autoLoad: true,
    sceneFadeDuration: 320,
    hfov: 87,
    minHfov: 55,
    maxHfov: 118,
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
  const [room, mode, time, sofa, ceiling, tile] = id.split('-');
  return { room, mode, time, sofa, ceiling, tile };
}

function updateControls(id) {
  const state = sceneState(id);
  heading.textContent = rooms[state.room].title;
  houseFloor.textContent = rooms[state.room].floor || 'BEGANE GROND';
  timeControls.hidden = state.room === 'badkamer';
  for (const group of roomOptions) {
    group.hidden = group.dataset.forRoom !== state.room;
  }
  for (const [field, buttons] of controls) {
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset[field] === state[field]));
    }
  }
}
viewer.on('scenechange', updateControls);
updateControls(sceneId(initialState));

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
      const destination = sceneId(state);
      if (field === 'room') {
        viewer.loadScene(destination);
      } else {
        viewer.loadScene(destination, viewer.getPitch(), viewer.getYaw(), viewer.getHfov());
      }
    });
  }
}
