#!/bin/bash
find . -maxdepth 1 -type f | grep -v -e '.sh$' | xargs -n1 rm

