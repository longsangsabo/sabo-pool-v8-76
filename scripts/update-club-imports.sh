#!/bin/bash

cd src/features/club

# Update imports in hooks
sed -i 's|from "../../contexts/ClubContext"|from "@/features/club/contexts/ClubContext"|g' hooks/*.ts
sed -i 's|from "../../types/club.types"|from "@/features/club/types/club.types"|g' hooks/*.ts
sed -i 's|from "../../hooks/useClubMembers"|from "@/features/club/hooks/useClubMembers"|g' components/*/*.tsx
sed -i 's|from "../../hooks/useClubTournaments"|from "@/features/club/hooks/useClubTournaments"|g' components/*/*.tsx

echo "Club imports updated to use absolute paths!"
