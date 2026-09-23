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
  link.textContent = platform === 'mac' ? `下载 macOS ${isBeta ? '内测版' : '版'}` : `下载 Windows ${isBeta ? '内测版' : '版'}`;
  meta.textContent = `${version} · ${formatBytes(asset.size)} · ${isBeta ? 'unsigned beta' : 'production release'}`;
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
    const windows = findAsset(assets, 'windows');
    enableDownload('mac', mac, release.tag_name, release.prerelease);
    enableDownload('windows', windows, release.tag_name, release.prerelease);

    const preferredAsset = recommended === 'windows' ? windows : mac;
    const fallbackAsset = mac || windows;
    const selected = preferredAsset || fallbackAsset;
    const button = $('recommended-download');
    button.classList.remove('is-loading');
    if (selected) {
      button.href = selected.browser_download_url;
      const platformName = recommended === 'windows' && windows ? 'Windows' : 'macOS';
      button.querySelector('strong').textContent = `下载 ${platformName} ${release.prerelease ? '内测版' : '版'}`;
      button.querySelector('small').textContent = `${release.tag_name} · ${formatBytes(selected.size)}`;
      $('release-status').textContent = release.prerelease
        ? `当前为 ${release.tag_name} 未签名内测版，首次打开可能出现系统安全提示。`
        : `最新正式版本 ${release.tag_name}，由 GitHub production release 提供。`;
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
