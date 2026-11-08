# Glass New Tab

A Chrome/Chromium Manifest V3 extension that replaces the new tab page.

## Features
- Glassmorphism panels and controls
- Optional sharp, unblurred background image (stored locally in browser storage; maximum 5 MB)
- Time-aware greeting (Good morning / afternoon / evening) with an editable name
- Clock remains centred independently of the 12H/24H toggle
- Animated split-flap-inspired clock with a horizontal centre line
- 12/24-hour toggle and three clock sizes
- Up to six editable favourite website cards
- Centre layout or clock-left / favourites-right layout
- Favourite site: click to open, right-click to edit

## Install in Chrome
1. Extract `glass_newtab_extension.zip`.
2. Open `chrome://extensions`.
3. Turn on **Developer mode**.
4. Choose **Load unpacked**.
5. Select the extracted `glass_newtab_extension` folder.
6. Open a new tab. If another extension already overrides the new tab page, disable that extension.

## Notes
- This project uses only local extension storage. It does not collect or send your settings anywhere.
- Favicons are requested from Google's favicon service; site links open the URLs you save.
- To change the default six sites, edit `DEFAULT_SITES` in `newtab.js`.
- The clock animation is a CSS flip transition, not a video or external font.
