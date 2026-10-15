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

// Keep previously shared ?screen=...#screens URLs working as section links.
function restoreFeatureLink() {
  const key = new URL(location.href).searchParams.get('screen');
  const target = key && document.getElementById(`screen-${key}`);
  if (target && (location.hash === '#screens' || !location.hash)) {
    target.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
}
window.addEventListener('load', restoreFeatureLink);
window.addEventListener('popstate', restoreFeatureLink);

const dialog = document.getElementById('screenshot-dialog');
let lastImageButton;
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
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

// Real native Demo actions; playback never submits a model request.
const OPERATION_STEPS = {"library": [{"src": "./assets/operations/library-01.webp", "caption": "打开「我的资料库」，从已有材料开始。"}, {"src": "./assets/operations/library-02.webp", "caption": "点击「经历与项目」，查看工作经历与项目。"}, {"src": "./assets/operations/library-03.webp", "caption": "点击「项目」过滤列表，工作经历暂时收起。"}], "experience": [{"src": "./assets/operations/experience-01.webp", "caption": "打开这段经历，检查职位、地点与责任成果。"}, {"src": "./assets/operations/experience-02.webp", "caption": "在「地点」中直接修改资料，保存按钮会变为可用。"}, {"src": "./assets/operations/experience-03.webp", "caption": "点击「保存」，回到经历列表，改动已写入匿名资料库。"}], "analysis": [{"src": "./assets/operations/analysis-01.webp", "caption": "选择「针对岗位定制」，先填公司与岗位。"}, {"src": "./assets/operations/analysis-02.webp", "caption": "填好公司和岗位，切换到「手动粘贴 JD」。"}, {"src": "./assets/operations/analysis-03.webp", "caption": "粘贴完整 JD 后，岗位分析入口变为可用；本演示不提交 AI 请求。"}, {"src": "./assets/operations/analysis-04.webp", "caption": "点击已保存岗位的「看清对方要什么」，查看预存 Demo 分析；没有新运行 AI。"}], "workbench": [{"src": "./assets/operations/workbench-01.webp", "caption": "打开已保存岗位，右侧显示六步执行流程。"}, {"src": "./assets/operations/workbench-02.webp", "caption": "切到「看清对方要什么」，核对要求、证据和差距。"}, {"src": "./assets/operations/workbench-03.webp", "caption": "切回「打磨与导出」，继续处理已保存的岗位简历。"}], "edit": [{"src": "./assets/operations/edit-01.webp", "caption": "点击右侧「AI 改简历」，打开当前岗位的修改助手。"}, {"src": "./assets/operations/edit-02.webp", "caption": "在输入框写清要改哪里、哪些事实要保留。"}, {"src": "./assets/operations/edit-03.webp", "caption": "检查修改要求再发送。此处只演示输入，未发送或生成新内容。"}], "templates": [{"src": "./assets/operations/templates-01.webp", "caption": "打开模板库，看到当前简历在不同版式里的真实预览。"}, {"src": "./assets/operations/templates-02.webp", "caption": "选择「学术紧凑」后，原来的正文重新排版；内容没有重新生成。"}, {"src": "./assets/operations/templates-03.webp", "caption": "点「原尺寸」检查排版，再回到预览使用导出入口。"}], "letter": [{"src": "./assets/operations/letter-01.webp", "caption": "切到「岗位求职信」，先选择对应的岗位简历。"}, {"src": "./assets/operations/letter-02.webp", "caption": "展开岗位下拉列表，选这封信对应的岗位。"}, {"src": "./assets/operations/letter-03.webp", "caption": "也可以从简历库的「生成或修改求职信」直达对应岗位；这里读取的是预存示例。"}, {"src": "./assets/operations/letter-04.webp", "caption": "打开「AI 改求职信」写修改要求；未发送，修改后仍需核对。"}], "versions": [{"src": "./assets/operations/versions-01.webp", "caption": "打开简历库，按岗位找到已保存的版本"}, {"src": "./assets/operations/versions-02.webp", "caption": "打开 Atlas 的岗位版本，查看这份简历和事实出处。"}, {"src": "./assets/operations/versions-03.webp", "caption": "返回简历库，再选另一份岗位版本。"}, {"src": "./assets/operations/versions-04.webp", "caption": "Northstar 版本独立保存，不会覆盖其他岗位的材料。"}], "pipeline": [{"src": "./assets/operations/pipeline-01.webp", "caption": "打开求职进程，先看今天需要处理的岗位"}, {"src": "./assets/operations/pipeline-02.webp", "caption": "点击「按阶段查看」，投递和面试分列呈现"}], "interview": [{"src": "./assets/operations/interview-01.webp", "caption": "打开面试岗位，查看轮次、时间与准备材料"}, {"src": "./assets/operations/interview-02.webp", "caption": "点击这一轮的「改」，打开面试安排表单"}, {"src": "./assets/operations/interview-03.webp", "caption": "把面试时长从 45 分钟改为 60 分钟"}, {"src": "./assets/operations/interview-04.webp", "caption": "点击「保存这轮」，岗位记录更新为 60 分钟"}]};
let activeOperation;
const operationPlayers = [];
document.querySelectorAll('[data-operation]').forEach(figure => {
  const steps = OPERATION_STEPS[figure.dataset.operation];
  const controls = figure.querySelector('.operation-controls');
  const play = controls.querySelector('.operation-play');
  const caption = controls.querySelector('.operation-caption');
  const count = controls.querySelector('.operation-count');
  const row = controls.querySelector('.operation-steps');
  const imageButton = figure.querySelector('.image-open');
  const image = imageButton.querySelector('img');
  const title = figure.closest('section').querySelector('.feature-number').textContent;
  let index = -1, timer, playing = false, generation = 0;
  const buttons = steps.map((step, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${i + 1}`;
    button.setAttribute('aria-label', `第 ${i + 1} 步：${step.caption}`);
    button.addEventListener('click', () => { pause(); show(i); });
    row.append(button);
    return button;
  });
  function pause() {
    playing = false;
    clearTimeout(timer);
    figure.classList.remove('is-playing');
    play.textContent = index === steps.length - 1 ? '↻ 重新播放' : '▶ 播放演示';
    play.setAttribute('aria-label', index === steps.length - 1 ? '重新播放操作演示' : '播放操作演示');
  }
  async function show(next) {
    const request = ++generation;
    play.disabled = true;
    figure.setAttribute('aria-busy', 'true');
    caption.textContent = '正在载入操作画面…';
    try {
      const frame = new Image();
      frame.src = steps[next].src;
      await frame.decode();
      if (request !== generation) return;
      index = next;
      image.src = frame.src;
      image.alt = `${title}：${steps[index].caption}`;
      imageButton.dataset.image = steps[index].src;
      imageButton.dataset.caption = image.alt;
      figure.classList.add('has-operation');
      caption.textContent = steps[index].caption;
      count.textContent = `第 ${index + 1} / ${steps.length} 步`;
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      if (playing) timer = setTimeout(() => {
        if (index < steps.length - 1) show(index + 1);
        else pause();
      }, 4200);
      else pause();
    } catch {
      if (request !== generation) return;
      pause();
      caption.textContent = '画面暂未载入，请点播放重试；也可先查看上方截图。';
    } finally {
      if (request === generation) {
        play.disabled = false;
        figure.removeAttribute('aria-busy');
      }
    }
  }
  play.addEventListener('click', () => {
    if (playing) { pause(); return; }
    activeOperation?.pause();
    activeOperation = player;
    playing = true;
    figure.classList.add('is-playing');
    play.textContent = 'Ⅱ 暂停';
    play.setAttribute('aria-label', '暂停操作演示');
    show(index < 0 || index === steps.length - 1 ? 0 : index);
  });
  const player = { figure, pause };
  operationPlayers.push(player);
  controls.hidden = false;
  imageButton.addEventListener('click', pause);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) activeOperation?.pause();
});
if ('IntersectionObserver' in window) {
  const visibility = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) operationPlayers.find(player => player.figure === entry.target)?.pause();
  }));
  operationPlayers.forEach(player => visibility.observe(player.figure));
}
