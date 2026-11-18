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
    yaw: 0,
    pitch: -8,
    exits: [
      { room: 'woonkamer', text: 'Naar de woonkamer', pitch: -10, yaw: -42, targetYaw: 112, targetPitch: -5 }
    ]
  }
};

const sceneId = ({ room, mode, time, layout }) => `${room}-${mode}-${time}-${layout}`;
const scenes = {};
for (const [room, { yaw, pitch, hfov, exits }] of Object.entries(rooms)) {
  for (const mode of ['foto', 'model']) {
    for (const time of ['dag', 'avond']) {
      for (const layout of ['haard', 'bank']) {
        const variant = room === 'woonkamer' && layout === 'haard' ? '-haard'
          : room === 'binnenkomst' && layout === 'bank' ? '-bank' : '';
        const evening = time === 'avond' ? '-avond' : '';
        const photo = mode === 'foto' ? '-fotorealistisch' : '';
        scenes[sceneId({ room, mode, time, layout })] = {
          yaw,
          pitch,
          ...(hfov ? { hfov } : {}),
          panorama: `panorama/${room}${variant}${evening}${photo}.jpg?v=4`,
          hotSpots: exits.map(({ room: destination, ...hotSpot }) => ({
            ...hotSpot,
            type: 'scene',
            sceneId: sceneId({ room: destination, mode, time, layout })
          }))
        };
      }
    }
  }
}

const controls = ['room', 'mode', 'time', 'layout'].map(field => [
  field, document.querySelectorAll(`button[data-${field}]`)
]);
const heading = document.getElementById('room-name');
const status = document.getElementById('loading');

const viewer = pannellum.viewer('panorama', {
  default: {
    firstScene: sceneId({ room: 'binnenkomst', mode: 'foto', time: 'dag', layout: 'haard' }),
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
  const [room, mode, time, layout] = id.split('-');
  return { room, mode, time, layout };
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
      const goToLiving = field === 'layout' && state.room !== 'woonkamer';
      if (state[field] === value && !goToLiving) return;
      state[field] = value;
      if (goToLiving) state.room = 'woonkamer';
      const destination = sceneId(state);
      if (field === 'room' || goToLiving) {
        viewer.loadScene(destination);
      } else {
        viewer.loadScene(destination, viewer.getPitch(), viewer.getYaw(), viewer.getHfov());
      }
    });
  }
}
