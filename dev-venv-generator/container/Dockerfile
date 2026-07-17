FROM mcr.microsoft.com/dotnet/sdk:10.0

ARG DEBIAN_FRONTEND=noninteractive

COPY cloud-init/bootstrap.sh /opt/vcenv/bootstrap.template.sh

# Reuse the Azure bootstrap for the toolchain and workshop project, while its
# container mode skips systemd/Caddy and exposes code-server directly.
RUN sed \
      -e 's|${VC_STUDENT_USER}|student|g' \
      -e 's|${VC_STUDENT_PASSWORD}|container-build-only|g' \
      -e 's|${VC_FQDN}|__CONTAINER__|g' \
      /opt/vcenv/bootstrap.template.sh > /opt/vcenv/bootstrap.sh \
    && chmod 0755 /opt/vcenv/bootstrap.sh \
    && /opt/vcenv/bootstrap.sh \
    && mkdir -p /opt/vcenv/home-template \
    && cp -a /home/student/. /opt/vcenv/home-template/ \
    && rm -f /opt/vcenv/bootstrap.template.sh \
    && rm -rf /var/lib/apt/lists/* /tmp/*

COPY container/entrypoint.sh /opt/vcenv/entrypoint.sh
RUN chmod 0755 /opt/vcenv/entrypoint.sh

EXPOSE 9000 8080

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=12 \
  CMD curl -fsS http://127.0.0.1:9000/healthz || exit 1

ENTRYPOINT ["/opt/vcenv/entrypoint.sh"]
