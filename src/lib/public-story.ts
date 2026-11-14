import { PublicStory, StoryWithStats } from "@/lib/types";

const LIVE_KEY_NAMES = new Set(["PEY_API_KEY_ADRIAN", "PEY_API_KEY_SANTIAGO", "PEY_API_KEY_MIRIAM"]);

export function toPublicStory(story: StoryWithStats): PublicStory {
  const showExampleBadge = Boolean(story.isExample && !LIVE_KEY_NAMES.has(story.peyKeyEnv));
  const {
    peyKeyEnv,
    peyEntity,
    peyTaxId,
    bankAccountId,
    clabe,
    contactEmail,
    previewToken,
    ...rest
  } = story;
  void peyKeyEnv;
  void peyEntity;
  void peyTaxId;
  void bankAccountId;
  void clabe;
  void contactEmail;
  void previewToken;
  return {
    ...rest,
    showExampleBadge,
    clabeRegistered: Boolean(story.bankAccountId || story.peyKeyEnv),
  };
}
