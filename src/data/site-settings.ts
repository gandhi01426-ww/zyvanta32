export type SiteSettings = {
  email: string;
  phone: string;
  instagram_handle: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  twitter_url: string;
  company_name: string;
  office_address: string;
  map_query: string;
  footer_note: string;
};

export const fallbackSiteSettings: SiteSettings = {
  email: "zyvanta.co@gmail.com",
  phone: "+91 70130 14863",
  instagram_handle: "@zyvanta.co",
  instagram_url: "https://www.instagram.com/zyvanta.co?igsh=cmlzbGN4bGJ0NHh6",
  facebook_url: "https://facebook.com",
  youtube_url: "https://youtube.com",
  twitter_url: "https://twitter.com",
  company_name: "Zyvanta Luxe Pvt. Ltd.",
  office_address: "4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh",
  map_query: "4-4-92, Pujaripeta, Srikakulam, Andhra Pradesh, India",
  footer_note: "Crafted with obsession.",
};

export function normalizeSiteSettings(value: Partial<SiteSettings> | null | undefined): SiteSettings {
  return {
    ...fallbackSiteSettings,
    ...(value || {}),
  };
}
