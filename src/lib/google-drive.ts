import type { QuoteCollection } from "../types/quote";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const FILES_URL = "https://www.googleapis.com/drive/v3/files";

export type DriveFailure = "authorization" | "unavailable" | "network" | "invalid";

export class DriveError extends Error {
  code: DriveFailure;

  constructor(code: DriveFailure) {
    super(code);
    this.code = code;
  }
}

export interface BackupFile {
  id: string;
  name: string;
  createdTime: string;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken(): void;
}

interface GoogleAuthorization {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    include_granted_scopes: boolean;
    callback: (response: TokenResponse) => void;
    error_callback: () => void;
  }): TokenClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleAuthorization } };
  }
}

let scriptLoading: Promise<void> | undefined;

function loadGoogle(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      script.remove();
      reject(new DriveError("unavailable"));
    }, 20_000);
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      clearTimeout(timeout);
      if (window.google?.accounts.oauth2) resolve();
      else reject(new DriveError("unavailable"));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new DriveError("unavailable"));
    };
    document.head.append(script);
  }).catch((error: unknown) => {
    scriptLoading = undefined;
    throw error;
  });
  return scriptLoading;
}

export class GoogleDrive {
  private clientId: string;
  private client?: TokenClient;
  private token?: string;
  private expiresAt = 0;
  private pending?: { resolve: () => void; reject: (error: DriveError) => void };

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  async prepare(): Promise<void> {
    if (!this.clientId) throw new DriveError("unavailable");
    await loadGoogle();
    if (this.client) return;
    this.client = window.google!.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: DRIVE_SCOPE,
      include_granted_scopes: false,
      callback: (response) => {
        if (
          response.error ||
          !response.access_token ||
          !response.scope?.split(" ").includes(DRIVE_SCOPE) ||
          !response.expires_in ||
          !Number.isFinite(response.expires_in) ||
          response.expires_in <= 0
        ) {
          this.pending?.reject(new DriveError("authorization"));
        } else {
          this.token = response.access_token;
          this.expiresAt = Date.now() + response.expires_in * 1000;
          this.pending?.resolve();
        }
        this.pending = undefined;
      },
      error_callback: () => {
        this.pending?.reject(new DriveError("authorization"));
        this.pending = undefined;
      },
    });
  }

  // GIS requires a user gesture for token renewal; never renew after a failed fetch.
  // https://developers.google.com/identity/oauth2/web/guides/use-token-model
  authorize(): Promise<void> {
    if (this.token && Date.now() < this.expiresAt - 30_000) return Promise.resolve();
    if (!this.client || this.pending) return Promise.reject(new DriveError("unavailable"));
    return new Promise<void>((resolve, reject) => {
      this.pending = { resolve, reject };
      try {
        this.client!.requestAccessToken();
      } catch {
        this.pending = undefined;
        reject(new DriveError("authorization"));
      }
    });
  }

  private async request(url: string, init: RequestInit = {}): Promise<unknown> {
    if (!this.token || Date.now() >= this.expiresAt) throw new DriveError("authorization");
    let response: Response;
    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${this.token}` },
      });
    } catch {
      throw new DriveError("network");
    }
    if (response.status === 401) {
      this.token = undefined;
      throw new DriveError("authorization");
    }
    if (!response.ok) throw new DriveError("network");
    try {
      return await response.json();
    } catch {
      throw new DriveError("invalid");
    }
  }

  async createBackup(collection: QuoteCollection): Promise<BackupFile> {
    const boundary = `wq_${crypto.randomUUID()}`;
    const metadata = {
      name: `wisdom-quotes-${collection.exportedAt}-${crypto.randomUUID()}.json`,
      parents: ["appDataFolder"],
      appProperties: { kind: "wisdom-quotes-backup" },
    };
    // multipart/related carries metadata and collection in one create operation.
    // https://developers.google.com/workspace/drive/api/guides/manage-uploads
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      JSON.stringify(collection) +
      `\r\n--${boundary}--\r\n`;
    const result = await this.request(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime",
      {
        method: "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      },
    );
    if (!isBackupFile(result)) throw new DriveError("invalid");
    return result;
  }

  async listBackups(): Promise<BackupFile[]> {
    const params = new URLSearchParams({
      spaces: "appDataFolder",
      q: "appProperties has { key='kind' and value='wisdom-quotes-backup' }",
      fields: "nextPageToken,files(id,name,createdTime)",
      orderBy: "createdTime desc",
      pageSize: "100",
    });
    const files: BackupFile[] = [];
    const seenTokens = new Set<string>();
    while (true) {
      const result = await this.request(`${FILES_URL}?${params}`);
      if (!result || typeof result !== "object") throw new DriveError("invalid");
      const pageFiles = "files" in result ? result.files : [];
      if (!Array.isArray(pageFiles) || !pageFiles.every(isBackupFile))
        throw new DriveError("invalid");
      files.push(...pageFiles);
      if (!("nextPageToken" in result) || !result.nextPageToken) return files;
      if (typeof result.nextPageToken !== "string" || seenTokens.has(result.nextPageToken))
        throw new DriveError("invalid");
      seenTokens.add(result.nextPageToken);
      params.set("pageToken", result.nextPageToken);
    }
  }

  downloadBackup(id: string): Promise<unknown> {
    return this.request(`${FILES_URL}/${encodeURIComponent(id)}?alt=media`);
  }
}

function isBackupFile(value: unknown): value is BackupFile {
  return (
    !!value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    !!value.id &&
    "name" in value &&
    typeof value.name === "string" &&
    "createdTime" in value &&
    typeof value.createdTime === "string" &&
    Number.isFinite(Date.parse(value.createdTime))
  );
}
