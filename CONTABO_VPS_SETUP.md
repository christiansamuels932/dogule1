# Contabo VPS Setup (Dogule1)

Scope + prerequisites (domain, Contabo access, SSH key, local repo access)

Scope

- Provision a Contabo VPS and harden it for production use.
- Deploy MariaDB + Dogule1 API as systemd services.
- Serve Dogule1 static frontend with a reverse proxy for `/api`.
- Ensure TLS, reboot survival, and a clear update/rollback path.

Prerequisites

- Domain name ready: `DOMAIN` (A/AAAA records can be updated).
- Contabo access: portal login and VPS creation rights.
- SSH keypair available: `~/.ssh/DOMAIN_ed25519` and `~/.ssh/DOMAIN_ed25519.pub`.
- Local repo access: `REPO_PATH` is a clean clone of Dogule1.
- Repo SSH URL available: `REPO_SSH_URL` (for VPS git clone).
- OS assumption: Ubuntu/Debian (commands use `apt`).

Verification

- `test -f ~/.ssh/DOMAIN_ed25519 && test -f ~/.ssh/DOMAIN_ed25519.pub`
- `cd REPO_PATH && test -f package.json`

VPS spec capture (region, plan, OS image, public IPv4/IPv6, hostname)

Capture these values when provisioning in Contabo:

- Region: `REGION`
- Plan: `PLAN`
- OS image: `OS_IMAGE`
- Hostname: `HOSTNAME`
- Public IPv4: `VPS_IPV4`
- Public IPv6: `VPS_IPV6`

Record in your ops log and use them in the commands below.

Verification

- `ping -c 2 VPS_IPV4`
- `ssh root@VPS_IPV4 'hostnamectl'`

Initial login + user setup (create non-root user, sudo, disable password auth)

Commands (run from local machine)

```bash
ssh root@VPS_IPV4
adduser SSH_USER
usermod -aG sudo SSH_USER
chmod 700 /home/SSH_USER
mkdir -p /home/SSH_USER/.ssh
chmod 700 /home/SSH_USER/.ssh
chown -R SSH_USER:SSH_USER /home/SSH_USER/.ssh
exit
```

Install the SSH key explicitly (from local machine).

```bash
ssh-copy-id -i ~/.ssh/DOMAIN_ed25519 SSH_USER@VPS_IPV4
```

Disable password authentication (temporary; root login still allowed until SSH hardening section).

```bash
ssh root@VPS_IPV4 "sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && systemctl reload sshd"
```

Verification (from local machine)

- `ssh SSH_USER@VPS_IPV4 'id && groups'`

SSH hardening (keys-only, disable root login, sshd_config changes, verification)

Safety gate: Do not close your current SSH session until key-only login as `SSH_USER` works in a second terminal.

Commands (run from local machine)

```bash
ssh SSH_USER@VPS_IPV4
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sudo sed -i 's/^#PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl reload sshd
exit
```

Verification (from local machine)

- `ssh SSH_USER@VPS_IPV4 'sudo -n true && echo ok'`
- `ssh root@VPS_IPV4` should fail

Firewall (ufw or nftables; allow only 22, 80, 443; verification)

Commands (ufw)

```bash
ssh SSH_USER@VPS_IPV4
sudo apt-get update
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status verbose
```

Verification

- `ssh SSH_USER@VPS_IPV4 'sudo ufw status verbose'`

OS baseline hardening (updates, fail2ban optional, unattended-upgrades optional; verification)

Commands

