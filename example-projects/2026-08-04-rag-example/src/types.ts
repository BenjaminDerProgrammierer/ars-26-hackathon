export type Language = "en" | "de";

export type PreparedDocument = {
  projectId: string;
  chunkId: string;
  language: Language;
  title: string;
  category: string | null;
  location: string | null;
  text: string;
  url: string | null;
  linkAllowed: boolean;
  publicForHackathon: true;
};

export type PreparedDataset = {
  datasetGeneratedAt: string;
  datasetSchemaVersion: string;
  documentBuilderVersion: number;
  documents: PreparedDocument[];
};

export type VectorIndexEntry = {
  document: PreparedDocument;
  embedding: number[];
};

export type VectorIndex = {
  manifest: {
    datasetGeneratedAt: string;
    datasetSchemaVersion: string;
    embeddingModel: string;
    vectorDimensions: number;
    documentBuilderVersion: number;
    documentCount: number;
  };
  entries: VectorIndexEntry[];
};

export type SearchResult = {
  document: PreparedDocument;
  score: number;
};

export interface EmbeddingProvider {
  readonly model: string;
  embed(texts: string[], inputType?: "search_document" | "search_query"): Promise<number[][]>;
}

export interface GenerationProvider {
  generate(prompt: string): Promise<string>;
}
