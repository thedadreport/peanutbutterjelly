class HouseholdAuth {
    constructor(app) {
        this.app = app;
        this.isAuthenticated = false;
        this.currentUser = null;
        this.householdData = null;
    }

    init() {
        this.checkAuthStatus();
    }

    checkAuthStatus() {
        const savedAuth = localStorage.getItem('pbj-auth');
        const savedHousehold = localStorage.getItem('pbj-household');

        if (savedAuth && savedHousehold) {
            try {
                const authData = JSON.parse(savedAuth);
                const householdData = JSON.parse(savedHousehold);

                // Check if session is still valid (30 days)
                if (authData.expiresAt > Date.now()) {
                    this.isAuthenticated = true;
                    this.currentUser = authData.user;
                    this.householdData = householdData;
                    this.app.data = { ...this.app.data, ...householdData.data };
                    return true;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        }

        // Not authenticated - show login/setup
        this.showAuthScreen();
        return false;
    }

    showAuthScreen() {
        const existingHousehold = localStorage.getItem('pbj-household');

        if (existingHousehold) {
            this.showLoginScreen();
        } else {
            this.showSetupScreen();
        }
    }

    showSetupScreen() {
        const setupHTML = `
            <div class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>🥜🍓 Peanut Butter Jelly</h1>
                        <p>Set up your household cash flow tracking</p>
                    </div>

                    <form id="household-setup-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label">Household Name</label>
                            <input type="text" class="form-input" name="householdName" placeholder="The Smith Family" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Your Name</label>
                            <input type="text" class="form-input" name="partner1" placeholder="Your name" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Partner's Name</label>
                            <input type="text" class="form-input" name="partner2" placeholder="Partner's name" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Biweekly Income</label>
                            <input type="number" class="form-input" name="income" step="0.01" placeholder="2500" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Next Payday</label>
                            <input type="date" class="form-input" name="payday" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Shared Access PIN (4-6 digits)</label>
                            <input type="password" class="form-input" name="pin" placeholder="1234" minlength="4" maxlength="6" pattern="[0-9]*" required>
                            <small class="form-help">You'll both use this PIN to access your shared account</small>
                        </div>

                        <button type="submit" class="btn btn-primary btn-full">Create Household Account</button>
                    </form>

                    <div class="auth-divider">
                        <span>OR</span>
                    </div>

                    <form id="join-household-form" class="auth-form">
                        <div class="form-group">
                            <label class="form-label">Join Existing Household</label>
                            <textarea class="form-input" name="shareCode" placeholder="Paste the share code from your partner" rows="3" style="resize: vertical; font-family: monospace; font-size: 12px;"></textarea>
                            <small class="form-help">Paste the full share code your partner copied from Settings</small>
                        </div>
                        <button type="submit" class="btn btn-secondary btn-full">Join Household</button>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', setupHTML);

        // Handle form submissions
        document.getElementById('household-setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleHouseholdSetup(e.target);
        });

        document.getElementById('join-household-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleJoinHousehold(e.target);
        });
    }

    showLoginScreen() {
        const householdData = JSON.parse(localStorage.getItem('pbj-household'));

        const loginHTML = `
            <div class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>🥜🍓 ${householdData.householdName}</h1>
                        <p>Welcome back! Who's accessing the account?</p>
                    </div>

                    <div class="user-selection">
                        <button class="user-btn" data-user="${householdData.partner1}">
                            <div class="user-avatar">👤</div>
                            <div class="user-name">${householdData.partner1}</div>
                        </button>
                        <button class="user-btn" data-user="${householdData.partner2}">
                            <div class="user-avatar">👤</div>
                            <div class="user-name">${householdData.partner2}</div>
                        </button>
                    </div>

                    <form id="pin-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Enter Household PIN</label>
                            <input type="password" class="form-input" id="pin-input" placeholder="Enter PIN" maxlength="6" pattern="[0-9]*" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Access Account</button>
                        <button type="button" class="btn btn-secondary btn-full" onclick="auth.showLoginScreen()">Back</button>
                    </form>

                    <div class="auth-footer">
                        <button class="link-btn" onclick="auth.resetHousehold()">Reset Household</button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing auth overlay
        const existing = document.querySelector('.auth-overlay');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', loginHTML);

        // Handle user selection
        document.querySelectorAll('.user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedUser = e.currentTarget.dataset.user;
                this.selectedUser = selectedUser;

                // Update UI to show PIN form
                document.querySelector('.user-selection').style.display = 'none';
                document.getElementById('pin-form').style.display = 'block';
                document.querySelector('.auth-header p').textContent = `Hi ${selectedUser}! Enter your household PIN:`;
            });
        });

        // Handle PIN submission
        document.getElementById('pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    handleHouseholdSetup(form) {
        const formData = new FormData(form);

        const householdData = {
            householdName: formData.get('householdName'),
            partner1: formData.get('partner1'),
            partner2: formData.get('partner2'),
            pin: this.hashPin(formData.get('pin')),
            createdAt: new Date().toISOString(),
            data: {
                payday: new Date(formData.get('payday')),
                biweeklyIncome: parseFloat(formData.get('income')),
                bills: [],
                currentPeriodOffset: 0,
                settings: {
                    householdName: formData.get('householdName'),
                    partner1: formData.get('partner1'),
                    partner2: formData.get('partner2'),
                    notifications: true
                }
            }
        };

        // Save household data
        localStorage.setItem('pbj-household', JSON.stringify(householdData));

        // Auto-login the creator
        this.currentUser = formData.get('partner1');
        this.authenticateUser();

        this.app.showToast(`Welcome to ${householdData.householdName}!`);
    }

    handleJoinHousehold(form) {
        const formData = new FormData(form);
        const shareCode = formData.get('shareCode').trim();

        try {
            // Try to decode the share code (it's base64 encoded)
            const decodedData = atob(shareCode);
            const shareData = JSON.parse(decodedData);

            // Check if the share code has expired
            if (shareData.expiresAt && shareData.expiresAt > Date.now()) {
                // Valid share code - copy the household data
                localStorage.setItem('pbj-household', JSON.stringify(shareData.householdData));

                // Show user selection for who is joining
                this.showUserSelectionForJoin(shareData.householdData);
            } else {
                this.app.showToast('Share code has expired. Please ask for a new one.');
            }
        } catch (error) {
            console.error('Share code decode error:', error);
            this.app.showToast('Invalid share code. Please check the code and try again.');
        }
    }

    showUserSelectionForJoin(householdData) {
        const joinHTML = `
            <div class="auth-overlay">
                <div class="auth-container">
                    <div class="auth-header">
                        <h1>🥜🍓 ${householdData.householdName}</h1>
                        <p>Welcome! Who are you?</p>
                    </div>

                    <div class="user-selection">
                        <button class="user-btn" data-user="${householdData.partner1}">
                            <div class="user-avatar">👤</div>
                            <div class="user-name">${householdData.partner1}</div>
                        </button>
                        <button class="user-btn" data-user="${householdData.partner2}">
                            <div class="user-avatar">👤</div>
                            <div class="user-name">${householdData.partner2}</div>
                        </button>
                    </div>

                    <form id="join-pin-form" class="auth-form" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">Enter Household PIN</label>
                            <input type="password" class="form-input" id="join-pin-input" placeholder="Enter PIN" maxlength="6" pattern="[0-9]*" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Join Household</button>
                        <button type="button" class="btn btn-secondary btn-full" onclick="location.reload()">Back</button>
                    </form>
                </div>
            </div>
        `;

        // Remove existing overlay
        const existing = document.querySelector('.auth-overlay');
        if (existing) existing.remove();

        document.body.insertAdjacentHTML('beforeend', joinHTML);

        // Handle user selection
        document.querySelectorAll('.user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const selectedUser = e.currentTarget.dataset.user;
                this.selectedUser = selectedUser;

                document.querySelector('.user-selection').style.display = 'none';
                document.getElementById('join-pin-form').style.display = 'block';
                document.querySelector('.auth-header p').textContent = `Hi ${selectedUser}! Enter the household PIN:`;
            });
        });

        // Handle PIN submission
        document.getElementById('join-pin-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('join-pin-input').value;
            const householdData = JSON.parse(localStorage.getItem('pbj-household'));

            if (this.verifyPin(pin, householdData.pin)) {
                this.currentUser = this.selectedUser;
                this.authenticateUser();
                this.app.showToast(`Welcome to ${householdData.householdName}, ${this.currentUser}!`);
            } else {
                this.app.showToast('Incorrect PIN. Please try again.');
                document.getElementById('join-pin-input').value = '';
            }
        });
    }

    handleLogin() {
        const enteredPin = document.getElementById('pin-input').value;
        const householdData = JSON.parse(localStorage.getItem('pbj-household'));

        if (this.verifyPin(enteredPin, householdData.pin)) {
            this.currentUser = this.selectedUser;
            this.authenticateUser();
        } else {
            this.app.showToast('Incorrect PIN. Please try again.');
            document.getElementById('pin-input').value = '';
            document.getElementById('pin-input').focus();
        }
    }

    authenticateUser() {
        this.isAuthenticated = true;

        // Save auth session (30 days)
        const authData = {
            user: this.currentUser,
            expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000)
        };
        localStorage.setItem('pbj-auth', JSON.stringify(authData));

        // Load household data into app
        const householdData = JSON.parse(localStorage.getItem('pbj-household'));
        this.app.data = { ...this.app.data, ...householdData.data };

        // Remove auth overlay
        const authOverlay = document.querySelector('.auth-overlay');
        if (authOverlay) authOverlay.remove();

        // Initialize the app properly
        this.app.loadData();
        this.app.registerServiceWorker();
        this.app.setupEventListeners();
        this.app.updateTime();
        this.app.calculateCurrentPeriod();
        this.app.maintainRecurringBills();
        this.app.renderCurrentView();

        // Initialize sync manager
        this.app.syncManager = new SyncManager(this.app);
        this.app.syncManager.enableRealTimeSync();

        // Update time every minute
        setInterval(() => this.app.updateTime(), 60000);

        // Maintain recurring bills daily
        setInterval(() => this.app.maintainRecurringBills(), 24 * 60 * 60 * 1000);

        this.app.showToast(`Welcome back, ${this.currentUser}!`);
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('pbj-auth');
        this.showLoginScreen();
    }

    resetHousehold() {
        const confirmed = confirm('⚠️ Reset Household Account?\n\nThis will delete:\n• Household login\n• All bills and data\n• Both user accounts\n\nYou\'ll need to set up the household again. Continue?');

        if (confirmed) {
            // Clear all data
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

            alert('✅ Household reset! Setting up fresh account...');
            location.reload();
        }
    }

    hashPin(pin) {
        // Simple hash for PIN (in production, use proper crypto)
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    verifyPin(enteredPin, hashedPin) {
        return this.hashPin(enteredPin) === hashedPin;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }
}

// Global auth instance
window.auth = null;