export interface SocialLink {
  name: string;
  url: string;
  description: string;
  icon: string;
}

export const socialLinks: SocialLink[] = [
  {
    name: "YouTube",
    url: "https://www.youtube.com/@nelvOfficial?sub_confirmation=1",
    description: "Releases, tutorials, behind-the-scenes.",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg"
  },
  {
    name: "Spotify",
    url: "https://open.spotify.com/artist/0IemFhBfgnPjX9lSfaI8GN",
    description: "Releases, radio, podcasts.",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/spotify.svg"
  },
  {
    name: "Instagram",
    url: "https://instagram.com/divadlen",
    description: "Visual work and stories. Follow to DM.",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
  },
  {
    name: "X (Twitter)",
    url: "https://x.com/nelvOfficial",
    description: "Latest news, thoughts. Follow to DM.",
    icon: "https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg"
  },
]; 