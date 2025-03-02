help:
  just -l

build:
  npm run build

install: build
  mkdir -p /home/mlr/Documents/Notes/.obsidian/plugins/obsidian-formatter
  cp main.js /home/mlr/Documents/Notes/.obsidian/plugins/obsidian-formatter/main.js
  cp styles.css /home/mlr/Documents/Notes/.obsidian/plugins/obsidian-formatter/styles.css
  cp manifest.json /home/mlr/Documents/Notes/.obsidian/plugins/obsidian-formatter/manifest.json
