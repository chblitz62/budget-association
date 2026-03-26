#!/bin/bash
cd "$(dirname "$0")"
npm run dev &
sleep 2
xdg-open http://localhost:5173
