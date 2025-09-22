# Peanut Butter Jelly - Product Requirements Document

## Vision
A delightfully simple Progressive Web App that helps couples track their biweekly cash flow with the comfort and familiarity of a PB&J sandwich - essential, satisfying, and perfectly paired.

## Brand Personality
- **Approachable**: Makes finance feel as comfortable as your favorite sandwich
- **Reliable**: Like the perfect PB&J, it's consistent and dependable
- **Simple**: Two ingredients (income + bills) make something great
- **Shared**: Best enjoyed together, like splitting a sandwich

## Core Problem
- Couples need shared visibility into biweekly cash flow cycles
- Difficulty tracking income vs. major recurring bills
- Need simple, focused tool that does one thing exceptionally well

## Target Users
- Primary: Married couples who get paid biweekly
- Both users need access to same real-time data
- Mobile-first usage expected

## Key Features

### MVP Features
1. **Biweekly Period Management**
   - Automatic 2-week period calculation from payday
   - Clear visualization of current period vs. upcoming period
   - Period-over-period comparison

2. **Income Tracking**
   - Single biweekly income entry
   - Net vs. gross income options
   - Visual income confirmation

3. **Recurring Bill Management**
   - Add/edit major recurring bills
   - Assign bills to specific weeks within the 2-week cycle
   - Bill due date tracking
   - Mark bills as paid/unpaid

4. **Real-time Cash Flow View**
   - Current period available cash
   - Upcoming obligations this period
   - Running balance calculation
   - Visual cash flow timeline

5. **Calendar Integration**
   - Monthly calendar view with bill indicators
   - Visual payday markers
   - Color-coded due dates
   - Quick day-detail access
   - Upcoming events summary

5. **Multi-user Sync**
   - Real-time updates between devices
   - Simple user identification (no complex auth needed)
   - Shared household view

6. **Calendar Integration** 
   - Dual-view interface (Overview + Calendar)
   - Visual bill placement on calendar
   - Color-coded financial events
   - Next 7 days quick preview

7. **PWA Capabilities**
   - Installable on mobile devices
   - Offline-first functionality
   - Push notifications for bill reminders

Mobile-first**: Optimized for phone screens
- **High Contrast**: Easy to read financial data
- **Color Psychology**: Green for positive cash flow, amber for caution, red for overages
- **Typography**: Large, readable numbers for quick scanning

## Technical Requirements

### Performance
- < 2 second initial load time
- Offline functionality for viewing data
- Real-time sync when online

### Compatibility
- iOS Safari, Android Chrome
- Progressive enhancement
- Responsive design (320px - 1200px)

### Data Storage
- Local storage for offline capability
- Cloud sync for multi-device access
- No sensitive financial account integration

### Deployment
- Vercel hosting
- Custom domain support
- HTTPS required for PWA

## User Flow

### Initial Setup
1. Set payday (determines 2-week cycles)
2. Enter biweekly income amount
3. Add major recurring bills with due dates
4. Invite spouse/partner

### Daily Usage
1. Open app → See current period overview
2. Mark bills as paid when completed
3. View remaining cash for period
4. Check upcoming bills

### Biweekly Cycle
1. New period automatically starts on payday
2. Reset bill payment status
3. Previous period archived for reference

## Success Metrics
- Daily active usage by both partners
- Reduction in financial stress (qualitative)
- Accurate cash flow prediction
- Zero missed bill payments

## Out of Scope (V1)
- Bank account integration
- Complex budgeting categories
- Investment tracking
- Detailed expense categorization
- Multiple income sources
- Advanced reporting/analytics

## Security & Privacy
- No bank account connections
- Local-first data storage
- Optional cloud backup
- Simple household sharing (no complex permissions)

## Future Considerations (V2+)
- Expense categorization
- Savings goals
- Bill payment automation
- Smart notifications
- Historical trends