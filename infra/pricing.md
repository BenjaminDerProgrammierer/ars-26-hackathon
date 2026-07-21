# Infrastructure pricing estimate

The resources defined in [`main.bicep`](main.bicep) should cost approximately
**$13.16 per month**, plus negligible storage transactions at hackathon scale.

## Resources

The template creates:

- One Azure StorageV2 account in Austria East using Standard LRS.
- One Azure Table named `AccessCodes` by default.
- One Basic B1 Linux App Service plan and one container web app.
- One user-assigned managed identity, which has no additional charge.

The App Service plan is the fixed monthly cost. Storage billing is based on
stored table data, operations, and potentially outbound network traffic.

## Current retail rates

The following pay-as-you-go retail rates were checked on July 21, 2026 for
Linux App Service and Azure Table Storage in Austria East:

| Usage | Price |
| --- | ---: |
| Basic B1 Linux App Service plan | $0.01802/hour (about $13.15 per 730-hour month) |
| Table data stored | $0.045 per GiB/month |
| Reads, writes, lists, scans, and deletes | $0.00036 per 10,000 operations |
| Deployment and an empty table | No charge |

The approximate monthly storage and operation cost is:

```text
cost = (B1 instance hours × $0.01802)
     + (stored GiB × $0.045)
     + (operations ÷ 10,000 × $0.00036)
```

## Examples

| Monthly usage | Estimated monthly cost |
| --- | ---: |
| 10 MiB stored and 100,000 operations | About $13.15 |
| 1 GiB stored and 1 million operations | About $13.23 |
| 100 GiB stored and 100 million operations | About $21.25 |

The access-code records used by this project are small, so almost all expected
cost comes from the continuously provisioned B1 App Service plan.

## Additional considerations

- Outbound internet traffic can incur bandwidth charges, although the small
  table responses used by this application are unlikely to produce a material
  charge. Azure currently includes the first 100 GB of monthly internet egress
  globally.
- Actual charges can vary with billing currency, taxes, negotiated agreements,
  subscription credits, pricing changes, and other services used through the
  same storage account.
- A different `appServicePlanSkuName` changes the fixed compute cost.
- This estimate covers only the resources declared by `infra/main.bicep` and
  excludes container-registry charges.

## Sources

- [Azure Retail Prices API](https://prices.azure.com/api/retail/prices)
- [Microsoft: Understand the Azure Storage billing model](https://learn.microsoft.com/azure/storage/common/storage-plan-manage-costs#understand-the-full-billing-model-for-azure-blob-storage)
- [Azure bandwidth pricing](https://azure.microsoft.com/pricing/details/bandwidth/)
