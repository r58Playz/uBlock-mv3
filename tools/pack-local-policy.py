#!/usr/bin/env python3
"""Build a policy-installed Chromium CRX from this checkout.

All generated files, including the private signing key, stay in
dist/local-policy/. The policy uses file:// URLs, so no server is needed.
The dedicated test profile is removed after a successful build so Chromium
installs the new package even when its version has not changed.
"""

import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "dist/build/uBlock0.chromium"
OUT = ROOT / "dist/local-policy"
KEY = OUT / "key.pem"
PROFILE = OUT / "browser-profile"
BROWSER = os.environ.get("CHROMIUM", "/usr/bin/chromium")


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def extension_id():
    public_key = run(
        "openssl", "pkey", "-in", str(KEY), "-pubout", "-outform", "DER",
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    ).stdout
    digest = hashlib.sha256(public_key).hexdigest()[:32]
    return digest.translate(str.maketrans("0123456789abcdef", "abcdefghijklmnop"))


def check_profile_stopped():
    if PROFILE.is_symlink():
        raise RuntimeError(f"refusing to remove symlinked profile: {PROFILE}")
    lock = PROFILE / "SingletonLock"
    if not lock.is_symlink():
        return
    pid_text = os.readlink(lock).rsplit("-", 1)[-1]
    if not pid_text.isdigit():
        return
    try:
        os.kill(int(pid_text), 0)
    except ProcessLookupError:
        return
    except PermissionError:
        pass
    raise RuntimeError(f"close Chromium using {PROFILE} before rebuilding")


def check_version(version):
    if not re.fullmatch(r"\d+(?:\.\d+){0,3}", version):
        raise ValueError("dist/version is not a Chromium extension version")
    if any(int(part) > 65535 for part in version.split(".")):
        raise ValueError("dist/version has a component above Chromium's limit")


def main():
    os.umask(0o077)
    OUT.mkdir(parents=True, exist_ok=True)
    check_profile_stopped()
    run("make", "chromium", cwd=ROOT)

    if not KEY.exists():
        run("openssl", "genrsa", "-out", str(KEY), "2048",
            stdout=subprocess.DEVNULL)
    KEY.chmod(0o600)
    ext_id = extension_id()

    version = (ROOT / "dist/version").read_text().strip()
    check_version(version)
    manifest_path = BUILD / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    manifest["version"] = version
    manifest["update_url"] = (OUT / "update.xml").as_uri()
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

    packed = BUILD.with_suffix(".chromium.crx")
    # Chromium writes the CRX beside the extension directory. Remove a stale
    # result before packing so a failed pack can never be mistaken for success.
    packed.unlink(missing_ok=True)
    run(BROWSER, f"--pack-extension={BUILD}", f"--pack-extension-key={KEY}",
        "--no-first-run", stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if not packed.is_file():
        raise RuntimeError(f"Chromium did not produce {packed}")
    crx = OUT / f"uBlock0_{version}.crx"
    packed.replace(crx)
    crx.chmod(0o644)

    root = ET.Element("gupdate", {
        "xmlns": "http://www.google.com/update2/response", "protocol": "2.0",
    })
    app = ET.SubElement(root, "app", {"appid": ext_id})
    ET.SubElement(app, "updatecheck", {
        "codebase": crx.as_uri(), "version": version,
    })
    ET.indent(root)
    ET.ElementTree(root).write(OUT / "update.xml", encoding="unicode",
                               xml_declaration=True)
    (OUT / "update.xml").chmod(0o644)

    policy = {"ExtensionInstallForcelist": [
        f"{ext_id};{(OUT / 'update.xml').as_uri()}"
    ]}
    (OUT / "policy.json").write_text(json.dumps(policy, indent=2) + "\n")
    (OUT / "policy.json").chmod(0o644)
    check_profile_stopped()
    if PROFILE.exists():
        shutil.rmtree(PROFILE)
        print(f"Reset profile: {PROFILE}")

    print(f"Extension ID: {ext_id}")
    print(f"Version:      {version}")
    print(f"CRX:          {crx}")
    print(f"Update XML:   {OUT / 'update.xml'}")
    print(f"Policy:       {OUT / 'policy.json'}")
    print("Install policy: sudo install -Dm644 dist/local-policy/policy.json "
          "/etc/chromium/policies/managed/ubo-local.json")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError, RuntimeError) as error:
        print(f"pack-local-policy: {error}", file=sys.stderr)
        if isinstance(error, subprocess.CalledProcessError) and error.stderr:
            print(error.stderr.decode(errors="replace")[-2000:], file=sys.stderr)
        sys.exit(1)
