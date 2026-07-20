# Infrastructure pricing estimate

The resources defined in [`main.bicep`](main.bicep) should cost effectively
**$0 per month at hackathon-scale usage**.

## Resources

The template creates:

- One Azure StorageV2 account in Austria East using Standard LRS.
- One Azure Table named `AccessCodes` by default.
- No fixed-price compute resources.

Creating the storage account and an empty table does not itself incur a fixed
monthly charge. Billing is based primarily on stored table data, operations,
and potentially outbound network traffic.

## Current retail rates

The following pay-as-you-go retail rates were checked on July 20, 2026 for
Azure Table Storage using Standard LRS in Austria East:

| Usage | Price |
| --- | ---: |
| Table data stored | $0.045 per GiB/month |
| Reads, writes, lists, scans, and deletes | $0.00036 per 10,000 operations |
| Deployment and an empty table | No charge |

The approximate monthly storage and operation cost is:

```text
cost = (stored GiB × $0.045) + (operations ÷ 10,000 × $0.00036)
```

## Examples

| Monthly usage | Estimated monthly cost |
| --- | ---: |
| 10 MiB stored and 100,000 operations | About $0.004 |
| 1 GiB stored and 1 million operations | About $0.081 |
| 100 GiB stored and 100 million operations | About $8.10 |

The access-code records used by this project are small. At the expected scale,
the realistic cost should be **less than $0.01 per month**, likely appearing as
effectively zero on the bill.

## Additional considerations

- Outbound internet traffic can incur bandwidth charges, although the small
  table responses used by this application are unlikely to produce a material
  charge. Azure currently includes the first 100 GB of monthly internet egress
  globally.
- Actual charges can vary with billing currency, taxes, negotiated agreements,
  subscription credits, pricing changes, and other services used through the
  same storage account.
- This estimate covers only the resources declared by `infra/main.bicep`.

## Sources

- [Azure Retail Prices API](https://prices.azure.com/api/retail/prices)
- [Microsoft: Understand the Azure Storage billing model](https://learn.microsoft.com/azure/storage/common/storage-plan-manage-costs#understand-the-full-billing-model-for-azure-blob-storage)
- [Azure bandwidth pricing](https://azure.microsoft.com/pricing/details/bandwidth/)
