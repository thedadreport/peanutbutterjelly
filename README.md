# Peanut Butter Jelly 🥜🍓

A delightfully simple Progressive Web App for biweekly cash flow tracking for couples.

## Features

✅ **Biweekly Period Management**
- Automatic 2-week period calculation from payday
- Period navigation and comparison
- Visual period timeline

✅ **Real-time Cash Flow Tracking**
- Available cash display
- Income vs. bills visualization
- Running balance calculations

✅ **Bill Management**
- Add/edit recurring bills
- Mark bills as paid/unpaid
- Due date tracking with visual indicators

✅ **Calendar Integration**
- Monthly calendar view with bill indicators
- Payday markers
- Next 7 days preview

✅ **Multi-device Sync**
- Real-time updates between devices
- Simple household sharing via share codes
- Local-first data storage

✅ **Progressive Web App**
- Installable on mobile devices
- Offline functionality
- Push notifications for bill reminders

## Getting Started

### Installation

1. **Clone or download** this project to your computer
2. **Open a terminal** in the project directory
3. **Serve the files** using any local web server:

```bash
# Using Python (if installed)
python -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Using PHP (if installed)
php -S localhost:8000
```

4. **Open your browser** and go to `http://localhost:8000`

### First-Time Setup

1. **Open Settings** (gear icon in bottom navigation)
2. **Set your payday** - this determines your 2-week cycles
3. **Enter your biweekly income**
4. **Add your recurring bills** using the + button
5. **Share with your partner** using the share code feature

### Daily Usage

1. **Mark bills as paid** by tapping on them
2. **View available cash** on the main dashboard
3. **Check upcoming bills** in the calendar view
4. **Navigate between periods** using the arrow buttons

## Household Sharing

### To share with your partner:

1. Go to **Settings**
2. Tap **"Share with Partner"**
3. Share the generated code with your partner
4. Code expires in 24 hours

### To join a household:

1. Go to **Settings**
2. Enter the **share code** you received
3. Tap **"Join Household"**

## Installing as an App

### On Mobile (iOS/Android):

1. Open the website in Safari (iOS) or Chrome (Android)
2. Look for the **"Install App"** prompt or
3. In Safari: Tap **Share → Add to Home Screen**
4. In Chrome: Tap **Menu → Add to Home Screen**

### On Desktop:

1. Look for the **install icon** in your browser's address bar
2. Or go to **Settings** and tap **"Install App"**

## Deployment

### For Personal Use:

Deploy to any static hosting service:

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Drag and drop the project folder
- **GitHub Pages**: Enable in your repository settings
- **Firebase Hosting**: Use `firebase deploy`

### For Production:

1. **Replace placeholder icons** in `/icons/` with actual PNG files
2. **Update the manifest.json** with your domain
3. **Set up proper backend sync** (Firebase, Supabase, etc.)
4. **Configure push notifications** with your service keys

## Technical Details

### Browser Support

- ✅ iOS Safari 13+
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Edge 80+

### Data Storage

- **Local Storage**: Primary data storage for offline use
- **IndexedDB**: (Future) For larger datasets
- **Cloud Sync**: Currently simulated with localStorage events

### Security

- No sensitive financial data is stored
- No bank account connections
- Local-first approach
- Optional cloud backup only

## Customization

### Colors and Branding

Edit `styles.css` to customize:
- Primary colors
- Typography
- Spacing and layout

### Features

Edit `app.js` to add:
- New bill categories
- Different period lengths
- Additional metrics

## Troubleshooting

### App not installing
- Ensure you're using HTTPS (required for PWA)
- Try refreshing the page
- Check browser compatibility

### Sync not working
- Check internet connection
- Ensure both devices are using the same share code
- Try refreshing both devices

### Bills not showing
- Check the current period dates
- Verify bill due dates are correct
- Try navigating to different periods

## Contributing

This is a personal project, but feel free to:
- Fork for your own use
- Submit bug reports
- Suggest improvements

## License

MIT License - feel free to use and modify for personal use.

---

Built with ❤️ for couples who want simple, effective cash flow tracking.