export const OG_IMAGE_PATH = "/preview.jpg";

export const getOgImageUrl = (): string => `${window.location.origin}${OG_IMAGE_PATH}`;

export const getSocialImageMeta = () => {
  const imageUrl = getOgImageUrl();

  return [
    { property: "og:image", content: imageUrl },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: imageUrl },
  ];
};
