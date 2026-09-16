#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESKTOP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RELEASE_DIR="${DESKTOP_DIR}/release"
UNPACKED_DIR="${RELEASE_DIR}/linux-unpacked"
ICON_FILE="$(cd "${DESKTOP_DIR}/../mobile/assets" && pwd)/icon.png"

if [ ! -d "${UNPACKED_DIR}" ]; then
  echo "Error: ${UNPACKED_DIR} does not exist. Run electron-builder first." >&2
  exit 1
fi

BUILD_DIR="$(mktemp -d -t timelogic-pacman-XXXXXX)"
trap 'rm -rf "${BUILD_DIR}"' EXIT

cat > "${BUILD_DIR}/PKGBUILD" << EOF
pkgname=timelogic-admin
pkgver=1.0.17
pkgrel=1
pkgdesc="TimeLogic attendance administration. Desktop administration app for the TimeLogic attendance platform."
arch=('x86_64')
url="https://timelogic.pages.dev"
license=()
depends=(
  'alsa-lib'
  'at-spi2-core'
  'cairo'
  'gtk3'
  'hicolor-icon-theme'
  'libcups'
  'libdrm'
  'libnotify'
  'libx11'
  'libxcb'
  'libxcomposite'
  'libxdamage'
  'libxext'
  'libxfixes'
  'libxkbcommon'
  'libxrandr'
  'libxss'
  'libxtst'
  'mesa'
  'nspr'
  'nss'
  'pango'
  'xdg-utils'
)
optdepends=(
  'libappindicator: AppIndicator support'
  'libayatana-appindicator: Ayatana AppIndicator support'
)
install=timelogic-admin.install

package() {
  install -d "\${pkgdir}/opt/timelogic-admin"
  cp -a "${UNPACKED_DIR}/." "\${pkgdir}/opt/timelogic-admin/"
  chmod 4755 "\${pkgdir}/opt/timelogic-admin/chrome-sandbox"

  install -d "\${pkgdir}/usr/bin"
  ln -sf "/opt/timelogic-admin/timelogic-admin" "\${pkgdir}/usr/bin/timelogic-admin"

  install -d "\${pkgdir}/usr/share/applications"
  cat > "\${pkgdir}/usr/share/applications/timelogic-admin.desktop" << 'DESKTOP_EOF'
[Desktop Entry]
Name=TimeLogic Admin
Comment=TimeLogic attendance administration
Exec=/opt/timelogic-admin/timelogic-admin %U
Terminal=false
Type=Application
Icon=timelogic-admin
Categories=Office;
StartupWMClass=TimeLogic Admin
DESKTOP_EOF

  install -Dm644 "${ICON_FILE}" "\${pkgdir}/usr/share/icons/hicolor/1024x1024/apps/timelogic-admin.png"
}
EOF

cat > "${BUILD_DIR}/timelogic-admin.install" << 'EOF'
post_install() {
	gtk-update-icon-cache -q -t -f usr/share/icons/hicolor
	command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
	update-desktop-database -q
}

post_upgrade() {
	post_install
}

post_remove() {
	gtk-update-icon-cache -q -t -f usr/share/icons/hicolor
	command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database -q /usr/share/applications || true
	update-desktop-database -q
}
EOF

cd "${BUILD_DIR}"
makepkg -d -f

mkdir -p "${RELEASE_DIR}"
cp "${BUILD_DIR}"/*.pkg.tar.zst "${RELEASE_DIR}/"
echo "Successfully built Arch Linux package in ${RELEASE_DIR}:"
ls -lh "${RELEASE_DIR}"/*.pkg.tar.zst
