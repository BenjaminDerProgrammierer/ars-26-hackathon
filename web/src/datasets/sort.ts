export const datasetStatusOrder = [
  "essential",
  "recommended",
  "optional",
] as const;

export type DatasetStatus = (typeof datasetStatusOrder)[number];

type SortableDataset = {
  data: {
    status: DatasetStatus;
    priority: number;
    title: string;
  };
};

export function compareDatasets(
  a: SortableDataset,
  b: SortableDataset,
): number {
  const statusDifference =
    datasetStatusOrder.indexOf(a.data.status) -
    datasetStatusOrder.indexOf(b.data.status);
  const priorityDifference = b.data.priority - a.data.priority;

  return (
    statusDifference ||
    priorityDifference ||
    a.data.title.localeCompare(b.data.title, "de")
  );
}
