#!/bin/bash
git push origin master 
git branch -d green
git branch green
git push origin green
