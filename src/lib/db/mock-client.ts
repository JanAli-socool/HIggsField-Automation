import type {
  GenerationRequest,
  GenerationJob,
  ValidationResult,
  GenerationParameters,
  JobStatus,
  FailureType,
  Project,
  CreditBalance,
  CreditTransaction,
  Upload,
  User,
  Session,
  Account,
  ApiKey,
} from "../../types/api.js";
import crypto from "crypto";

interface MockUser extends User {
  passwordHash?: string;
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: string;
  emailVerificationFailed?: boolean;
}

const MOCK_USERS = new Map<string, MockUser>();
const MOCK_SESSIONS = new Map<string, Session>();
const MOCK_ACCOUNTS = new Map<string, Account>();
const MOCK_PROJECTS = new Map<string, Project>();
const MOCK_GENERATIONS = new Map<string, GenerationJob>();
const MOCK_CREDIT_BALANCES = new Map<string, CreditBalance>();
const MOCK_CREDIT_TRANSACTIONS = new Map<string, CreditTransaction[]>();
const MOCK_UPLOADS = new Map<string, Upload>();
const MOCK_API_KEYS = new Map<string, ApiKey>();

function generateId(prefix = "mock"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateCuid(): string {
  return `cuid_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function getMockUser(id: string): MockUser | undefined {
  return MOCK_USERS.get(id);
}

function getMockUserByEmail(email: string): MockUser | undefined {
  for (const user of MOCK_USERS.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

function createMockUser(data: { email: string; name?: string; avatar_url?: string; passwordHash?: string }): MockUser {
  const id = generateCuid();
  const now = nowISO();
  const user: MockUser = {
    id,
    email: data.email,
    name: data.name || null,
    avatar_url: data.avatar_url || null,
    passwordHash: data.passwordHash || null,
    isVerified: false,
    verificationToken: crypto.randomBytes(32).toString("hex"),
    verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    emailVerificationFailed: false,
    created_at: now,
  };
  MOCK_USERS.set(id, user);
  
  const balance: CreditBalance = {
    id: generateCuid(),
    user_id: id,
    balance: 1000,
    total_purchased: 1000,
    total_consumed: 0,
    updated_at: now,
  };
  MOCK_CREDIT_BALANCES.set(id, balance);
  MOCK_CREDIT_TRANSACTIONS.set(id, []);
  
  return user;
}

function updateMockUser(id: string, data: Partial<User>): User | undefined {
  const user = MOCK_USERS.get(id);
  if (!user) return undefined;
  const updated = { ...user, ...data };
  MOCK_USERS.set(id, updated);
  return updated;
}

function createMockSession(userId: string): Session {
  const token = generateId("session");
  const session: Session = {
    id: generateCuid(),
    user_id: userId,
    token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: nowISO(),
  };
  MOCK_SESSIONS.set(token, session);
  return session;
}

function getMockSession(token: string): Session | undefined {
  return MOCK_SESSIONS.get(token);
}

function deleteMockSession(token: string): void {
  MOCK_SESSIONS.delete(token);
}

function deleteMockSessionsByUserId(userId: string): void {
  for (const [token, session] of MOCK_SESSIONS.entries()) {
    if (session.user_id === userId) {
      MOCK_SESSIONS.delete(token);
    }
  }
}

function createMockAccount(data: Omit<Account, "id" | "created_at">): Account {
  const account: Account = {
    ...data,
    id: generateCuid(),
    created_at: nowISO(),
  };
  const key = `${data.provider}:${data.provider_account_id}`;
  MOCK_ACCOUNTS.set(key, account);
  return account;
}

function getMockAccount(provider: string, providerAccountId: string): Account | undefined {
  return MOCK_ACCOUNTS.get(`${provider}:${providerAccountId}`);
}

function linkMockAccount(userId: string, account: Omit<Account, "id" | "user_id" | "created_at">): Account {
  return createMockAccount({ ...account, user_id: userId });
}

function createMockProject(userId: string, name: string, description?: string): Project {
  const project: Project = {
    id: generateCuid(),
    user_id: userId,
    name,
    description: description || null,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  MOCK_PROJECTS.set(project.id, project);
  return project;
}

function getMockProjects(userId: string): Project[] {
  return Array.from(MOCK_PROJECTS.values()).filter(p => p.user_id === userId);
}

function createMockGeneration(userId: string, data: Omit<GenerationJob, "id" | "user_id" | "created_at" | "updated_at">): GenerationJob {
  const now = nowISO();
  const job: GenerationJob = {
    id: generateId("gen"),
    user_id: userId,
    project_id: data.project_id || null,
    media_type: data.media_type,
    model: data.model,
    original_prompt: data.original_prompt,
    enhanced_prompt: data.enhanced_prompt,
    negative_prompt: data.negative_prompt,
    status: data.status || "queued",
    progress: data.progress || 0,
    input_asset_url: data.input_asset_url,
    mask_url: data.mask_url,
    first_frame_image_url: data.first_frame_image_url,
    last_frame_image_url: data.last_frame_image_url,
    output_asset_urls: data.output_asset_urls || [],
    thumbnail_urls: data.thumbnail_urls || [],
    parameters: data.parameters,
    provider_job_id: data.provider_job_id,
    credit_cost: data.credit_cost,
    error_message: data.error_message,
    failure_type: data.failure_type,
    created_at: now,
    updated_at: now,
    completed_at: data.completed_at,
  };
  MOCK_GENERATIONS.set(job.id, job);
  return job;
}

function getMockGeneration(id: string): GenerationJob | undefined {
  return MOCK_GENERATIONS.get(id);
}

function getMockGenerations(userId: string): GenerationJob[] {
  return Array.from(MOCK_GENERATIONS.values())
    .filter(j => j.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function updateMockGeneration(id: string, data: Partial<GenerationJob>): GenerationJob | undefined {
  const job = MOCK_GENERATIONS.get(id);
  if (!job) return undefined;
  const updated = { ...job, ...data, updated_at: nowISO() };
  MOCK_GENERATIONS.set(id, updated);
  return updated;
}

function getMockCreditBalance(userId: string): CreditBalance {
  let balance = MOCK_CREDIT_BALANCES.get(userId);
  if (!balance) {
    const now = nowISO();
    balance = {
      id: generateCuid(),
      user_id: userId,
      balance: 1000,
      total_purchased: 1000,
      total_consumed: 0,
      updated_at: now,
    };
    MOCK_CREDIT_BALANCES.set(userId, balance);
    MOCK_CREDIT_TRANSACTIONS.set(userId, []);
  }
  return balance;
}

function updateMockCreditBalance(userId: string, data: Partial<CreditBalance>): CreditBalance {
  const balance = getMockCreditBalance(userId);
  const updated = { ...balance, ...data, updated_at: nowISO() };
  MOCK_CREDIT_BALANCES.set(userId, updated);
  return updated;
}

function createMockCreditTransaction(userId: string, data: Omit<CreditTransaction, "id" | "created_at" | "balance_id">): CreditTransaction {
  const balance = getMockCreditBalance(userId);
  const transaction: CreditTransaction = {
    id: generateCuid(),
    user_id: userId,
    balance_id: balance.id,
    ...data,
    created_at: nowISO(),
  };
  const transactions = MOCK_CREDIT_TRANSACTIONS.get(userId) || [];
  transactions.unshift(transaction);
  MOCK_CREDIT_TRANSACTIONS.set(userId, transactions);
  return transaction;
}

function getMockCreditTransactions(userId: string): CreditTransaction[] {
  return MOCK_CREDIT_TRANSACTIONS.get(userId) || [];
}

function createMockUpload(userId: string, data: Omit<Upload, "id" | "created_at">): Upload {
  const upload: Upload = {
    id: generateCuid(),
    user_id: userId,
    ...data,
    created_at: nowISO(),
  };
  MOCK_UPLOADS.set(upload.id, upload);
  return upload;
}

function createMockApiKey(userId: string, name: string): { apiKey: ApiKey; plainKey: string } {
  const plainKey = `hf_${generateId("key")}`;
  const keyHash = plainKey;
  const apiKey: ApiKey = {
    id: generateCuid(),
    user_id: userId,
    name,
    key_hash: keyHash,
    last_used: null,
    expires_at: null,
    created_at: nowISO(),
  };
  MOCK_API_KEYS.set(keyHash, apiKey);
  return { apiKey, plainKey };
}

function getMockApiKey(keyHash: string): ApiKey | undefined {
  return MOCK_API_KEYS.get(keyHash);
}

function clearMockData(): void {
  MOCK_USERS.clear();
  MOCK_SESSIONS.clear();
  MOCK_ACCOUNTS.clear();
  MOCK_PROJECTS.clear();
  MOCK_GENERATIONS.clear();
  MOCK_CREDIT_BALANCES.clear();
  MOCK_CREDIT_TRANSACTIONS.clear();
  MOCK_UPLOADS.clear();
  MOCK_API_KEYS.clear();
}

const mockPrisma = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      if (args.where.id) return getMockUser(args.where.id) || null;
      if (args.where.email) return getMockUserByEmail(args.where.email) || null;
      return null;
    },
    create: async (args: { data: { email: string; name?: string; avatar_url?: string; password_hash?: string } }) => {
      return createMockUser({
        email: args.data.email,
        name: args.data.name,
        avatar_url: args.data.avatar_url,
        passwordHash: args.data.password_hash,
      });
    },
    update: async (args: { where: { id: string }; data: Partial<User> }) => {
      return updateMockUser(args.where.id, args.data) || null;
    },
    findFirst: async (args: { where: { verificationToken?: string; verificationTokenExpires?: { gt?: Date }; resetPasswordToken?: string; resetPasswordExpires?: { gt?: Date } } }) => {
      for (const user of MOCK_USERS.values()) {
        if (args.where.verificationToken && user.verificationToken === args.where.verificationToken) {
          if (!args.where.verificationTokenExpires || new Date(user.verificationTokenExpires || 0) > new Date()) {
            return user;
          }
        }
        if (args.where.resetPasswordToken && user.resetPasswordToken === args.where.resetPasswordToken) {
          if (!args.where.resetPasswordExpires || new Date(user.resetPasswordExpires || 0) > new Date()) {
            return user;
          }
        }
      }
      return null;
    },
  },
  session: {
    findUnique: async (args: { where: { token: string } }) => {
      return getMockSession(args.where.token) || null;
    },
    create: async (args: { data: { user_id: string; token: string; expires_at: string } }) => {
      return createMockSession(args.data.user_id);
    },
    deleteMany: async (args: { where: { user_id: string } }) => {
      deleteMockSessionsByUserId(args.where.user_id);
      return { count: 0 };
    },
  },
  account: {
    findUnique: async (args: { where: { provider_provider_account_id: { provider: string; provider_account_id: string } } }) => {
      return getMockAccount(args.where.provider_provider_account_id.provider, args.where.provider_provider_account_id.provider_account_id) || null;
    },
    create: async (args: { data: Omit<Account, "id" | "created_at"> }) => {
      return createMockAccount(args.data);
    },
  },
  project: {
    create: async (args: { data: { user_id: string; name: string; description?: string } }) => {
      return createMockProject(args.data.user_id, args.data.name, args.data.description);
    },
    findMany: async (args: { where: { user_id: string }; orderBy?: any; skip?: number; take?: number }) => {
      let projects = getMockProjects(args.where.user_id);
      if (args.orderBy?.created_at === "desc") {
        projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      if (args.skip) projects = projects.slice(args.skip);
      if (args.take) projects = projects.slice(0, args.take);
      return projects;
    },
    count: async (args: { where: { user_id: string } }) => {
      return getMockProjects(args.where.user_id).length;
    },
  },
  generation: {
    create: async (args: { data: Omit<GenerationJob, "id" | "user_id" | "created_at" | "updated_at"> & { user_id: string } }) => {
      return createMockGeneration(args.data.user_id, args.data);
    },
    findUnique: async (args: { where: { id: string } }) => {
      return getMockGeneration(args.where.id) || null;
    },
    findFirst: async (args: { where: { provider_job_id: string } }) => {
      for (const job of MOCK_GENERATIONS.values()) {
        if (job.provider_job_id === args.where.provider_job_id) return job;
      }
      return null;
    },
    findMany: async (args: { where: { user_id: string; status?: string; media_type?: string }; orderBy?: any; skip?: number; take?: number }) => {
      let jobs = getMockGenerations(args.where.user_id);
      if (args.where.status) jobs = jobs.filter(j => j.status === args.where.status);
      if (args.where.media_type) jobs = jobs.filter(j => j.media_type === args.where.media_type);
      if (args.skip) jobs = jobs.slice(args.skip);
      if (args.take) jobs = jobs.slice(0, args.take);
      return jobs;
    },
    count: async (args: { where: { user_id: string; status?: string; media_type?: string } }) => {
      let jobs = getMockGenerations(args.where.user_id);
      if (args.where.status) jobs = jobs.filter(j => j.status === args.where.status);
      if (args.where.media_type) jobs = jobs.filter(j => j.media_type === args.where.media_type);
      return jobs.length;
    },
    update: async (args: { where: { id: string }; data: Partial<GenerationJob> }) => {
      return updateMockGeneration(args.where.id, args.data) || null;
    },
  },
  creditBalance: {
    findUnique: async (args: { where: { user_id: string } }) => {
      return getMockCreditBalance(args.where.user_id) || null;
    },
    create: async (args: { data: { user_id: string; balance: number; total_purchased: number; total_consumed: number } }) => {
      return updateMockCreditBalance(args.data.user_id, args.data);
    },
    update: async (args: { where: { user_id: string }; data: Partial<CreditBalance> }) => {
      return updateMockCreditBalance(args.where.user_id, args.data);
    },
  },
  creditTransaction: {
    create: async (args: { data: Omit<CreditTransaction, "id" | "created_at" | "balance_id"> & { user_id: string } }) => {
      return createMockCreditTransaction(args.data.user_id, args.data);
    },
    findMany: async (args: { where: { user_id: string }; orderBy?: any; skip?: number; take?: number }) => {
      let transactions = getMockCreditTransactions(args.where.user_id);
      if (args.skip) transactions = transactions.slice(args.skip);
      if (args.take) transactions = transactions.slice(0, args.take);
      return transactions;
    },
    count: async (args: { where: { user_id: string } }) => {
      return getMockCreditTransactions(args.where.user_id).length;
    },
  },
  upload: {
    create: async (args: { data: Omit<Upload, "id" | "created_at"> }) => {
      return createMockUpload(args.data.user_id, args.data);
    },
  },
  apiKey: {
    findUnique: async (args: { where: { key_hash: string } }) => {
      return getMockApiKey(args.where.key_hash) || null;
    },
    create: async (args: { data: { user_id: string; name: string; key_hash: string } }) => {
      const plainKey = `hf_${generateId("key")}`;
      const apiKey = {
        id: generateCuid(),
        user_id: args.data.user_id,
        name: args.data.name,
        key_hash: args.data.key_hash,
        last_used: null,
        expires_at: null,
        created_at: nowISO(),
      };
      MOCK_API_KEYS.set(args.data.key_hash, apiKey);
      return apiKey;
    },
  },
  rateLimit: {
    findUnique: async () => null,
    create: async () => ({}),
    update: async () => ({}),
  },
  $transaction: async (operations: any[]) => {
    return Promise.all(operations.map(op => op));
  },
} as any;

export default mockPrisma;
export { clearMockData, generateId };