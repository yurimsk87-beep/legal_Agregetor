export type PageType =
  | "HOME"
  | "CITY"
  | "SERVICE"
  | "CITY_SERVICE"
  | "LAWYER"
  | "ARTICLE"
  | "QUESTION"
  | "STATIC"
  | "DOCUMENT"
  | "CALCULATOR"
  | "CASE"
  | "SITUATION"
  | "COURT"
  | "PRICE"
  | "TOP"
  | "RATING";

export type FaqEntityType =
  | "CITY"
  | "SERVICE"
  | "CITY_SERVICE"
  | "LAWYER"
  | "ARTICLE"
  | "QUESTION"
  | "DOCUMENT"
  | "CALCULATOR"
  | "GENERAL";

export type LawyerStatus = "LAWYER" | "ADVOCATE";
export type LawyerProfileStatus = "PENDING" | "APPROVED" | "REJECTED" | "BLOCKED";
export type QuestionStatus = "PENDING" | "MODERATION" | "PUBLISHED" | "REJECTED" | "DUPLICATE" | "SPAM";
export type AnswerStatus = "DRAFT" | "MODERATION" | "PUBLISHED" | "REJECTED";
export type AnswerAuthorType = "LAWYER" | "ADMIN_ASSISTED" | "EDITORIAL";

export type SeoMaturityStatus =
  | "DRAFT"
  | "COLLECTING_DATA"
  | "READY_FOR_INDEX"
  | "INDEXED"
  | "NEEDS_IMPROVEMENT"
  | "DEINDEXED";

export type ContentFreshnessStatus = "FRESH" | "NEEDS_REVIEW" | "OUTDATED";
export type ContentStatus = "DRAFT" | "REVIEW_REQUIRED" | "APPROVED" | "OUTDATED";

export type LegalSource = {
  id: string;
  title: string;
  codeName: string;
  articleNumber?: string | null;
  url: string;
  lastCheckedAt: string;
};

export type LegalReference = {
  code: string;
  article: string;
  title?: string;
  summary: string;
  url?: string;
};

export type QualityStatus =
  | "PENDING"
  | "APPROVED"
  | "NEEDS_REVIEW"
  | "LOW_QUALITY"
  | "DUPLICATE"
  | "PERSONAL_DATA"
  | "SPAM"
  | "LEGAL_RISK";

export type City = {
  id: string;
  name: string;
  namePrepositional: string;
  slug: string;
  region: string;
  federalDistrict?: string | null;
  isActive: boolean;
  seoText: string;
};

export type Service = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  isActive: boolean;
  parentId?: string | null;
};

export type Review = {
  id: string;
  lawyerId: string;
  serviceId?: string | null;
  cityId?: string | null;
  userName: string;
  rating: number;
  text: string;
  qualityStatus?: QualityStatus;
  isModerated: boolean;
  createdAt: string;
};

export type Lawyer = {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  slug: string;
  photoUrl?: string | null;
  status: LawyerStatus;
  experienceYears: number;
  description: string;
  education: string;
  licenseNumber?: string | null;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  consultationPrice?: number | null;
  primaryServiceId?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  telegram?: string | null;
  email?: string | null;
  active?: boolean;
  blocked?: boolean;
  profileStatus?: LawyerProfileStatus;
  consentToNotifications?: boolean;
  citySlugs: string[];
  serviceSlugs: string[];
  cities: City[];
  services: Service[];
  reviews?: Review[];
  profile?: {
    about: string;
    specializationText?: string | null;
    servicesAndPricesText?: string | null;
    reviewsText?: string | null;
    courtExperience?: string | null;
    officeAddress?: string | null;
    casesCount: number;
    responseTimeMinutes: number;
    consentToAdminAssistedAnswers?: boolean;
    adminAssistedConsentAt?: string | null;
    adminAssistedConsentComment?: string | null;
  };
  priceItems?: PriceItem[];
  verifications?: Verification[];
};

export type PriceItem = {
  id: string;
  lawyerId: string;
  serviceId: string;
  title: string;
  priceFrom: number;
  priceTo?: number | null;
};

export type Verification = {
  id: string;
  lawyerId: string;
  type: string;
  status: string;
  comment?: string | null;
};

