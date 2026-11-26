const windowed = (anchors, current, total) => {
  const pages = [...new Set(anchors)].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items = [];
  pages.forEach((page, i) => {
    if (i > 0 && page - pages[i - 1] > 1) items.push({ ellipsis: true });
    items.push({ page, current: page === current });
  });
  return items;
};

export function pageItems(current, total) {
  return {
    wide: windowed([1, 2, current - 1, current, current + 1, total - 1, total], current, total),
    narrow: windowed([1, current, total], current, total),
  };
}
