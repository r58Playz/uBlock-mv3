#!/bin/bash
set -euo pipefail

if [[ "$#" -le 3 ]]; then
	echo "usage: $0 <key> <update-url> <crx-out> <xml-out>"
	echo "generate a key with openssl genrsa -out <key> 2048"
	exit 1
fi

CHROMIUM=dist/build/uBlock0.chromium

KEY_FILE="$1"
UPDATE_URL="$2"
CRX_FILE="$3"
XML_FILE="$4"

make chromium
VERSION=$(jq -r '.version' "$CHROMIUM/manifest.json")
EXT_ID=$(openssl rsa -in "${KEY_FILE}" -pubout -outform DER 2>/dev/null | openssl dgst -sha256 -binary | head -c 16 | xxd -p | tr '0-9a-f' 'a-p')
CRX_FILE="dist/build/uBlock-${EXT_ID}-${VERSION}.crx"
XML_FILE="dist/build/uBlock-${EXT_ID}.xml"
CRX_URL="${UPDATE_URL}/uBlock-${EXT_ID}-${VERSION}.crx"
pnpx crx3 "$CHROMIUM" \
	--keyPath "${KEY_FILE}" \
	--crxPath "${CRX_FILE}" \
	--xmlPath "${XML_FILE}" \
	--crxURL "${CRX_URL}" \
	--appVersion "${VERSION}"
