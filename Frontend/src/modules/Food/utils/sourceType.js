export const normalizeVendorType = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  const compact = raw.replace(/[_\-\s]+/g, "");

  if (
    compact === "homekitchen" ||
    compact === "cloudkitchen" ||
    compact === "kitchen"
  ) {
    return "home_kitchen";
  }

  return "restaurant";
};

export const getSourceLabelFromVendorType = (vendorType) =>
  vendorType === "home_kitchen" ? "Home Kitchen" : "Restaurant";

export const getSourceMeta = (candidate = {}) => {
  const vendorTypeRaw =
    candidate?.vendorType || candidate?.businessModel || candidate?.sourceLabel || "";
  const vendorType = normalizeVendorType(vendorTypeRaw);
  const sourceLabel = getSourceLabelFromVendorType(vendorType);

  return {
    vendorType,
    sourceLabel,
    businessModel: sourceLabel,
  };
};
