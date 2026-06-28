import { ONBOARDING_SECTIONS, ONBOARDING_TITLE } from "./constants";
import type { OnboardingSection } from "./types";

const joinSection = (section: OnboardingSection): string => {
  const lines = [section.title, "", ...section.lines];
  return lines.join("\n");
};

export const buildOnboardingText = (): string => {
  const sections = ONBOARDING_SECTIONS.map(joinSection);
  return [ONBOARDING_TITLE, ...sections].join("\n\n");
};

export const showOnboarding = (): void => {
  console.log(buildOnboardingText());
};
