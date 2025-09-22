class PeanutButterJelly {
    constructor() {
        this.data = {
            payday: null, // Starting payday date
            biweeklyIncome: 0,
            bills: [],
            currentPeriodOffset: 0,
            settings: {
                householdName: '',
                partnerName: '',
                notifications: true
            }
        };

        this.currentView = 'overview';
        this.init();
    }

    init() {
        // Initialize authentication first
        window.auth = new HouseholdAuth(this);
        window.auth.init();

        // Only proceed if authenticated
        if (!window.auth.isUserAuthenticated()) {
            return; // Auth system will handle login/setup
        }

        this.loadData();
        this.registerServiceWorker();
        this.setupEventListeners();
        this.updateTime();
        this.calculateCurrentPeriod();

        // Maintain recurring bills
        this.maintainRecurringBills();

        this.renderCurrentView();

        // Initialize sync manager
        this.syncManager = new SyncManager(this);
        this.syncManager.enableRealTimeSync();

        // Update time every minute
        setInterval(() => this.updateTime(), 60000);

        // Maintain recurring bills daily
        setInterval(() => this.maintainRecurringBills(), 24 * 60 * 60 * 1000);
    }

    // Service Worker Registration
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('SW registered: ', registration);
                })
                .catch(registrationError => {
                    console.log('SW registration failed: ', registrationError);
                });
        }
    }

    // Data Management
    loadData() {
        const savedData = localStorage.getItem('pbj-data');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);

                // Merge with defaults to ensure all properties exist
                this.data = {
                    ...this.data,
                    ...parsed
                };

                // Convert date strings back to Date objects
                if (this.data.payday) {
                    this.data.payday = new Date(this.data.payday);
                }

                if (this.data.bills && Array.isArray(this.data.bills)) {
                    this.data.bills = this.data.bills.map(bill => ({
                        ...bill,
                        dueDate: new Date(bill.dueDate),
                        createdAt: bill.createdAt ? new Date(bill.createdAt) : new Date(),
                        frequency: bill.frequency || 'once',
                        isRecurring: bill.isRecurring !== undefined ? bill.isRecurring : false
                    }));
                } else {
                    this.data.bills = [];
                }

                // Ensure settings exist
                if (!this.data.settings) {
                    this.data.settings = {
                        householdName: '',
                        partnerName: '',
                        notifications: true
                    };
                }

                console.log('Data loaded successfully:', this.data);
            } catch (error) {
                console.error('Error loading data:', error);
                this.setupSampleData();
            }
        } else {
            // First-time setup with sample data
            this.setupSampleData();
        }
    }

    saveData() {
        this.data.lastModified = Date.now();

        // Save to household account if authenticated
        if (window.auth && window.auth.isUserAuthenticated()) {
            const householdData = JSON.parse(localStorage.getItem('pbj-household'));
            householdData.data = this.data;
            localStorage.setItem('pbj-household', JSON.stringify(householdData));
        } else {
            // Fallback to old storage method
            localStorage.setItem('pbj-data', JSON.stringify(this.data));
        }

        // Sync with other devices if online
        if (navigator.onLine && this.syncManager) {
            this.syncManager.broadcastUpdate(this.data);
        }
    }

    setupSampleData() {
        const today = new Date();
        const payday = new Date(today);
        payday.setDate(today.getDate() - (today.getDay() + 1) % 14); // Find most recent Friday

        this.data = {
            payday: payday,
            biweeklyIncome: 2100,
            bills: [
                {
                    id: Date.now() + 1,
                    name: 'Rent',
                    amount: 1200,
                    dueDate: new Date(2025, 0, 28), // Jan 28, 2025
                    category: 'Housing',
                    isPaid: false,
                    isRecurring: true,
                    frequency: 'monthly',
                    createdAt: new Date()
                },
                {
                    id: Date.now() + 2,
                    name: 'Car Insurance',
                    amount: 127,
                    dueDate: new Date(2025, 0, 15), // Jan 15, 2025
                    category: 'Transportation',
                    isPaid: true,
                    isRecurring: true,
                    frequency: 'monthly',
                    createdAt: new Date()
                },
                {
                    id: Date.now() + 3,
                    name: 'Phone Bill',
                    amount: 85,
                    dueDate: new Date(2025, 0, 22), // Jan 22, 2025
                    category: 'Utilities',
                    isPaid: false,
                    isRecurring: true,
                    frequency: 'monthly',
                    createdAt: new Date()
                },
                {
                    id: Date.now() + 4,
                    name: 'Utilities',
                    amount: 165,
                    dueDate: new Date(2025, 0, 25), // Jan 25, 2025
                    category: 'Utilities',
                    isPaid: false,
                    isRecurring: true,
                    frequency: 'monthly',
                    createdAt: new Date()
                }
            ],
            currentPeriodOffset: 0,
            settings: {
                householdName: 'The Johnson Family',
                partnerName: 'Your Partner',
                notifications: true
            }
        };
        this.saveData();
    }

    // Period Calculations
    calculateCurrentPeriod() {
        if (!this.data.payday) return { start: new Date(), end: new Date() };

        const payday = new Date(this.data.payday);
        const offsetWeeks = this.data.currentPeriodOffset * 2;

        const periodStart = new Date(payday);
        periodStart.setDate(payday.getDate() + (offsetWeeks * 7));

        const periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 13);

        return { start: periodStart, end: periodEnd };
    }

    getPeriodBills(period = null) {
        if (!period) period = this.calculateCurrentPeriod();

        return this.data.bills.filter(bill => {
            const billDate = new Date(bill.dueDate);
            return billDate >= period.start && billDate <= period.end;
        });
    }

    calculateCashFlow(period = null) {
        if (!period) period = this.calculateCurrentPeriod();

        const periodBills = this.getPeriodBills(period);
        const totalBills = periodBills.reduce((sum, bill) => sum + bill.amount, 0);
        const unpaidBills = periodBills.filter(bill => !bill.isPaid).reduce((sum, bill) => sum + bill.amount, 0);
        const paidBills = periodBills.filter(bill => bill.isPaid).reduce((sum, bill) => sum + bill.amount, 0);

        const availableCash = this.data.biweeklyIncome - paidBills;

        return {
            income: this.data.biweeklyIncome,
            totalBills,
            unpaidBills,
            paidBills,
            availableCash,
            projectedBalance: this.data.biweeklyIncome - totalBills
        };
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const view = e.target.textContent.toLowerCase();
                this.showView(view);
            });
        });

        // Period navigation
        document.querySelector('.period-nav').addEventListener('click', (e) => {
            if (e.target.classList.contains('period-btn')) {
                const direction = e.target.textContent === '›' ? 1 : -1;
                this.navigatePeriod(direction);
            }
        });

        // Bill interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.bill-item')) {
                this.toggleBillStatus(e.target.closest('.bill-item'));
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });

        // Online/offline events
        window.addEventListener('online', () => this.syncData());
        window.addEventListener('offline', () => this.showOfflineIndicator());
    }

    // UI Updates
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
        });

        document.getElementById('current-time').textContent = timeString;

        // Update battery if available
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                const batteryPercent = Math.round(battery.level * 100);
                document.getElementById('battery-status').textContent = `${batteryPercent}%`;
            });
        }
    }

    showView(view) {
        // Update nav pills
        document.querySelectorAll('.nav-pill').forEach(pill => {
            pill.classList.remove('active');
            if (pill.textContent.toLowerCase() === view) {
                pill.classList.add('active');
            }
        });

        // Update bottom nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.toLowerCase().includes(view)) {
                item.classList.add('active');
            }
        });

        // Show/hide views
        document.getElementById('overview-view').style.display = view === 'overview' ? 'block' : 'none';
        document.getElementById('calendar-view').style.display = view === 'calendar' ? 'block' : 'none';

        this.currentView = view;
        this.renderCurrentView();
    }

    navigatePeriod(direction) {
        this.data.currentPeriodOffset += direction;
        this.renderCurrentView();
    }

    renderCurrentView() {
        const period = this.calculateCurrentPeriod();

        // Update period display
        const periodText = `${this.formatDate(period.start, 'MMM d')} – ${this.formatDate(period.end, 'd, yyyy')}`;
        document.getElementById('current-period').textContent = periodText;

        // Add current user indicator
        this.updateCurrentUserDisplay();

        if (this.currentView === 'overview') {
            this.renderOverview();
        } else if (this.currentView === 'calendar') {
            this.renderCalendar();
        }
    }

    renderOverview() {
        const cashFlow = this.calculateCashFlow();
        const period = this.calculateCurrentPeriod();
        const periodBills = this.getPeriodBills(period);

        // Update cash flow display
        document.getElementById('available-cash').textContent = this.formatCurrency(cashFlow.availableCash);
        document.getElementById('period-income').textContent = this.formatCurrency(cashFlow.income);
        document.getElementById('bills-due').textContent = this.formatCurrency(cashFlow.unpaidBills);

        // Update balance change (compare with previous period)
        const previousPeriod = this.calculatePreviousPeriod();
        const previousCashFlow = this.calculateCashFlow(previousPeriod);
        const change = cashFlow.availableCash - previousCashFlow.availableCash;
        const changeText = change >= 0 ?
            `+${this.formatCurrency(Math.abs(change))} from last period` :
            `-${this.formatCurrency(Math.abs(change))} from last period`;
        document.getElementById('balance-change').textContent = changeText;

        // Render bills list
        this.renderBillsList(periodBills);
    }

    renderBillsList(bills) {
        const billsList = document.getElementById('bills-list');
        billsList.innerHTML = '';

        bills.forEach(bill => {
            const billElement = this.createBillElement(bill);
            billsList.appendChild(billElement);
        });
    }

    createBillElement(bill) {
        const billDiv = document.createElement('div');
        billDiv.className = 'bill-item';
        billDiv.dataset.billId = bill.id;

        const dueText = this.getBillDueText(bill);
        const statusClass = this.getBillStatusClass(bill);
        const frequencyIcon = this.getFrequencyIcon(bill.frequency);

        billDiv.innerHTML = `
            <div class="bill-info">
                <div class="bill-name">${bill.name} ${frequencyIcon}</div>
                <div class="bill-due">${dueText}</div>
            </div>
            <div class="bill-amount">${this.formatCurrency(bill.amount)}</div>
            <div class="bill-status ${statusClass}"></div>
        `;

        return billDiv;
    }

    getFrequencyIcon(frequency) {
        switch (frequency) {
            case 'weekly':
                return '<span style="opacity: 0.6; font-size: 12px;">🔄7d</span>';
            case 'biweekly':
                return '<span style="opacity: 0.6; font-size: 12px;">🔄14d</span>';
            case 'monthly':
                return '<span style="opacity: 0.6; font-size: 12px;">🔄30d</span>';
            case 'once':
            default:
                return '<span style="opacity: 0.6; font-size: 12px;">🔸</span>';
        }
    }

    getBillDueText(bill) {
        if (bill.isPaid) {
            return `Paid ${this.formatDate(bill.dueDate, 'MMM d')}`;
        }

        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) return 'Due today';
        if (daysDiff === 1) return 'Due tomorrow';
        if (daysDiff < 0) return `Overdue by ${Math.abs(daysDiff)} days`;
        return `Due ${this.formatDate(dueDate, 'MMM d')}`;
    }

    getBillStatusClass(bill) {
        if (bill.isPaid) return 'paid';

        const today = new Date();
        const dueDate = new Date(bill.dueDate);
        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 3) return 'due';
        return '';
    }

    renderCalendar() {
        const period = this.calculateCurrentPeriod();
        const calendarGrid = document.getElementById('calendar-grid');
        const today = new Date();

        // Get the first day of the month for the current period
        const firstDayOfMonth = new Date(period.start.getFullYear(), period.start.getMonth(), 1);
        const lastDayOfMonth = new Date(period.start.getFullYear(), period.start.getMonth() + 1, 0);

        // Calculate calendar start (first Sunday of the calendar)
        const calendarStart = new Date(firstDayOfMonth);
        calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());

        calendarGrid.innerHTML = '';

        // Add headers
        const headers = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        headers.forEach(header => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'calendar-header';
            headerDiv.textContent = header;
            calendarGrid.appendChild(headerDiv);
        });

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(calendarStart);
            currentDate.setDate(calendarStart.getDate() + i);

            const dayDiv = this.createCalendarDay(currentDate, period, today);
            calendarGrid.appendChild(dayDiv);
        }

        // Render upcoming events
        this.renderUpcomingEvents();
    }

    createCalendarDay(date, period, today) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        const isToday = this.isSameDay(date, today);
        const isCurrentMonth = date.getMonth() === period.start.getMonth();
        const isPayday = this.isPayday(date);
        const hasBill = this.data.bills.some(bill => this.isSameDay(bill.dueDate, date));

        if (isToday) dayDiv.classList.add('today');
        if (!isCurrentMonth) dayDiv.classList.add('other-month');
        if (hasBill) dayDiv.classList.add('has-bill');
        if (isPayday) dayDiv.classList.add('payday');

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayDiv.appendChild(dayNumber);

        if (hasBill || isPayday) {
            const indicator = document.createElement('div');
            indicator.className = 'day-indicator';
            dayDiv.appendChild(indicator);
        }

        return dayDiv;
    }

    renderUpcomingEvents() {
        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        const upcomingBills = this.data.bills.filter(bill => {
            const billDate = new Date(bill.dueDate);
            return billDate >= today && billDate <= sevenDaysFromNow;
        });

        // Add payday events
        const upcomingPaydays = this.getUpcomingPaydays(today, sevenDaysFromNow);

        const allEvents = [
            ...upcomingBills.map(bill => ({
                type: 'bill',
                name: bill.name,
                amount: -bill.amount,
                date: bill.dueDate
            })),
            ...upcomingPaydays.map(payday => ({
                type: 'payday',
                name: 'Payday',
                amount: this.data.biweeklyIncome,
                date: payday
            }))
        ].sort((a, b) => a.date - b.date);

        const eventsList = document.getElementById('upcoming-events-list');
        eventsList.innerHTML = '';

        allEvents.forEach(event => {
            const eventDiv = this.createEventElement(event);
            eventsList.appendChild(eventDiv);
        });
    }

    createEventElement(event) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-item';

        const dateText = this.getEventDateText(event.date);
        const amountClass = event.amount > 0 ? 'income' : 'expense';
        const amountText = event.amount > 0 ?
            `+${this.formatCurrency(event.amount)}` :
            this.formatCurrency(event.amount);

        eventDiv.innerHTML = `
            <div>
                <div class="event-date">${dateText}</div>
                <div class="event-name">${event.name}</div>
            </div>
            <div class="event-amount ${amountClass}">${amountText}</div>
        `;

        return eventDiv;
    }

    // Bill Management
    toggleBillStatus(billElement) {
        const billId = parseInt(billElement.dataset.billId);
        const bill = this.data.bills.find(b => b.id === billId);

        if (bill && !bill.isPaid) {
            bill.isPaid = !bill.isPaid;
            this.saveData();
            this.renderCurrentView();

            // Show feedback
            this.showToast(`${bill.name} marked as ${bill.isPaid ? 'paid' : 'unpaid'}`);
        }
    }

    openAddBillModal() {
        const modal = this.createAddBillModal();
        document.getElementById('modal-container').appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    createAddBillModal() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-overlay';
        modalDiv.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Add New Bill</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form id="add-bill-form">
                    <div class="form-group">
                        <label class="form-label">Bill Name</label>
                        <input type="text" class="form-input" name="name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Amount</label>
                        <input type="number" class="form-input" name="amount" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Due Date</label>
                        <input type="date" class="form-input" name="dueDate" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Frequency</label>
                        <select class="form-select" name="frequency" required>
                            <option value="once">One Time</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Biweekly</option>
                            <option value="monthly" selected>Monthly</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-select" name="category" required>
                            <option value="">Select category</option>
                            <option value="Housing">Housing</option>
                            <option value="Transportation">Transportation</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Food">Food</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary btn-full">Add Bill</button>
                    </div>
                </form>
            </div>
        `;

        // Add form submit handler
        modalDiv.querySelector('#add-bill-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddBill(e.target);
        });

        return modalDiv;
    }

    handleAddBill(form) {
        const formData = new FormData(form);
        const frequency = formData.get('frequency');
        const bill = {
            id: Date.now(),
            name: formData.get('name'),
            amount: parseFloat(formData.get('amount')),
            dueDate: new Date(formData.get('dueDate')),
            category: formData.get('category'),
            frequency: frequency,
            isPaid: false,
            isRecurring: frequency !== 'once',
            createdAt: new Date()
        };

        this.data.bills.push(bill);
        this.saveData();
        this.closeModal();
        this.renderCurrentView();
        this.showToast(`${bill.name} added successfully`);

        // Generate future instances for recurring bills
        if (bill.isRecurring) {
            this.generateRecurringBills(bill);
        }
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    }

    formatDate(date, format = 'MMM d, yyyy') {
        const options = {};

        if (format.includes('MMM')) options.month = 'short';
        if (format.includes('MM')) options.month = '2-digit';
        if (format.includes('d')) options.day = 'numeric';
        if (format.includes('yyyy')) options.year = 'numeric';

        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    isPayday(date) {
        if (!this.data.payday) return false;

        const paydayWeekday = this.data.payday.getDay();
        const daysSincePayday = Math.floor((date - this.data.payday) / (1000 * 60 * 60 * 24));

        return date.getDay() === paydayWeekday && daysSincePayday % 14 === 0 && daysSincePayday >= 0;
    }

    getUpcomingPaydays(startDate, endDate) {
        const paydays = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            if (this.isPayday(current)) {
                paydays.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return paydays;
    }

    getEventDateText(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (this.isSameDay(date, today)) return 'Today';
        if (this.isSameDay(date, tomorrow)) return 'Tomorrow';
        return this.formatDate(date, 'MMM d');
    }

    calculatePreviousPeriod() {
        const current = this.calculateCurrentPeriod();
        return {
            start: new Date(current.start.getTime() - (14 * 24 * 60 * 60 * 1000)),
            end: new Date(current.end.getTime() - (14 * 24 * 60 * 60 * 1000))
        };
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a1a;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 3000;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showOfflineIndicator() {
        // Implementation for offline indicator
        console.log('App is offline');
    }

    // Recurring Bill Management
    generateRecurringBills(originalBill) {
        const futureInstances = [];
        const maxInstances = 12; // Generate up to 12 future instances
        const today = new Date();

        for (let i = 1; i <= maxInstances; i++) {
            const nextDueDate = this.calculateNextDueDate(originalBill.dueDate, originalBill.frequency, i);

            // Only generate bills for future dates
            if (nextDueDate > today) {
                const futureBill = {
                    ...originalBill,
                    id: Date.now() + i, // Unique ID
                    dueDate: nextDueDate,
                    isPaid: false,
                    parentBillId: originalBill.id, // Reference to original
                    generatedAt: new Date()
                };

                futureInstances.push(futureBill);
            }
        }

        // Add future bills to the data
        this.data.bills.push(...futureInstances);
        this.saveData();

        console.log(`Generated ${futureInstances.length} future instances for ${originalBill.name}`);
    }

    calculateNextDueDate(originalDate, frequency, multiplier) {
        const nextDate = new Date(originalDate);

        switch (frequency) {
            case 'weekly':
                nextDate.setDate(originalDate.getDate() + (7 * multiplier));
                break;
            case 'biweekly':
                nextDate.setDate(originalDate.getDate() + (14 * multiplier));
                break;
            case 'monthly':
                nextDate.setMonth(originalDate.getMonth() + multiplier);
                break;
            default:
                return originalDate; // 'once' - no recurrence
        }

        return nextDate;
    }

    // Clean up old bills and regenerate recurring ones
    maintainRecurringBills() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Remove old paid bills (older than 6 months)
        this.data.bills = this.data.bills.filter(bill => {
            if (bill.isPaid && bill.dueDate < sixMonthsAgo) {
                return false; // Remove old paid bills
            }
            return true;
        });

        // Check if we need to generate more recurring bills
        const recurringBills = this.data.bills.filter(bill =>
            bill.isRecurring && !bill.parentBillId // Only original bills, not generated instances
        );

        recurringBills.forEach(bill => {
            const existingFutureBills = this.data.bills.filter(b =>
                b.parentBillId === bill.id && b.dueDate > new Date()
            );

            // If we have fewer than 6 future instances, generate more
            if (existingFutureBills.length < 6) {
                this.generateRecurringBills(bill);
            }
        });

        this.saveData();
    }

    // Sync functionality (placeholder for real-time sync)
    syncData() {
        // This would implement real-time sync with a backend
        console.log('Syncing data...');
    }

    openSettingsModal() {
        const modal = this.createSettingsModal();
        document.getElementById('modal-container').appendChild(modal);

        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    createSettingsModal() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal-overlay';
        modalDiv.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title">Settings</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    <div class="form-group">
                        <label class="form-label">Household Name</label>
                        <input type="text" class="form-input" id="household-name" value="${this.data.settings.householdName}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Biweekly Income</label>
                        <input type="number" class="form-input" id="biweekly-income" value="${this.data.biweeklyIncome}" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Payday (Next/Current)</label>
                        <input type="date" class="form-input" id="payday" value="${this.data.payday ? this.data.payday.toISOString().split('T')[0] : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Enable Notifications</label>
                        <input type="checkbox" id="notifications" ${this.data.settings.notifications ? 'checked' : ''}>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Household Members</label>
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; font-size: 14px;">
                            Both ${this.data.settings.partner1 || 'Partner 1'} and ${this.data.settings.partner2 || 'Partner 2'} can access this account using the household PIN.
                        </div>
                    </div>
                    <div class="form-group">
                        <button type="button" class="btn btn-secondary btn-full" onclick="window.auth.logout()">
                            Switch User / Logout
                        </button>
                    </div>
                    <div class="form-group" style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                        <label class="form-label" style="color: #ef4444;">Danger Zone</label>
                        <button type="button" class="btn btn-danger btn-full" onclick="app.resetApp()">
                            Reset App - Clear All Data
                        </button>
                        <small class="form-help" style="color: #ef4444;">This will delete everything and start fresh. Cannot be undone!</small>
                    </div>
                    ${this.canInstallPWA() ? `
                    <div class="form-group">
                        <button type="button" class="btn btn-secondary btn-full" onclick="installPWA()">
                            Install App
                        </button>
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <button type="button" class="btn btn-primary btn-full" onclick="app.saveSettings()">
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modalDiv;
    }


    saveSettings() {
        const householdName = document.getElementById('household-name').value;
        const biweeklyIncome = parseFloat(document.getElementById('biweekly-income').value);
        const payday = new Date(document.getElementById('payday').value);
        const notifications = document.getElementById('notifications').checked;

        this.data.settings.householdName = householdName;
        this.data.biweeklyIncome = biweeklyIncome;
        this.data.payday = payday;
        this.data.settings.notifications = notifications;

        this.saveData();
        this.closeModal();
        this.renderCurrentView();
        this.showToast('Settings saved successfully');

        // Request notification permission if enabled
        if (notifications && 'Notification' in window) {
            Notification.requestPermission();
        }
    }

    canInstallPWA() {
        return window.deferredPrompt !== null;
    }

    updateCurrentUserDisplay() {
        if (!window.auth || !window.auth.isUserAuthenticated()) return;

        const currentUser = window.auth.getCurrentUser();
        let userIndicator = document.querySelector('.current-user');

        if (!userIndicator) {
            userIndicator = document.createElement('div');
            userIndicator.className = 'current-user';
            document.querySelector('.period-header').insertBefore(userIndicator, document.querySelector('.period-info'));
        }

        const initials = currentUser.split(' ').map(n => n[0]).join('').toUpperCase();

        userIndicator.innerHTML = `
            <div class="current-user-avatar">${initials}</div>
            <span>Logged in as ${currentUser}</span>
            <button class="link-btn" onclick="window.auth.logout()" style="margin-left: 8px;">Switch User</button>
        `;
    }

    resetApp() {
        const confirmed = confirm('⚠️ This will permanently delete ALL data including:\n\n• Household account\n• All bills\n• Income settings\n• Login information\n\nThis cannot be undone! Are you absolutely sure?');

        if (confirmed) {
            const doubleConfirm = confirm('Last chance! This will wipe everything clean. Click OK to proceed or Cancel to keep your data.');

            if (doubleConfirm) {
                // Clear all storage
                localStorage.removeItem('pbj-household');
                localStorage.removeItem('pbj-auth');
                localStorage.removeItem('pbj-data');
                localStorage.removeItem('pbj-sync');
                localStorage.removeItem('pbj-cloud-backup');
                localStorage.removeItem('pbj-device-id');
                localStorage.removeItem('pbj-last-sync');

                // Clear any share codes
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('pbj-share-')) {
                        localStorage.removeItem(key);
                    }
                });

                this.showToast('App reset successfully! Reloading...');

                // Reload the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        }
    }
}

// Global functions for event handlers
function showView(view) {
    app.showView(view);
}

function navigatePeriod(direction) {
    app.navigatePeriod(direction);
}

function openAddBillModal() {
    app.openAddBillModal();
}

function closeModal() {
    app.closeModal();
}

function openSettingsModal() {
    app.openSettingsModal();
}

// Initialize the app
const app = new PeanutButterJelly();

// PWA Install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    // Show install button or banner
    console.log('PWA install prompt available');
});

// Handle app installation
function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            console.log('PWA install result:', choiceResult.outcome);
            deferredPrompt = null;
        });
    }
}