import { OpenRouter } from "@openrouter/sdk";
import type {
  CreateKeysRequestBody,
  CreateKeysResponse,
  ListData,
  UpdateKeysRequestBody,
} from "@openrouter/sdk/models/operations";
export type ApiKey = ListData;
export type CreateKeyInput = Omit<
  CreateKeysRequestBody,
  "workspaceId" | "includeByokInLimit" | "limitReset"
>;
export type UpdateKeyInput = Omit<UpdateKeysRequestBody, "includeByokInLimit" | "limitReset">;

export type HackathonContext = {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  guardrail: {
    id: string;
    name: string;
    availableModels: Array<{
      id: string;
      name: string;
    }>;
    availableModelCount: number;
    allowedProviders: string[];
  };
};

export type CreditBalance = {
  totalCredits: number;
  totalUsage: number;
  availableCredits: number;
};

let client: OpenRouter | undefined;
let contextPromise: Promise<HackathonContext> | undefined;

function getClient(): OpenRouter {
  if (client) {
    return client;
  }

  const apiKey = process.env.OPENROUTER_MANAGEMENT_KEY ?? process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_MANAGEMENT_KEY is not set (OPENROUTER_API_KEY is also accepted)");
  }

  client = new OpenRouter({
    apiKey,
    appTitle: "Ars Hackathon Key Manager",
  });

  return client;
}

function humanizeModelId(id: string): string {
  const modelName = id.slice(id.indexOf("/") + 1).replace(/-\d{8}$/, "");
  return modelName
    .split("-")
    .map((part) => (part ? part[0]?.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

async function loadHackathonContext(): Promise<HackathonContext> {
  const openRouter = getClient();
  const workspaceId =
    process.env.OPENROUTER_WORKSPACE_ID?.trim() || "86f3bddd-f390-48f2-a64d-5f1c0a56262a";
  const guardrailId =
    process.env.OPENROUTER_GUARDRAIL_ID?.trim() || "9e82c307-9305-49b3-a43b-b4f37f33c85c";
  const [workspaceResponse, guardrailResponse] = await Promise.all([
    openRouter.workspaces.get({ id: workspaceId }),
    openRouter.guardrails.get({ id: guardrailId }),
  ]);
  const workspace = workspaceResponse.data;
  const guardrail = guardrailResponse.data;

  if (guardrail.workspaceId !== workspace.id) {
    throw new Error(
      `Guardrail "${guardrail.name}" does not belong to the ${workspace.name} workspace`,
    );
  }

  const allowedModelIds = guardrail.allowedModels ?? [];
  const availableModels = await Promise.all(
    allowedModelIds.map(async (id) => {
      const separator = id.indexOf("/");
      if (separator < 1) {
        return { id, name: humanizeModelId(id) };
      }

      try {
        const response = await openRouter.models.get({
          author: id.slice(0, separator),
          slug: id.slice(separator + 1),
        });
        return { id, name: response.data.name };
      } catch {
        return { id, name: humanizeModelId(id) };
      }
    }),
  );

  const availableModelCount =
    availableModels.length > 0
      ? availableModels.length
      : (await openRouter.models.count()).data.count;

  return {
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    guardrail: {
      id: guardrail.id,
      name: guardrail.name,
      availableModels,
      availableModelCount,
      allowedProviders: guardrail.allowedProviders ?? [],
    },
  };
}

export async function getHackathonContext(): Promise<HackathonContext> {
  if (!contextPromise) {
    contextPromise = loadHackathonContext().catch((error: unknown) => {
      contextPromise = undefined;
      throw error;
    });
  }

  return contextPromise;
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const openRouter = getClient();
  const { workspace } = await getHackathonContext();
  const response = await openRouter.apiKeys.list({
    includeDisabled: true,
    workspaceId: workspace.id,
  });

  return response.data;
}

export async function getCreditBalance(): Promise<CreditBalance> {
  const response = await getClient().credits.getCredits();
  const { totalCredits, totalUsage } = response.data;
  return {
    totalCredits,
    totalUsage,
    availableCredits: totalCredits - totalUsage,
  };
}

export async function getApiKey(hash: string): Promise<ApiKey> {
  const openRouter = getClient();
  const { workspace } = await getHackathonContext();
  const response = await openRouter.apiKeys.get({ hash });

  if (response.data.workspaceId !== workspace.id) {
    throw new Error("The requested API key is not in the Hackathon workspace");
  }

  return response.data;
}

async function rollbackCreatedKeys(
  openRouter: OpenRouter,
  created: CreateKeysResponse[],
): Promise<number> {
  const results = await Promise.allSettled(
    created.map(({ data }) => openRouter.apiKeys.delete({ hash: data.hash })),
  );

  return results.filter((result) => result.status === "rejected").length;
}

export async function createApiKeys(
  inputs: CreateKeyInput[],
  onCreated?: () => void,
): Promise<{
  created: CreateKeysResponse[];
  assignedCount: number;
}> {
  const openRouter = getClient();
  const { workspace, guardrail } = await getHackathonContext();
  const created: CreateKeysResponse[] = [];

  try {
    for (const input of inputs) {
      created.push(
        await openRouter.apiKeys.create({
          requestBody: {
            ...input,
            includeByokInLimit: false,
            limitReset: null,
            workspaceId: workspace.id,
          },
        }),
      );
      onCreated?.();
    }

    const assignment = await openRouter.guardrails.bulkAssignKeys({
      id: guardrail.id,
      bulkAssignKeysRequest: {
        keyHashes: created.map(({ data }) => data.hash),
      },
    });

    if (assignment.assignedCount !== created.length) {
      throw new Error(
        `OpenRouter assigned ${assignment.assignedCount} of ${created.length} keys to the guardrail`,
      );
    }

    return {
      created,
      assignedCount: assignment.assignedCount,
    };
  } catch (error: unknown) {
    const rollbackFailures = await rollbackCreatedKeys(openRouter, created);

    if (rollbackFailures > 0) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${message}. Cleanup failed for ${rollbackFailures} newly created key(s); check OpenRouter immediately.`,
        { cause: error },
      );
    }

    throw error;
  }
}

export async function updateApiKey(hash: string, changes: UpdateKeyInput): Promise<ApiKey> {
  const openRouter = getClient();
  await getApiKey(hash);
  const response = await openRouter.apiKeys.update({
    hash,
    requestBody: {
      ...changes,
      includeByokInLimit: false,
      limitReset: null,
    },
  });

  return response.data;
}

export async function deleteApiKey(hash: string): Promise<void> {
  const openRouter = getClient();
  await getApiKey(hash);
  await openRouter.apiKeys.delete({ hash });
}