export type Question = {
  id: string;
  publicNumber?: string;
  title: string;
  slug: string;
  text: string;
  rawText?: string | null;
  enrichedTitle?: string | null;
  enrichedText?: string | null;
  enrichmentStatus?: string;
  preliminaryAnswer?: string | null;
  preliminaryAnswerStatus?: string;
  scenarioId?: string | null;
  legalStage?: string | null;
  urgency?: string | null;
  riskLevel?: string | null;
  facts?: string[];
  missingFacts?: string[];
  clarificationAnswers?: Record<string, string> | null;
  leadScore?: number;
  seoQualityScore?: number;
  userConfirmedEnrichmentAt?: string | null;
  aiAssisted?: boolean;
  editorReviewedAt?: string | null;
  indexabilityReason?: string | null;
  questionText?: string;
  cityId?: string | null;
  serviceId?: string | null;
  userName: string;
  authorType?: "USER" | "GUEST";
  userEmail?: string | null;
  isAnonymous?: boolean;
  notificationsEnabled?: boolean;
  summary?: string | null;
  shortPreview?: string;
  category?: string;
  tags?: string[];
  status?: QuestionStatus;
  moderationStatus?: QualityStatus;
  qualityStatus?: QualityStatus;
  moderationComment?: string | null;
  sourcePage?: string | null;
  hasAttachments?: boolean;
  isIndexable: boolean;
  isDuplicate?: boolean;
  hasOpenReports?: boolean;
  trustScore?: number;
  viewsCount?: number;
  answersCount?: number;
  publishedAt?: string | null;
  createdAt: string;
  city?: City | null;
  service?: Service | null;
  answers: Answer[];
};

export type Answer = {
  id: string;
  questionId: string;
  lawyerId: string;
  lawyerName: string;
  lawyerSlug: string;
  lawyerPhotoUrl?: string | null;
  lawyerCity?: string;
  lawyerSpecialization?: string;
  lawyerExperienceYears?: number;
  lawyerProfileStatus?: "VERIFIED" | "PENDING";
  text: string;
  answerText?: string;
  authorType?: AnswerAuthorType;
  status?: AnswerStatus;
  answerStatus?: AnswerStatus;
  moderationStatus?: QualityStatus;
  containsContactAttempt?: boolean;
  containsUnsupportedLegalClaim?: boolean;
  containsFearPressure?: boolean;
  containsGenericLeadBait?: boolean;
  legalReferencesVerified?: boolean;
  answerReviewStatus?: string | null;
  answerReviewReason?: string | null;
  editorReviewedAt?: string | null;
  publishedByAdmin?: boolean;
  qualityStatus?: QualityStatus;
  answerQualityScore?: number;
  helpfulCount?: number;
  publishedAt?: string | null;
  isModerated: boolean;
  createdAt: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  shortAnswer?: string | null;
  importantPoints?: string[];
  steps?: string[];
  documents?: string[];
  deadlines?: string[];
  prices?: string[];
  risks?: string[];
  mistakes?: string[];
  serviceId: string;
  cityId?: string | null;
  authorId: string;
  authorName: string;
  reviewedByLawyerId?: string | null;
  reviewedByLawyerName?: string | null;
  status?: ContentStatus;
  isIndexable: boolean;
  contentFreshness?: ContentFreshnessStatus;
  publishedAt?: string | null;
  reviewedAt?: string | null;
  updatedAt: string;
  legalSources?: LegalSource[];
  service?: Service;
  city?: City | null;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  entityType: FaqEntityType;
  entityId?: string | null;
  sortOrder: number;
};

export type SeoPage = {
  id: string;
  type: PageType;
  slug: string;
  cityId?: string | null;
  serviceId?: string | null;
  lawyerId?: string | null;
  title: string;
  description: string;
  h1: string;
  seoText: string;
  canonical: string;
  robots?: string;
  isIndexable: boolean;
  seoScore?: number;
  seoMaturity?: SeoMaturityStatus;
  primaryKeyword?: string | null;
};

export type Breadcrumb = {
  name: string;
  path: string;
};

export type StaticPage = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  body: string[];
  bullets: string[];
  cta: string;
  isIndexable: boolean;
};

export type DocumentTemplate = {
  id: string;
  title: string;
  slug: string;
  description: string;
  serviceId?: string | null;
  content: string;
  structure: string[];
  commonMistakes: string[];
  priceFrom: number;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type Calculator = {
  id: string;
  title: string;
  slug: string;
  description: string;
  formula: string;
  example: string;
  serviceId?: string | null;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type CaseItem = {
  id: string;
  title: string;
  slug: string;
  situation: string;
  problem: string;
  lawyerActions: string;
  documentsPrepared: string;
  result: string;
  duration: string;
  clientReview?: string | null;
  serviceId: string;
  cityId?: string | null;
  lawyerId: string;
  isAnonymized: boolean;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type LegalChecklist = {
  id: string;
  title: string;
  slug: string;
  items: string[];
  serviceId?: string | null;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type VideoPage = {
  id: string;
  title: string;
  slug: string;
  description: string;
  transcript: string;
  timestamps: string[];
  relatedServiceId?: string | null;
  relatedLawyerId?: string | null;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type LegalScenario = {
  id: string;
  title: string;
  slug: string;
  problem: string;
  explanation: string;
  deadlines: string;
  documents: string[];
  risks: string[];
  serviceId?: string | null;
  isIndexable: boolean;
  seoScore: number;
  seoMaturity: SeoMaturityStatus;
};

export type NextBestAction = {
  id: string;
  pageType: PageType;
  serviceId?: string | null;
  cityId?: string | null;
  actionType: string;
  title: string;
  url: string;
  priority: number;
};

export type AuditIssue = {
  severity: "error" | "warning";
  page: string;
  message: string;
};
