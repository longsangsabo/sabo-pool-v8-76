#!/bin/bash

# Move nested components back to correct location
mv src/features/club/components/components/* src/features/club/components/
rmdir src/features/club/components/components

# Fix nested contexts folder
mv src/features/club/contexts/contexts/* src/features/club/contexts/
rmdir src/features/club/contexts/contexts

# Fix nested hooks folder 
mv src/features/club/hooks/hooks/* src/features/club/hooks/
rmdir src/features/club/hooks/hooks

# Fix nested types folder
mv src/features/club/types/types/* src/features/club/types/
rmdir src/features/club/types/types

echo "Club system folder structure fixed!"
