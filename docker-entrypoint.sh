#!/bin/sh

# Patch the database
node /app/built/index.js --patchall

exec $@