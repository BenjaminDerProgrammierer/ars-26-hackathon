#!/usr/bin/env bash
set -euo pipefail

student_user=student
home_dir="/home/$student_user"

: "${VC_PASSWORD:?VC_PASSWORD is required}"
: "${VC_PUBLIC_HOST:=localhost}"
: "${VC_DEV_URL:?VC_DEV_URL is required}"

# A named volume preserves student work. Seed it from the image only on its first
# use; subsequent container starts leave the home directory untouched.
if [[ ! -e "$home_dir/.vcenv-initialized" ]]; then
  cp -a /opt/vcenv/home-template/. "$home_dir/"
  touch "$home_dir/.vcenv-initialized"
  chown -R "$student_user:$student_user" "$home_dir"
fi

echo "$student_user:$VC_PASSWORD" | chpasswd
mkdir -p "$home_dir/.config/code-server"
cat > "$home_dir/.config/code-server/config.yaml" <<EOF
bind-addr: 0.0.0.0:9000
auth: password
password: "$VC_PASSWORD"
cert: false
EOF
chown -R "$student_user:$student_user" "$home_dir/.config"

agents_md="$home_dir/website/AGENTS.md"
if [[ -f "$agents_md" ]]; then
  sed -i \
    -e "s|__PUBLIC_HOST__|${VC_PUBLIC_HOST}|g" \
    -e "s|__DEV_URL__|${VC_DEV_URL}|g" \
    "$agents_md"
fi

exec sudo -u "$student_user" -H code-server "$home_dir/website"
