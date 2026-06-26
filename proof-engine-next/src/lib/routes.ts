const defaultWorkspaceSlug = "myteuf"
const defaultProjectId = "prj_myteuf"

export const routes = {
  marketing: "/",
  login: "/login",
  signup: "/signup",
  privacy: "/privacy",
  terms: "/terms",
  onboarding: "/app/onboarding",
  dashboard: `/app/${defaultWorkspaceSlug}/dashboard`,
  connectors: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/connectors`,
  connectorNew: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/connectors/new`,
  connector: (id: string) => `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/connectors/${id}`,
  gateway: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/gateway`,
  gatewayNew: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/gateway/new`,
  gatewayProfile: (id: string) => `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/gateway/${id}`,
  eventMapping: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/event-mapping`,
  dataQuality: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/data-quality`,
  evidence: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/evidence`,
  diagnostic: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/diagnostic`,
  experiments: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/experiments`,
  experiment: (id: string) => `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/experiments/${id}`,
  learnings: `/app/${defaultWorkspaceSlug}/projects/${defaultProjectId}/learnings`,
  settings: `/app/${defaultWorkspaceSlug}/settings`,
}
