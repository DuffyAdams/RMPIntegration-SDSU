# SDSU RateMyProfessor Integration

<p align="center">
  <img src="icon.png" alt="SDSU RateMyProfessor Extension Icon" width="128">
</p>

# SDSU RateMyProfessor Integration
A Chrome extension that seamlessly integrates RateMyProfessors ratings directly into the SDSU class search portal, helping students make informed decisions about their course selections.

## Features

- **Automatic Rating Display**: Ratings appear automatically next to professor names on the SDSU class search page
- **Real-Time Search**: Fetches the latest professor ratings from RateMyProfessors on-demand
- **Smart Caching**: Stores previously searched ratings for faster subsequent page loads
- **Toggle Control**: Easy on/off switch via popup interface
- **Manual Updates**: Refresh ratings data whenever needed

## Installation

### From Source

1. **Clone or download** this repository to your local machine
   ```bash
   git clone https://github.com/duffyadams/sdsu-rmp-extension.git
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)

3. **Load the extension**
   - Click **Load unpacked**
   - Select the extension directory

4. **Verify installation**
   - The extension icon should appear in your Chrome toolbar
   - You should see "SDSU RateMyProfessor Integration" in your extensions list

## Usage

### Basic Usage

1. **Enable the extension** by clicking the extension icon and ensuring the toggle is ON
2. **Navigate** to the SDSU class search page:
   ```
   https://cmsweb.cms.sdsu.edu/psc/CSDPRD_31/EMPLOYEE/SA/c/SSR_STUDENT_FL.SSR_MD_SP_FL.GBL
   ```
3. **View class sections** - professor ratings will appear automatically next to instructor names in the format:
   ```
   Professor Name (4.5 - 23)
   ```
   Where `4.5` is the rating (out of 5.0) and `23` is the number of reviews

### Extension Controls

Click the extension icon to access:
- **Enable/Disable Toggle**: Turn the rating display on or off
- **Update Button**: Manually refresh rating data from RateMyProfessors

## How It Works

### Architecture

The extension consists of three main components:

1. **Content Script** (`content.js`)
   - Monitors the SDSU class search page
   - Identifies professor names on the page
   - Requests rating data for each professor
   - Updates the page display with ratings

2. **Background Service Worker** (`background.js`)
   - Handles API requests to RateMyProfessors
   - Uses GraphQL API for primary data retrieval
   - Implements fallback scraping methods if API fails
   - Caches results in Chrome local storage

3. **Popup Interface** (`popup.js`, `popup.html`)
   - Provides user controls
   - Manages extension state
   - Triggers manual updates

### Data Flow

```
SDSU Page Load → Content Script Detects Professors
                           ↓
       Content Script Checks Cache for Ratings
                           ↓
           Cache Miss → Request to Background Script
                           ↓
       Background Script Queries RateMyProfessors API
                           ↓
           API Returns Rating Data → Cache Result
                           ↓
       Content Script Updates Page Display with Ratings
```

### Search Strategy

The extension uses a multi-tiered approach to find professor ratings:

1. **GraphQL API Query** (Primary method)
   - Searches RMP's GraphQL endpoint with full professor name
   - Filters results to SDSU (School ID: 877)

2. **Last Name Search** (Fallback #1)
   - If full name returns no results, searches by last name only
   - Useful for professors with middle names or name variations

3. **Direct Page Scraping** (Fallback #2)
   - Attempts to access professor's direct RMP page
   - Extracts rating data from HTML if API methods fail

## File Structure

```
sdsu-rmp-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API requests
├── content.js            # Page content manipulation
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── README.md             # This file
└── icons/                # Extension icons (if present)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Technical Details

### Permissions

The extension requires the following permissions:

- `storage`: Store cached rating data
- `tabs`: Access active tab information
- `activeTab`: Interact with the current page
- `host_permissions`:
  - `https://www.ratemyprofessors.com/*` - Fetch rating data
  - `https://cmsweb.cms.sdsu.edu/*` - Inject content script

### Storage

Data is stored in Chrome's local storage with the following schema:

