#!/usr/bin/env bash
set -euo pipefail

SUBPATH="landrice_2026"
DIST="dist"
TARGET="$DIST/$SUBPATH"

rm -rf "$DIST"
mkdir -p "$TARGET"

cp index.html styles.css script.js data.json favicon.ico "$TARGET/"

cat > "$DIST/index.html" <<EOF
<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0; url=/$SUBPATH/" />
    <link rel="canonical" href="/$SUBPATH/" />
    <title>Redirect</title>
  </head>
  <body>
    <p><a href="/$SUBPATH/">Перейти к дашборду</a></p>
  </body>
</html>
EOF

echo "Deploy bundle ready: $DIST"
echo "  /$SUBPATH/  <- dashboard"
echo "  /index.html <- redirect to /$SUBPATH/"