```bash
ssh SSH_USER@VPS_IPV4
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get -y install ca-certificates curl gnupg openssl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get -y install nodejs
corepack enable
corepack prepare pnpm@PNPM_VERSION --activate
sudo apt-get -y install fail2ban
sudo systemctl enable --now fail2ban
sudo apt-get -y install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Verification

- `ssh SSH_USER@VPS_IPV4 'systemctl status fail2ban --no-pager'`
- `ssh SSH_USER@VPS_IPV4 'systemctl status unattended-upgrades --no-pager'`
- `ssh SSH_USER@VPS_IPV4 'node --version && pnpm --version'`

MariaDB install + secure config (bind address, users, db creation, least-privilege app user; verification)

Commands

```bash
ssh SSH_USER@VPS_IPV4
sudo apt-get -y install mariadb-server
sudo systemctl enable --now mariadb
sudo mysql_secure_installation
```

Expected answers for `mysql_secure_installation`:

- Switch to unix_socket authentication: `n`
- Change the root password: `y` (set a strong root password)
- Remove anonymous users: `y`
- Disallow root login remotely: `y`
- Remove test database: `y`
- Reload privilege tables: `y`

Generate and store the app DB password safely (from VPS shell).

```bash
export DOGULE1_DB_PASSWORD="$(openssl rand -base64 32)"
echo "Store this password in a secure vault before continuing."
sudo mysql -e "\
CREATE DATABASE IF NOT EXISTS dogule1;\
CREATE USER IF NOT EXISTS 'dogule1_app'@'localhost' IDENTIFIED BY '${DOGULE1_DB_PASSWORD}';\
GRANT SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX ON dogule1.* TO 'dogule1_app'@'localhost';\
FLUSH PRIVILEGES;\
"
```

Ensure local-only bind (default on Debian/Ubuntu is 127.0.0.1).

```bash
sudo sed -i 's/^bind-address.*/bind-address = 127.0.0.1/' /etc/mysql/mariadb.conf.d/50-server.cnf
sudo systemctl restart mariadb
```

Note: use TCP `127.0.0.1` for the app and the local socket for admin tasks.

Verification

- `ssh SSH_USER@VPS_IPV4 "mariadb -e 'SHOW DATABASES LIKE \"dogule1\";'"`
- `ssh SSH_USER@VPS_IPV4 "mariadb -e 'SHOW GRANTS FOR \"dogule1_app\"@\"localhost\";'"`

Schema load + import flow (how to load tools/mariadb/schema.sql; how to run DogTabs import tooling; verification)

Schema load (from local machine to VPS)

```bash
scp REPO_PATH/tools/mariadb/schema.sql SSH_USER@VPS_IPV4:/tmp/schema.sql
ssh SSH_USER@VPS_IPV4 "mariadb dogule1 < /tmp/schema.sql"
```

DogTabs import flow (run from VPS with repo present)

```bash
ssh SSH_USER@VPS_IPV4
cd /opt/dogule1/app
pnpm install
export DOGULE1_STORAGE_MODE=mariadb
export DOGULE1_MARIADB_USER=dogule1_app
export DOGULE1_MARIADB_PASSWORD="$DOGULE1_DB_PASSWORD"
export DOGULE1_MARIADB_HOST=127.0.0.1
export DOGULE1_MARIADB_DB=dogule1
node tools/dogtabs/cli.js customers-csv /path/to/Dogtabs-Kunden-Export.csv
node tools/dogtabs/cli.js import-hunde /path/to/dogtaps_Datenbank.accdr
```

Verification

- `ssh SSH_USER@VPS_IPV4 "mariadb dogule1 -e 'SHOW TABLES;'"`
- `ssh SSH_USER@VPS_IPV4 "mariadb dogule1 -e 'SELECT COUNT(*) FROM kunden;'"`

Node API deployment as systemd service (working directory, env file path, ExecStart, restart policy, logs via journalctl; verification including /api/kunden 200 locally)

Create deploy directories and sync runtime (repo source separate from runtime)

```bash
ssh SSH_USER@VPS_IPV4
sudo mkdir -p /opt/dogule1/src /opt/dogule1/app
sudo chown -R SSH_USER:SSH_USER /opt/dogule1
cd /opt/dogule1/src
git clone REPO_SSH_URL .
rsync -a --delete --exclude node_modules /opt/dogule1/src/ /opt/dogule1/app/
cd /opt/dogule1/app
pnpm install
```

Create env file

Replace `DB_PASSWORD_VALUE` with the generated DB password; avoid pasting secrets into shared shell history.

```bash
ssh SSH_USER@VPS_IPV4
sudo mkdir -p /etc/dogule1
sudo tee /etc/dogule1/api.env >/dev/null <<'ENV'
NODE_ENV=production
DOGULE1_STORAGE_MODE=mariadb
DOGULE1_MARIADB_HOST=127.0.0.1
DOGULE1_MARIADB_DB=dogule1
DOGULE1_MARIADB_USER=dogule1_app
DOGULE1_MARIADB_PASSWORD=DB_PASSWORD_VALUE
DOGULE1_CORS_ORIGINS=https://DOMAIN
PORT=5177
ENV
sudo chown root:root /etc/dogule1/api.env
sudo chmod 600 /etc/dogule1/api.env
```

Create systemd unit

```bash
sudo tee /etc/systemd/system/dogule1-api.service >/dev/null <<'UNIT'
[Unit]
Description=Dogule1 API Server
After=network.target mariadb.service
Requires=mariadb.service

