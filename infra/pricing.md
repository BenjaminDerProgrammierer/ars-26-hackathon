# Hackathon pricing estimate

The hackathon has four primary workload costs:

1. Azure Table Storage for the access-code database.
2. Azure App Service for the event website.
3. AI usage outside Azure, limited to $20 per user.
4. Azure development VMs, limited to 48 hours per user.

Monitoring ingestion, disk transactions, and outbound network traffic add
usage-based Azure charges to those workloads.

The event will have 100 users. This estimate also includes one separate user for
testing and development during preparation. If all 101 users consume their full
VM and AI allowances, the maximum estimated cost is **$2,321.30**, including
estimates for monitoring ingestion, disk transactions, and outbound network
traffic.

## Assumptions

- 100 event users each receive at most 48 VM-hours and $20 of AI usage.
- One preparation user receives an additional 48 VM-hours and $20 of AI usage.
- The event website runs for one 730-hour month on one Basic B1 Linux App
  Service worker. This does not provide instance-level failover.
- The database stores 10 MiB and performs 100,000 operations.
- Every user VM uses the configuration in
  [`development-environment.bicep`](modules/development-environment.bicep): a
  Linux `Standard_B2als_v2` VM, one 64 GiB Standard SSD LRS OS disk, and one
  Standard static IPv4 address.
- VM disks and public IP addresses are deleted with their VMs after 48 hours.
- Log Analytics ingests 1 GB of event-website diagnostics.
- Each of the 101 VM disks performs 1 million billable transactions.
- The event website and VMs transfer 101 GB to the internet in total. The first
  100 GB of monthly internet egress is free, leaving 1 GB billable.

## Current retail rates

The following pay-as-you-go retail rates were checked on July 22, 2026 for
Austria East:

| Cost source | Usage | Price |
| --- | --- | ---: |
| Database | Table data stored | $0.045 per GiB/month |
| Database | Reads, writes, lists, scans, and deletes | $0.00036 per 10,000 operations |
| Event website | Basic B1 Linux App Service worker | $0.01802/hour |
| User VMs | Linux `Standard_B2als_v2` compute | $0.0432/hour |
| User VMs | 64 GiB Standard SSD LRS OS disk (E6) | $4.80/month, prorated hourly |
| User VMs | E6 Standard SSD transactions | $0.002 per 10,000 transactions |
| User VMs | Standard static IPv4 address | $0.005/hour |
| Monitoring | Log Analytics data | $2.30 per GB |
| Network | Internet data transfer out | $0.087 per GB after the first 100 GB/month |
| AI | Per-user usage limit outside Azure | $20.00 |

Azure bills App Service for each allocated worker. Managed disks are billed by
provisioned size and prorated hourly, while Standard SSD transactions are
charged separately.

## Maximum cost

### Database: Azure Table Storage

```text
(10 MiB ÷ 1,024 × $0.045) + (100,000 ÷ 10,000 × $0.00036)
= $0.00404
```

Estimated database cost: **less than $0.01**.

### Event website: Azure App Service

```text
1 worker × 730 hours × $0.01802 = $13.1546
```

Estimated event website cost: **$13.15** for one month.

### AI usage outside Azure

```text
(100 event users + 1 preparation user) × $20 = $2,020.00
```

Maximum AI cost: **$2,020.00**.

### User VMs

The 100 event users and one preparation user can consume at most 4,848
VM-hours in total.

| VM component | Calculation | Maximum cost |
| --- | --- | ---: |
| Compute | 101 users × 48 hours × $0.0432 | $209.43 |
| OS disks | 101 disks × 48/730 months × $4.80 | $31.88 |
| Public IP addresses | 101 addresses × 48 hours × $0.005 | $24.24 |
| **VM total** | | **$265.55** |

Standard SSD transactions and outbound traffic depend on actual usage and are
estimated separately below.

### Monitoring ingestion

```text
1 GB × $2.30 = $2.30
```

Estimated Log Analytics ingestion cost: **$2.30**.

### Disk transactions

```text
101 disks × 1,000,000 transactions ÷ 10,000 × $0.002 = $20.20
```

Estimated Standard SSD transaction cost: **$20.20**.

### Outbound network traffic

```text
(101 GB total egress - 100 GB free) × $0.087 = $0.087
```

Estimated outbound network cost: **$0.09**.

### Total

| Cost source | Maximum cost |
| --- | ---: |
| Database | Less than $0.01 |
| Event website | $13.15 |
| AI | $2,020.00 |
| VMs | $265.55 |
| Monitoring ingestion | $2.30 |
| Disk transactions | $20.20 |
| Outbound network traffic | $0.09 |
| **Maximum estimated total** | **$2,321.30** |

At the European Central Bank reference rate for July 21, 2026 of
€1 = $1.1418, the maximum estimated total is approximately **€2,033.01**.
The actual euro amount will depend on the exchange rate and any conversion fees
applied when the charges are billed.

## Additional considerations

- AI is not an Azure service in this estimate. The $20 per user figure is a
  spending limit, so actual AI cost may be lower.
- VM compute stops accruing when a VM is deallocated, but disks and static
  public IP addresses continue to accrue charges until they are deleted.
- Monitoring ingestion, Standard SSD transactions, and outbound traffic are
  estimates based on the assumptions above. Actual usage may be higher or
  lower.
- Log Analytics retention beyond the included period and Azure Monitor alert
  charges are not included.
- Actual charges can vary with billing currency, taxes, negotiated agreements,
  subscription credits, pricing changes, and the exact lifetime of each
  resource.
- Container registry charges are excluded.

## Sources

- [Azure Retail Prices API](https://prices.azure.com/api/retail/prices)
- [Microsoft: Plan and manage costs for Azure App Service](https://learn.microsoft.com/azure/app-service/overview-manage-costs#understand-the-full-billing-model)
- [Microsoft: Understand the Azure Storage billing model](https://learn.microsoft.com/azure/storage/common/storage-plan-manage-costs#understand-the-full-billing-model-for-azure-blob-storage)
- [Microsoft: Azure managed disk billing](https://learn.microsoft.com/azure/virtual-machines/disks-types#billing)
- [Microsoft: Azure Monitor cost and usage](https://learn.microsoft.com/azure/azure-monitor/fundamentals/cost-usage#pricing-model)
- [Microsoft: Azure internet ingress cost model](https://learn.microsoft.com/azure/networking/design-guide/internet-ingress#cost-model-comparison)
- [Azure bandwidth pricing](https://azure.microsoft.com/pricing/details/bandwidth/)
- [European Central Bank: Euro foreign exchange reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)
