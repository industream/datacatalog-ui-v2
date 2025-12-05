#!/bin/sh

CONFIG_BK=/opt/frontend/datacatalog-ui/assets/config.json.bk
CONFIG=/opt/frontend/datacatalog-ui/assets/config.json
TMPCFG=/tmp/__cfg.json

# Function to ensure a value is double-quoted
quote_if_unquoted() {
  case $1 in
    \"*\") echo "$1" ;; # Already double-quoted, return as is
    *) echo "\"$1\"" ;; # Not double-quoted, add quotes
  esac
}

if [ -f "$CONFIG_BK" ]; then
  cp "$CONFIG_BK" "$CONFIG"
else
  cp "$CONFIG" "$CONFIG_BK"
fi

if [ ! -z "$DATACATALOG_API_URL" ]; then
    quoted_value=$(quote_if_unquoted "$DATACATALOG_API_URL")
    jq ".DATACATALOG_API_URL = $quoted_value" "$CONFIG" > "$TMPCFG"
    cp "$TMPCFG" "$CONFIG"
fi
