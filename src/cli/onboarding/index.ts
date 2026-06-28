import { ONBOARDING_SECTIONS, ONBOARDING_TITLE } from "./constants";
import type { OnboardingSection } from "./types";
import { logger as createLogger } from "../../utils";

const log = createLogger({ file: "onboarding/index.ts", isLogging: false });

const joinSection = (section: OnboardingSection): string => {
  const lines = [section.title, ""].concat(section.lines);
  return lines.join("\n");
};

export const buildOnboardingText = (): string => {
  const sections = ONBOARDING_SECTIONS.map(joinSection);
  return [ONBOARDING_TITLE].concat(sections).join("\n\n");
};

export const showOnboarding = (): void => {
  log.print(buildOnboardingText());
};
