class SyncManager {
    constructor(app) {
        this.app = app;
        this.syncKey = 'pbj-sync';
        this.deviceId = this.getOrCreateDeviceId();
        this.init();
    }

    init() {
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === this.syncKey && e.newValue) {
                this.handleRemoteSync(JSON.parse(e.newValue));
            }
        });

        // Periodic sync check
        setInterval(() => this.checkForUpdates(), 30000); // Every 30 seconds
    }

    getOrCreateDeviceId() {
        let deviceId = localStorage.getItem('pbj-device-id');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('pbj-device-id', deviceId);
        }
        return deviceId;
    }

    // Simple multi-device sync using localStorage events
    broadcastUpdate(data) {
        const syncData = {
            deviceId: this.deviceId,
            timestamp: Date.now(),
            data: data
        };

        localStorage.setItem(this.syncKey, JSON.stringify(syncData));

        // Also attempt cloud sync if available
        this.cloudSync(data);
    }

    handleRemoteSync(syncData) {
        if (syncData.deviceId !== this.deviceId) {
            // Another device updated the data
            const localTimestamp = this.app.data.lastModified || 0;

            if (syncData.timestamp > localTimestamp) {
                // Remote data is newer, update local
                this.app.data = { ...syncData.data, lastModified: syncData.timestamp };
                this.app.renderCurrentView();
                this.app.showToast('Data synced from another device');
            }
        }
    }

    checkForUpdates() {
        // Check for updates from cloud storage or other sources
        if (navigator.onLine) {
            this.cloudSync(this.app.data);
        }
    }

    // Placeholder for cloud sync (Firebase, Supabase, etc.)
    async cloudSync(data) {
        try {
            // This would implement real cloud sync
            // For now, just use localStorage as backup

            const cloudKey = 'pbj-cloud-backup';
            const cloudData = {
                deviceId: this.deviceId,
                timestamp: Date.now(),
                data: data
            };

            localStorage.setItem(cloudKey, JSON.stringify(cloudData));
            console.log('Cloud backup saved');

        } catch (error) {
            console.error('Cloud sync failed:', error);
        }
    }

    // Household sharing functionality
    generateShareCode() {
        const shareCode = Math.random().toString(36).substr(2, 8).toUpperCase();
        const shareData = {
            code: shareCode,
            data: this.app.data,
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };

        localStorage.setItem(`pbj-share-${shareCode}`, JSON.stringify(shareData));
        return shareCode;
    }

    joinWithShareCode(shareCode) {
        const shareData = localStorage.getItem(`pbj-share-${shareCode.toUpperCase()}`);

        if (shareData) {
            const parsed = JSON.parse(shareData);

            if (parsed.expiresAt > Date.now()) {
                this.app.data = { ...parsed.data };
                this.app.saveData();
                this.app.renderCurrentView();
                return true;
            } else {
                localStorage.removeItem(`pbj-share-${shareCode.toUpperCase()}`);
                throw new Error('Share code has expired');
            }
        } else {
            throw new Error('Invalid share code');
        }
    }

    // Real-time updates simulation
    enableRealTimeSync() {
        // In a real app, this would use WebSockets or Server-Sent Events
        // For now, simulate with localStorage polling

        this.realTimeInterval = setInterval(() => {
            const lastSync = localStorage.getItem('pbj-last-sync');
            const currentTime = Date.now();

            if (!lastSync || currentTime - parseInt(lastSync) > 5000) {
                this.broadcastUpdate(this.app.data);
                localStorage.setItem('pbj-last-sync', currentTime.toString());
            }
        }, 5000);
    }

    disableRealTimeSync() {
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
    }
}

// Export for use in main app
window.SyncManager = SyncManager;