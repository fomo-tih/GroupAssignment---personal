(function(global){
  const STORAGE_KEY = 'color-scheme-preference';
  const DEFAULT_ID = 'standard';
  const root = document.documentElement;

  const SCHEMES = {
    standard: {
      label: 'Default',
      cssVars: {
        '--accent':'#56e0a0',
        '--accent-glow':'rgba(86,224,160,0.5)',
        '--chart-line':'#56e0a0',
        '--chart-bar':'#d869c6',
        '--chart-pie-1':'#145a4a',
        '--chart-pie-2':'#1f7a64',
        '--chart-pie-3':'#2fa182',
        '--chart-pie-4':'#56e0a0',
        '--chart-pie-5':'#8ef0c5',
        '--chart-pie-6':'#c7fae6',
        '--chart-pie-7':'#6ca0dc',
        '--chart-pie-8':'#d4a5ff',
        '--map-breath-start':'#0e2922',
        '--map-breath-end':'#7aa294',
        '--map-drug-start':'#2b1a12',
        '--map-drug-end':'#b98a6e',
        '--map-alcohol-start':'#1d1730',
        '--map-alcohol-end':'#b7a3d9',
        '--map-overview-start':'#400040',
        '--map-overview-end':'#e6b3ff'
      }
    },
    protanopia: {
      label: 'Protanopia',
      cssVars: {
        '--accent':'#f2cc8f',
        '--accent-glow':'rgba(242,204,143,0.5)',
        '--chart-line':'#f2cc8f',
        '--chart-bar':'#577590',
        '--chart-pie-1':'#1b9aaa',
        '--chart-pie-2':'#577590',
        '--chart-pie-3':'#43aa8b',
        '--chart-pie-4':'#f2cc8f',
        '--chart-pie-5':'#f08a4b',
        '--chart-pie-6':'#c8553d',
        '--chart-pie-7':'#5f0f40',
        '--chart-pie-8':'#90be6d',
        '--map-breath-start':'#264653',
        '--map-breath-end':'#90be6d',
        '--map-drug-start':'#3a0ca3',
        '--map-drug-end':'#f8961e',
        '--map-alcohol-start':'#0f4c5c',
        '--map-alcohol-end':'#e36414',
        '--map-overview-start':'#14213d',
        '--map-overview-end':'#fca311'
      }
    },
    deuteranopia: {
      label: 'Deuteranopia',
      cssVars: {
        '--accent':'#ffb703',
        '--accent-glow':'rgba(255,183,3,0.5)',
        '--chart-line':'#ffb703',
        '--chart-bar':'#8ecae6',
        '--chart-pie-1':'#023047',
        '--chart-pie-2':'#8ecae6',
        '--chart-pie-3':'#219ebc',
        '--chart-pie-4':'#ffb703',
        '--chart-pie-5':'#fb8500',
        '--chart-pie-6':'#d62828',
        '--chart-pie-7':'#8d99ae',
        '--chart-pie-8':'#e0fbfc',
        '--map-breath-start':'#023047',
        '--map-breath-end':'#8ecae6',
        '--map-drug-start':'#370617',
        '--map-drug-end':'#f48c06',
        '--map-alcohol-start':'#03045e',
        '--map-alcohol-end':'#90e0ef',
        '--map-overview-start':'#1d3557',
        '--map-overview-end':'#f7b801'
      }
    },
    tritanopia: {
      label: 'Tritanopia',
      cssVars: {
        '--accent':'#06d6a0',
        '--accent-glow':'rgba(6,214,160,0.5)',
        '--chart-line':'#06d6a0',
        '--chart-bar':'#ffd166',
        '--chart-pie-1':'#26547c',
        '--chart-pie-2':'#ffd166',
        '--chart-pie-3':'#ef476f',
        '--chart-pie-4':'#06d6a0',
        '--chart-pie-5':'#f78c6b',
        '--chart-pie-6':'#118ab2',
        '--chart-pie-7':'#073b4c',
        '--chart-pie-8':'#ffd6a5',
        '--map-breath-start':'#073b4c',
        '--map-breath-end':'#06d6a0',
        '--map-drug-start':'#6a4c93',
        '--map-drug-end':'#ffd166',
        '--map-alcohol-start':'#1a535c',
        '--map-alcohol-end':'#ff6b6b',
        '--map-overview-start':'#114b5f',
        '--map-overview-end':'#f45b69'
      }
    }
  };

  function readSaved(){
    try{
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_ID;
    } catch(_){
      return DEFAULT_ID;
    }
  }

  function persist(id){
    try{
      localStorage.setItem(STORAGE_KEY, id);
    } catch(_){}
  }

  function applyScheme(id, opts = {}){
    const scheme = SCHEMES[id] || SCHEMES[DEFAULT_ID];
    Object.entries(scheme.cssVars).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    root.dataset.colorScheme = id;
    persist(id);
    if (!opts.silent){
      global.dispatchEvent(new CustomEvent('colorSchemeChanged', { detail:{ id, scheme } }));
    }
  }

  function initSelect(){
    const select = document.getElementById('colorSchemeSelect');
    if (!select || select.dataset.ready === '1') return;
    select.innerHTML = '';
    Object.entries(SCHEMES).forEach(([id, scheme]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = scheme.label;
      select.appendChild(opt);
    });
    select.dataset.ready = '1';
    select.addEventListener('change', (e) => {
      applyScheme(e.target.value);
    });
  }

  const initial = readSaved();
  applyScheme(initial, { silent:true });

  document.addEventListener('DOMContentLoaded', () => {
    initSelect();
    const select = document.getElementById('colorSchemeSelect');
    if (select) select.value = root.dataset.colorScheme || initial;
  });

  global.AppColorSchemes = {
    list: () => Object.keys(SCHEMES),
    getCurrent: () => root.dataset.colorScheme || DEFAULT_ID,
    getScheme: (id) => SCHEMES[id] || SCHEMES[DEFAULT_ID],
    apply: (id) => applyScheme(id)
  };
})(window);