[Service]
Type=simple
User=SSH_USER
WorkingDirectory=/opt/dogule1/app
EnvironmentFile=/etc/dogule1/api.env
ExecStart=/usr/bin/node tools/server/apiServer.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

sudo systemctl daemon-reload
sudo systemctl enable --now dogule1-api
```

Verification

- `ssh SSH_USER@VPS_IPV4 'systemctl status dogule1-api --no-pager'`
- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5177/api/kunden'`
- `ssh SSH_USER@VPS_IPV4 'journalctl -u dogule1-api -n 100 --no-pager'`

Static frontend hosting (nginx or Caddy) (serve dist/, cache headers, SPA fallback; verification)

Nginx option

```bash
ssh SSH_USER@VPS_IPV4
sudo apt-get -y install nginx
sudo mkdir -p /var/www/dogule1
cd /opt/dogule1/app
pnpm install
pnpm build
sudo rsync -a --delete dist/ /var/www/dogule1/
```

Nginx site config

```bash
sudo tee /etc/nginx/sites-available/dogule1 >/dev/null <<'NGINX'
server {
  listen 80;
  server_name DOMAIN;

  root /var/www/dogule1;
  index index.html;

  location / {
    try_files $uri /index.html;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000";
  }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/dogule1 /etc/nginx/sites-enabled/dogule1
sudo nginx -t
sudo systemctl reload nginx
```

Verification

- `ssh SSH_USER@VPS_IPV4 'curl -s -I http://DOMAIN | head -n 1'`

Reverse proxy /api (frontend domain → API service; CORS notes; verification)

Nginx reverse proxy (add to the same server block)

```bash
sudo tee /etc/nginx/snippets/dogule1-api.conf >/dev/null <<'NGINX'
location /api/ {
  proxy_pass http://127.0.0.1:5177/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
NGINX
```

Add this include inside the `server { ... }` block and reload nginx.

```bash
sudo sed -i '/server_name DOMAIN;/a\  include /etc/nginx/snippets/dogule1-api.conf;' /etc/nginx/sites-available/dogule1
sudo nginx -t
sudo systemctl reload nginx
```

CORS note: `DOGULE1_CORS_ORIGINS` must include `https://DOMAIN`.

Verification

- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" http://DOMAIN/api/kunden'`
- After TLS, prefer: `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN/api/kunden'`

TLS/HTTPS (Let’s Encrypt or Caddy auto TLS; renewal verification)

Let’s Encrypt (certbot + nginx)

```bash
ssh SSH_USER@VPS_IPV4
sudo apt-get -y install certbot python3-certbot-nginx
sudo certbot --nginx -d DOMAIN
```

Verification

- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN'`
- `ssh SSH_USER@VPS_IPV4 'sudo certbot renew --dry-run'`

Reboot survival checklist (systemctl enable; after reboot verify all)

Commands

```bash
ssh SSH_USER@VPS_IPV4
sudo systemctl enable mariadb
sudo systemctl enable dogule1-api
sudo systemctl enable nginx
sudo reboot
```

Verification (after reboot)

- `ssh SSH_USER@VPS_IPV4 'systemctl is-active mariadb dogule1-api nginx'`
- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN/api/kunden'`

Health checks (curl commands, status commands, log locations)

Commands

```bash
ssh SSH_USER@VPS_IPV4
systemctl status mariadb --no-pager
systemctl status dogule1-api --no-pager
systemctl status nginx --no-pager
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:5177/api/kunden
curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN/api/kunden
journalctl -u dogule1-api -n 100 --no-pager
```

