const RELEASE_API = 'https://api.github.com/repos/JobHunter-AI/jobhunter-releases/releases/latest';

const $ = (id) => document.getElementById(id);
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
};

function currentPlatform() {
  const value = `${navigator.userAgentData?.platform || ''} ${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();
  if (value.includes('mac')) return 'mac';
  if (value.includes('win')) return 'windows';
  return 'mac';
}

function findAsset(assets, platform) {
  return assets.find((asset) => {
    const name = asset.name.toLowerCase();
    if (platform === 'mac') return name.endsWith('.dmg');
    return name.endsWith('.exe') && !name.endsWith('.exe.sig');
  });
}

function enableDownload(platform, asset, version, isBeta) {
  const link = $(platform === 'mac' ? 'mac-download' : 'windows-download');
  const meta = $(platform === 'mac' ? 'mac-meta' : 'windows-meta');
  if (!asset) {
    link.textContent = platform === 'mac' ? 'Mac 版本暂未提供' : 'Windows 版本暂未提供';
    return;
  }
  link.href = asset.browser_download_url;
  link.removeAttribute('aria-disabled');
  link.classList.remove('is-disabled');
  link.textContent = platform === 'mac' ? `下载 macOS ${isBeta ? '内测版' : '版'}` : `下载 Windows ${isBeta ? '内测版' : '旧版'}`;
  meta.textContent = `${version} · ${formatBytes(asset.size)} · ${platform === 'windows' ? '旧版，功能与最新截图不同' : (isBeta ? '未签名内测版' : '已签名与公证的正式版')}`;
}

async function loadRelease() {
  const recommended = currentPlatform();
  document.querySelector(`[data-platform="${recommended}"]`)?.classList.add('is-recommended');
  try {
    const response = await fetch(RELEASE_API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const release = await response.json();
    if (!release || release.draft || release.prerelease) throw new Error('No stable Latest release');
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const mac = findAsset(assets, 'mac');
    let windows = findAsset(assets, 'windows');
    let windowsVersion = release.tag_name;
    if (!windows) {
      const previous = await fetch(RELEASE_API.replace('/latest', '/tags/v0.6.0'), { headers: { Accept: 'application/vnd.github+json' } });
      if (previous.ok) {
        const stable = await previous.json();
        if (!stable.draft && !stable.prerelease) {
          windows = findAsset(stable.assets || [], 'windows');
          windowsVersion = stable.tag_name;
        }
      }
    }
    enableDownload('mac', mac, release.tag_name, release.prerelease);
    enableDownload('windows', windows, windowsVersion, false);

    const preferredAsset = recommended === 'windows' ? windows : mac;
    const selected = preferredAsset;
    const button = $('recommended-download');
    button.classList.remove('is-loading');
    if (selected) {
      button.href = selected.browser_download_url;
      const platformName = recommended === 'windows' && windows ? 'Windows' : 'macOS';
      button.querySelector('strong').textContent = `下载 ${platformName} ${recommended === 'windows' && windowsVersion !== release.tag_name ? '旧版' : (release.prerelease ? '内测版' : '版')}`;
      button.querySelector('small').textContent = `${recommended === 'windows' ? windowsVersion : release.tag_name} · ${formatBytes(selected.size)}`;
      $('release-status').textContent = release.prerelease
        ? `当前为 ${release.tag_name} 未签名内测版，首次打开可能出现系统安全提示。`
        : `macOS 最新正式版 ${release.tag_name} · 已签名与 Apple 公证。`;
    } else {
      button.href = release.html_url;
      button.querySelector('strong').textContent = '查看最新发布状态';
      button.querySelector('small').textContent = release.tag_name;
      $('release-status').textContent = '最新 Release 暂无可下载的安装包。';
    }
  } catch (error) {
    const button = $('recommended-download');
    button.classList.remove('is-loading');
    button.querySelector('strong').textContent = '前往 GitHub 下载';
    button.querySelector('small').textContent = '查看最新正式版本';
    $('release-status').textContent = '暂时无法读取版本信息，请从 GitHub Releases 下载。';
  }
}

loadRelease();

// 截图导航：真实图片保留原始内容，键盘可切换与放大。
const tabs = [...document.querySelectorAll('[data-screen]')];
const playButton = $('tour-play');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let playing = false;
let tourTimer;
let currentIndex = 0;
function stopTour() {
  playing = false;
  clearTimeout(tourTimer);
  playButton.textContent = '▶ 播放导览';
  playButton.setAttribute('aria-pressed', 'false');
  document.querySelector('.screens-section').classList.remove('is-playing');
}
function writeScreen(key, replace = false) {
  const url = new URL(location.href);
  url.searchParams.set('screen', key);
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
}
function selectScreen(tab, focus = false, persist = true, automatic = false) {
  if (!tab) return;
  if (!automatic) stopTour();
  currentIndex = tabs.indexOf(tab);
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(`screen-${item.dataset.screen}`).hidden = !selected;
  });
  $('tour-count').textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${tabs.length}`;
  $('tour-status').textContent = tab.textContent.replace(/^\d+/, '');
  $('tour-prev').disabled = currentIndex === 0;
  $('tour-next').disabled = currentIndex === tabs.length - 1;
  $('tour-progress-fill').style.width = `${(currentIndex + 1) / tabs.length * 100}%`;
  if (persist) writeScreen(tab.dataset.screen, automatic);
  if (focus) tab.focus();
}
function queueNext() {
  clearTimeout(tourTimer);
  tourTimer = setTimeout(() => {
    if (!playing) return;
    if (currentIndex === tabs.length - 1) { stopTour(); return; }
    selectScreen(tabs[currentIndex + 1], false, true, true);
    queueNext();
  }, 6000);
}
playButton.addEventListener('click', () => {
  if (playing) { stopTour(); return; }
  if (currentIndex === tabs.length - 1) selectScreen(tabs[0]);
  playing = true;
  playButton.textContent = 'Ⅱ 暂停导览';
  playButton.setAttribute('aria-pressed', 'true');
  document.querySelector('.screens-section').classList.add('is-playing');
  queueNext();
});
$('tour-prev').addEventListener('click', () => selectScreen(tabs[currentIndex - 1]));
$('tour-next').addEventListener('click', () => selectScreen(tabs[currentIndex + 1]));
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectScreen(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectScreen(tabs[next], true); }
  });
});
function restoreScreen() {
  const key = new URL(location.href).searchParams.get('screen');
  selectScreen(tabs.find(tab => tab.dataset.screen === key) || tabs[0], false, false);
}
restoreScreen();
window.addEventListener('popstate', restoreScreen);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopTour(); });
reducedMotion.addEventListener('change', stopTour);
if ('IntersectionObserver' in window) {
  const tourVisibility = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) stopTour();
  });
  tourVisibility.observe($('screens'));
}
const dialog = document.getElementById('screenshot-dialog');
let lastImageButton;
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  stopTour();
  lastImageButton = button;
  const image = document.getElementById('expanded-screenshot');
  image.src = button.dataset.image;
  image.alt = button.dataset.caption;
  document.getElementById('screenshot-caption').textContent = button.dataset.caption;
  dialog.showModal();
}));
document.getElementById('close-screenshot').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => lastImageButton?.focus());
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(section => observer.observe(section));
}
