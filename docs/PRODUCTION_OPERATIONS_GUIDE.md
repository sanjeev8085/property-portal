# AuraHomes Production Operations Guide

This guide details how to configure daily database backups (both via Supabase managed backups and custom `pg_dump` automation) and Sentry crash alerting.

---

## 1. DATABASE BACKUPS CONFIGURATION

### Option A: Supabase Managed Backups (Recommended 🟢)
If you are using Supabase as your production PostgreSQL provider (as specified in `.env.example`), automatic daily backups are provided out-of-the-box.

1. **Daily Auto-Backups**:
   * Navigate to the **Supabase Dashboard** → **Project Settings** → **Database**.
   * Under the **Backups** section, Supabase automatically takes daily backups of your database.
   * *Free Tier*: Backups are taken daily, but recovery requires upgrading to Pro.
   * *Pro Tier ($25/mo)*: Provides **7 days of Point-in-Time Recovery (PITR)**. You can restore your database to any exact second within the last 7 days.
2. **How to enable PITR**:
   * In the **Database** settings panel under **Backups**, click **Enable Point-in-Time Recovery (PITR)**.
   * Select a physical database region near your server.
   * Click **Save**.

---

### Option B: Local `pg_dump` Automation (Custom 🟡)
If you host PostgreSQL yourself or want an independent backup location, use our automated `backup_db.sh` script.

#### 1. Setup systemd Service & Timer (Linux Servers)
This automates the execution of `/app/scripts/backup_db.sh backup` every day at 2:00 AM server time.

**Create Service File** `/etc/systemd/system/aurahomes-backup.service`:
```ini
[Unit]
Description=AuraHomes Daily Database Backup
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/app
EnvironmentFile=/app/.env
ExecStart=/bin/bash /app/scripts/backup_db.sh backup
StandardOutput=journal
StandardError=journal
```

**Create Timer File** `/etc/systemd/system/aurahomes-backup.timer`:
```ini
[Unit]
Description=Run AuraHomes Database Backup Daily at 2AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable and Start Timer**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aurahomes-backup.timer
```

* **Verify Timer Status**: `systemctl status aurahomes-backup.timer`
* **Check Backup logs**: `journalctl -u aurahomes-backup.service`

---

## 2. SENTRY ERROR ALERTING (SLACK & EMAIL)

To ensure your team is notified instantly when any FastAPI route crashes with an unhandled exception or returns an HTTP 500 error, configure Sentry alerts.

### Step 1: Connect Slack/Email to Sentry
1. Log in to the **Sentry Dashboard**.
2. Go to **Settings** → **Integrations** → **Slack** (or email notification setups).
3. Click **Add Integration** and authorize Sentry to access your Slack workspace.
4. Select a default channel (e.g. `#alerts-prod`) for crash notifications.

### Step 2: Create a Staging/Prod Alert Rule
1. Navigate to your project in Sentry.
2. Click **Alerts** in the sidebar → **Create Alert**.
3. Select **Issues** (trigger alert when a new error occurs) and click **Set Conditions**.
4. Configure the conditions:
   * **When**: *A new issue is created* OR *An existing issue changes state from resolved to unresolved*.
   * **Filter**: Set filter to `http.status_code:500` or `level:error`.
   * **Then**: *Send a Slack notification* to your target channel, and *Send an Email* to `admin@aurahomes.in`.
5. Name the rule `AuraHomes Production 500 Crash Alert` and save.

---

## 3. PROD EMERGENCIES: DATABASE RESTORE

If a catastrophic data loss event occurs, execute a restore from the latest timestamped backup:

```bash
# 1. List available backups
/app/scripts/backup_db.sh list

# 2. Run restore with the target archive file (will prompt for safety confirmation)
/app/scripts/backup_db.sh restore /backups/aurahomes_YYYYMMDD_HHMMSS.sql.gz
```
