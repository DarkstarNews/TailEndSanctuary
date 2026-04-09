#!/bin/bash

# Remove all emojis from HTML files and replace with professional alternatives

# Index.html - Replace value icons
sed -i '' 's|<div class="icon">🤲</div>|<div class="icon" style="font-weight: 600; color: var(--sage);">•</div>|g' index.html
sed -i '' 's|<div class="icon">🤝</div>|<div class="icon" style="font-weight: 600; color: var(--sage);">•</div>|g' index.html
sed -i '' 's|<div class="icon">❤️</div>|<div class="icon" style="font-weight: 600; color: var(--sage);">•</div>|g' index.html

# Footer emojis
sed -i '' 's|📧 <a href="mailto:|<span style="font-weight: 600;">✉</span> <a href="mailto:|g' *.html
sed -i '' 's|<a href="#" class="social-icon" aria-label="Instagram">📷</a>|<a href="#" class="social-icon" aria-label="Instagram">IG</a>|g' *.html

# Donate buttons
sed -i '' 's|♥ Donate|Donate|g' *.html
sed -i '' 's|♥ DONATE|DONATE|g' *.html

# Heart symbols
sed -i '' 's|<span class="heart">♡</span>|<span class="heart" style="font-weight: 400;">·</span>|g' *.html
sed -i '' 's|<span style="font-size: 2rem;">♡</span>||g' *.html
sed -i '' 's|<div style="font-size: 2.5rem; margin-top: 20px;">♡</div>||g' *.html
sed -i '' 's|<div style="font-size: 3rem;">❤️</div>||g' *.html
sed -i '' 's|<span style="font-size: 1.6rem;">♡</span>||g' *.html

# Dog-related emojis
sed -i '' 's|❤️ 🐾||g' *.html
sed -i '' 's|🐾||g' *.html

# Contact page specific
sed -i '' 's|<div class="icon">📧</div>|<div class="icon">✉</div>|g' contact.html
sed -i '' 's|<div class="icon">♥</div>|<div class="icon" style="font-weight: 600;">•</div>|g' contact.html

# Donate page specific
sed -i '' 's|♡ Make a Difference Today|Make a Difference Today|g' donate.html
sed -i '' 's|<span style="color: var(--brown); font-size: 1.5rem;">❤️</span>|<span style="color: var(--brown); font-size: 1.5rem; font-weight: 600;">•</span>|g' donate.html
sed -i '' 's|<span style="color: var(--sage); font-size: 1.2rem;">🤲</span>|<span style="color: var(--sage); font-size: 1.2rem; font-weight: 600;">•</span>|g' donate.html
sed -i '' 's|<span style="color: var(--sage-dark); font-size: 1.2rem;">😊</span>||g' donate.html

echo "Emojis removed successfully!"
