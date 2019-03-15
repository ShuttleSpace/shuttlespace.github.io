#! /bin/bash
git checkout hexo
git add .
git commit -m "TeamCity CI 提交部署: $(date)"
git push origin hexo
hexo g -d