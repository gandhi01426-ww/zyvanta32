import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_TITLE = "Zyvanta - Experience the Power of Luxury";
const SITE_DESCRIPTION =
  "Zyvanta - futuristic luxury essentials. Premium quality, fast worldwide shipping, and an elite shopping experience.";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

const SiteMeta = () => {
  const location = useLocation();

  useEffect(() => {
    const canonicalUrl = new URL(`${location.pathname}${location.search}`, window.location.origin).toString();

    document.title = SITE_TITLE;
    upsertCanonical(canonicalUrl);
    upsertMeta("name", "description", SITE_DESCRIPTION);
    upsertMeta("property", "og:title", SITE_TITLE);
    upsertMeta("property", "og:description", SITE_DESCRIPTION);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:title", SITE_TITLE);
    upsertMeta("name", "twitter:description", SITE_DESCRIPTION);
  }, [location.pathname, location.search]);

  return null;
};

export default SiteMeta;