Log locations

- API logs: `journalctl -u dogule1-api`
- Nginx logs: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- MariaDB logs: `/var/log/mysql/error.log`
- Log rotation: `logrotate` is installed by default; verify with `sudo logrotate -d /etc/logrotate.conf`
- Optional journal cap: set `SystemMaxUse=200M` in `/etc/systemd/journald.conf` and `sudo systemctl restart systemd-journald`

Update workflow (git pull, pnpm install, pnpm build, restart services; verification)

Commands

```bash
ssh SSH_USER@VPS_IPV4
cd /opt/dogule1/src
git pull
rsync -a --delete --exclude node_modules /opt/dogule1/src/ /opt/dogule1/app/
cd /opt/dogule1/app
pnpm install
pnpm build
sudo rsync -a --delete dist/ /var/www/dogule1/
sudo systemctl restart dogule1-api
sudo systemctl reload nginx
```

Verification

- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN/api/kunden'`

Appendix: Common failures & fixes

- SSH lockout risk: keep a root session open until SSH_USER key-only login is verified.
- API 502 from nginx: check `systemctl status dogule1-api` and `journalctl -u dogule1-api -n 100`.
- `pnpm` missing: ensure `corepack enable` and `corepack prepare pnpm@PNPM_VERSION --activate`.
- CORS errors: confirm `DOGULE1_CORS_ORIGINS=https://DOMAIN` and that requests use HTTPS after TLS.
- MariaDB auth failures: verify `/etc/dogule1/api.env` perms and `mariadb -e 'SHOW GRANTS ...'`.

Appendix: VPS teardown (safe removal)

```bash
ssh SSH_USER@VPS_IPV4
sudo systemctl disable --now dogule1-api nginx mariadb
sudo rm -rf /opt/dogule1 /var/www/dogule1 /etc/dogule1
sudo rm -f /etc/nginx/sites-enabled/dogule1 /etc/nginx/sites-available/dogule1 /etc/nginx/snippets/dogule1-api.conf
sudo apt-get -y purge nginx mariadb-server
sudo apt-get -y autoremove
```

Backup + restore (MariaDB dump, file backups, where stored, restore commands)

Backup commands

```bash
ssh SSH_USER@VPS_IPV4
sudo mkdir -p /var/backups/dogule1
mariadb-dump dogule1 > /var/backups/dogule1/dogule1-$(date +%F).sql
sudo tar -czf /var/backups/dogule1/dogule1-dist-$(date +%F).tar.gz -C /var/www dogule1
sudo tar -czf /var/backups/dogule1/dogule1-config-$(date +%F).tar.gz /etc/nginx/sites-available/dogule1 /etc/dogule1
```

Note: off-VPS backups (S3 or external storage/rsync target) are strongly recommended.

Restore commands

```bash
ssh SSH_USER@VPS_IPV4
mariadb dogule1 < /var/backups/dogule1/dogule1-YYYY-MM-DD.sql
sudo rm -rf /var/www/dogule1
sudo tar -xzf /var/backups/dogule1/dogule1-dist-YYYY-MM-DD.tar.gz -C /var/www
sudo systemctl restart dogule1-api
sudo systemctl reload nginx
```

Rollback plan (previous build, previous DB dump, disable new services; exact commands)

Rollback steps

```bash
ssh SSH_USER@VPS_IPV4
sudo systemctl stop dogule1-api
mariadb dogule1 < /var/backups/dogule1/dogule1-YYYY-MM-DD.sql
sudo rm -rf /var/www/dogule1
sudo tar -xzf /var/backups/dogule1/dogule1-dist-YYYY-MM-DD.tar.gz -C /var/www
sudo systemctl start dogule1-api
sudo systemctl reload nginx
```

Disable new services (if required)

```bash
ssh SSH_USER@VPS_IPV4
sudo systemctl disable --now dogule1-api
sudo systemctl disable --now nginx
```

Verification

- `ssh SSH_USER@VPS_IPV4 'curl -s -o /dev/null -w "%{http_code}\n" https://DOMAIN/api/kunden'`
