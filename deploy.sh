#! /bin/bash
git checkout hexo
git add .
git commit -m "部署: $(date)"
git push origin hexo
hexo g -d