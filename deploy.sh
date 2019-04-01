#! /bin/bash
git checkout hexo
# generate
hexo g
npm run gulp
hexo d
# git
git add .
git commit -m "部署: $(date)"
git push origin hexo