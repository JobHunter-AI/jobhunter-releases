import hashlib,json,os,re,subprocess,urllib.request,urllib.parse,zipfile
from pathlib import Path

def expected(version):
    if not re.fullmatch(r"0\.\d+\.\d+",version):raise ValueError("Invalid stable version")
    return {"JobHunter-"+version+"-macos-universal.dmg","jobhunter-"+version+"-darwin-universal.app.tar.gz","jobhunter-"+version+"-windows-x86_64-setup.exe","latest.json"}
def validate_names(names,version):
    if set(names)!=expected(version):raise ValueError("Release requires exactly both installers, macOS updater and latest.json")
def validate_url(url):
    p=urllib.parse.urlparse(url)
    if p.scheme!="https" or not p.hostname or not p.hostname.endswith(".blob.core.windows.net"):raise ValueError("Expected GitHub Actions artifact storage URL")
def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for chunk in iter(lambda:f.read(1048576),b""):h.update(chunk)
    return h.hexdigest()
def gh(*args):return subprocess.check_output(["gh",*args],text=True)
def main():
    version=os.environ["VERSION"];names=expected(version);url=os.environ["ARTIFACT_URL"];validate_url(url)
    urllib.request.urlretrieve(url,"release-bundle.zip")
    if sha("release-bundle.zip")!=os.environ["ARTIFACT_SHA256"].removeprefix("sha256:"):raise ValueError("Artifact SHA-256 mismatch")
    with zipfile.ZipFile("release-bundle.zip") as z:
        allowed={"release-evidence.json"}|{"dist-release/"+n for n in names}
        for item in z.infolist():
            if item.is_dir():continue
            if item.filename not in allowed or (item.external_attr>>16)&0o170000==0o120000:raise ValueError("Unexpected artifact member")
        z.extractall("bundle")
    root=Path("bundle/dist-release");validate_names([p.name for p in root.iterdir()],version)
    evidence=json.loads(Path("bundle/release-evidence.json").read_text())
    if evidence["version"]!=version or evidence["source_sha"]!=os.environ["SOURCE_SHA"] or str(evidence["source_run"])!=os.environ["SOURCE_RUN"] or evidence["source_repository"]!="JobHunter-AI/jobhunter-desktop":raise ValueError("Source provenance mismatch")
    for p in root.iterdir():
        if sha(p)!=evidence["files"][p.name]["sha256"] or p.stat().st_size!=evidence["files"][p.name]["bytes"]:raise ValueError("File hash or length mismatch")
    manifest=json.loads((root/"latest.json").read_text())
    if manifest["version"]!=version or set(manifest["platforms"])!={"darwin-aarch64","darwin-x86_64","windows-x86_64"}:raise ValueError("Incomplete updater manifest")
    for platform,entry in manifest["platforms"].items():
        name="jobhunter-"+version+("-windows-x86_64-setup.exe" if platform.startswith("windows") else "-darwin-universal.app.tar.gz")
        if entry["url"]!="https://github.com/JobHunter-AI/jobhunter-releases/releases/download/v"+version+"/"+name or not entry["signature"].strip():raise ValueError("Wrong updater URL or missing signature")
    repo=os.environ["GITHUB_REPOSITORY"];tag="v"+version
    if repo!="JobHunter-AI/jobhunter-releases" or json.loads(gh("api","repos/"+repo))["private"]:raise ValueError("Wrong publication repository")
    tree=json.loads(gh("api","repos/"+repo+"/git/trees/main?recursive=1"))
    for entry in tree["tree"]:
        if re.search(r"(^|/)(src|src-tauri|skills|templates)(/|$)|(^|/)(Cargo\.(toml|lock)|package(-lock)?\.json|\.env.*)$",entry["path"],re.I):raise ValueError("App source in public tag tree")
    mode=os.environ["MODE"]
    if mode=="formal" and not os.environ.get("WINDOWS_ACCEPTANCE","").strip():raise ValueError("Clean Windows install/login acceptance record required before Latest")
    try:release=json.loads(gh("release","view",tag,"--repo",repo,"--json","isPrerelease,assets"))
    except subprocess.CalledProcessError:release=None
    if release is None:
        if mode!="candidate":raise ValueError("Publish and verify the same candidate before promotion")
        notes="Windows 10/11 x64 installer included. Windows installer is unsigned: Unknown publisher / SmartScreen prompts may appear. macOS installer is Developer ID signed and notarized. Windows clean-machine login acceptance is pending."
        gh("release","create",tag,"--repo",repo,"--target","main","--title","求职匠 "+version,"--notes",notes,"--prerelease","--latest=false",*[str(p) for p in root.iterdir()])
    elif mode=="candidate":
        if not release["isPrerelease"]:raise ValueError("Existing stable versions are immutable")
        validate_names([a["name"] for a in release["assets"]],version)
    for p in root.iterdir():
        public="https://github.com/"+repo+"/releases/download/"+tag+"/"+p.name
        urllib.request.urlretrieve(public,"public-readback.bin")
        if sha("public-readback.bin")!=evidence["files"][p.name]["sha256"]:raise ValueError("Public download hash mismatch")
        print(p.name,p.stat().st_size,sha(p))
    if mode=="formal":
        notes="Windows 10/11 x64 installer included. Windows installer is unsigned: Unknown publisher / SmartScreen prompts may appear. macOS installer is Developer ID signed and notarized."
        gh("release","edit",tag,"--repo",repo,"--prerelease=false","--latest","--notes",notes)
        latest=json.loads(gh("api","repos/"+repo+"/releases/latest"))
        if latest["tag_name"]!=tag or latest["prerelease"]:raise ValueError("Latest promotion not confirmed")
    print("https://github.com/"+repo+"/releases/tag/"+tag)
if __name__=="__main__":main()
