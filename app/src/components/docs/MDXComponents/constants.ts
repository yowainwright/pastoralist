export const IMGIX_BASE_URL = "https://yowainwright.imgix.net";
export const EPISODE_VIDEO_PATH = (slug: string) =>
  `${IMGIX_BASE_URL}/pastoralist/episodes/${slug}/final.mp4`;
