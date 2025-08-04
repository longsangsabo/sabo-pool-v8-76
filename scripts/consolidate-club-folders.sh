#!/bin/bash

cd src/features/club/components

# Consolidate Dashboard folders
mv Dashboard/* dashboard/ 2>/dev/null
rmdir Dashboard 2>/dev/null

# Consolidate Members folders
mv Members/* members/ 2>/dev/null
rmdir Members 2>/dev/null

# Consolidate Settings folders
mv Settings/* settings/ 2>/dev/null
rmdir Settings 2>/dev/null

# Consolidate Tables folders
mv Tables/* table/ 2>/dev/null
rmdir Tables 2>/dev/null

# Consolidate Tournaments folders
mv Tournaments/* tournament/ 2>/dev/null
rmdir Tournaments 2>/dev/null

# Move verification files
mv Verification/* . 2>/dev/null
rmdir Verification 2>/dev/null

echo "Club component folders consolidated!"
