#!/bin/bash

# Get the day of week
_dow="$(date +'%A')"

# open database, wait up to 20 seconds for any activity to end and create a backup file
sqlite3 database.db << EOF
.timeout 20000
.backup ./bak/database_${_dow}.bak.sqlite3
EOF
