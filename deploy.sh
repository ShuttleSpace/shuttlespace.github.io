#! /bin/bash
git checkout hexo
# generate
npx hexo g
npm run gulp
npx hexo d
# git
git add .
git commit -m "部署: $(date)"
git push origin hexo