```javascript
{
  "Enabled": 1,                    // Extension state (1 = on, 0 = off)
  "checkBoxState": true,           // Toggle state (true/false)
  "D. DABISH": "5.0 - 18",        // Professor rating cache
  "H. CHOI": "4.2 - 45",          // Format: "Rating - NumReviews"
  // ... more professors
}
```

### Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3 support)
- **Edge**: Chromium-based versions (88+)
- **Other Chromium browsers**: Should work with Manifest V3 support

## Privacy & Data

- **No personal data collection**: The extension does not collect or transmit any personal information
- **Local storage only**: All data is stored locally on your device
- **No tracking**: No analytics or usage tracking
- **Public data only**: Only accesses publicly available RateMyProfessors data

## Troubleshooting

### Ratings Not Appearing

1. **Check extension is enabled**
   - Click the extension icon
   - Ensure the toggle switch is ON

2. **Verify you're on the correct page**
   - Extension only works on SDSU class search pages
   - URL should contain `cmsweb.cms.sdsu.edu`

3. **Check browser console**
   - Press F12 to open Developer Tools
   - Look for messages starting with "RMP Extension:"
   - Check for any error messages

4. **Clear cache and reload**
   - Click the extension icon
   - Click the "Update" button
   - Refresh the SDSU page

### Professor Shows "N/A"

This can happen for several reasons:
- Professor is not listed on RateMyProfessors
- Professor name format doesn't match RMP database
- Temporary API connectivity issues

**To investigate:**
1. Manually search for the professor on RateMyProfessors.com
2. Check if their name format differs (middle name, nickname, etc.)
3. Try the Update button to refresh data

### API Rate Limiting

If you see many "N/A" results:
- RateMyProfessors may be rate-limiting requests
- Wait a few minutes and try the Update button
- Reload the extension from `chrome://extensions/`

## Development

### Local Development Setup

1. **Edit source files** as needed
2. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on the extension card
3. **Test changes** on SDSU class search page
4. **Check console logs** for debugging information

### Debug Mode

The extension includes extensive logging. To view debug information:

1. **Content Script logs**:
   - Open Developer Tools on SDSU page (F12)
   - Check Console tab

2. **Background Script logs**:
   - Go to `chrome://extensions/`
   - Click "service worker" under the extension
   - View console output

### Key Debug Messages

```
RMP Extension: Content script loaded!
RMP Extension: Found X instructor cells
RMP Extension: Processing instructor: [Name]
RMP Extension: Searching for professor: [Name]
RMP Extension: GraphQL response: [data]
RMP Extension: Found teacher: [Name] Rating: [X]
```

## Contributing

Contributions are welcome! To contribute:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and test thoroughly
4. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request**

### Code Style Guidelines

- Use clear, descriptive variable names
- Add comments for complex logic
- Include console.log statements for debugging
- Test on multiple professors and courses
- Ensure backward compatibility

## Known Issues

- **Middle names**: Professors with middle names may not match if RMP lists them differently
- **Special characters**: Names with accents or special characters may need normalization
- **Adjunct professors**: May not be listed on RateMyProfessors
- **New professors**: Recently hired professors may not have ratings yet

## Roadmap

Future enhancements under consideration:

- [ ] Display additional metrics (difficulty, would take again %)
- [ ] Color-coded rating indicators (green/yellow/red)
- [ ] Direct link to professor's RMP page
- [ ] Support for additional CSU campuses
- [ ] Offline mode with pre-cached data
- [ ] Rating trend indicators
- [ ] Course-specific ratings (if available)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to San Diego State University or RateMyProfessors.com. It is an independent tool created to help students access publicly available information more conveniently.

## Support

For issues, questions, or suggestions:
- **Report bugs**: [GitHub Issues](https://github.com/duffyadams/sdsu-rmp-extension/issues)
- **Feature requests**: [GitHub Discussions](https://github.com/adams/sdsu-rmp-extension/discussions)

## Acknowledgments

- Original author: Aaron Edlebeck
- RateMyProfessors for providing public rating data
- SDSU students for feedback and testing

---

**Made with ❤️ for SDSU students**