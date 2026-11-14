export type StoryCategory =
  | "sismo"
  | "salud"
  | "regresar-a-casa"
  | "vivienda"
  | "educacion";

export type PaymentMethod = "codi_qr" | "codi_push" | "mock";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired";
export type StoryStatus = "en_revision" | "aprobada" | "rechazada";
export type CodiStatus = "PENDING" | "PROCESSING" | "ACTIVE" | "ERROR" | "UNKNOWN";
export type BankAccountEntity = "PERSON" | "BUSINESS";

export interface Milestone {
  id: string;
  label: string;
  targetAmount: number;
}

export interface Story {
  id: string;
  slug: string;
  personName: string;
  title: string;
  summary: string;
  story: string;
  location: string;
  category: StoryCategory;
  organizationName: string;
  accountHolderName: string;
  clabe: string | null;
  clabeMasked: string;
  peyKeyEnv: string;
  peyEntity: BankAccountEntity;
  peyTaxId: string | null;
  bankAccountId: string | null;
  codiStatus: CodiStatus;
  status: StoryStatus;
  previewToken: string | null;
  contactEmail: string;
  goalAmount: number;
  coverImage: string;
  galleryImages: string[];
  milestones: Milestone[];
  isExample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportPayment {
  id: string;
  storyId: string;
  reference: number;
  peyApiKeyEnv: string | null;
  peyApiKeyId: string | null;
  providerChargeId: string | null;
  providerTransactionId: string | null;
  amount: number;
  donorName: string | null;
  message: string | null;
  phone: string | null;
  concept: string;
  method: PaymentMethod;
  status: PaymentStatus;
  qrString: string | null;
  paymentLink: string | null;
  paidAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryWithStats extends Story {
  amountRaised: number;
  supporterCount: number;
}

export type PublicStory = Omit<
  StoryWithStats,
  "peyKeyEnv" | "peyEntity" | "peyTaxId" | "bankAccountId" | "clabe" | "contactEmail" | "previewToken"
> & {
  showExampleBadge: boolean;
  clabeRegistered: boolean;
};

export interface SupporterItem {
  id: string;
  donorName: string;
  message: string | null;
  amount: number;
  paidAt: string;
  createdAt: string | null;
  isRealConfirmed: boolean;
  isExample: boolean;
}

export interface StoryLiveData {
  story: PublicStory;
  supporters: SupporterItem[];
}

export interface PaymentCheckout {
  paymentId: string;
  codiQrId: string;
  qrString: string;
  paymentLink: string | null;
  expiresInSeconds: number;
  mode: "mock" | "live";
}
